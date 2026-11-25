package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testIssuer = "https://issuer.test"

type testProvider struct {
	key     *rsa.PrivateKey
	kid     atomic.Value
	fetches atomic.Int32
	srv     *httptest.Server
}

func newTestProvider(t *testing.T) *testProvider {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	p := &testProvider{key: key}
	p.kid.Store("k1")
	p.srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		p.fetches.Add(1)
		_ = json.NewEncoder(w).Encode(JWKS{Keys: []JWK{{
			Kid: p.kid.Load().(string),
			Kty: "RSA",
			N:   base64.RawURLEncoding.EncodeToString(key.N.Bytes()),
			E:   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(key.E)).Bytes()),
		}}})
	}))
	t.Cleanup(p.srv.Close)
	return p
}

func (p *testProvider) validator() *OIDCValidator {
	return &OIDCValidator{
		httpClient: p.srv.Client(),
		issuer:     testIssuer,
		audience:   "diktator",
		jwksURL:    p.srv.URL,
		minRefresh: 0,
	}
}

func (p *testProvider) sign(t *testing.T, kid string, claims jwt.MapClaims) string {
	t.Helper()
	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tok.Header["kid"] = kid
	s, err := tok.SignedString(p.key)
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"iss":   testIssuer,
		"aud":   "diktator",
		"sub":   "user-1",
		"email": "a@example.com",
		"exp":   time.Now().Add(time.Hour).Unix(),
	}
}

func TestValidateTokenAcceptsValid(t *testing.T) {
	p := newTestProvider(t)
	id, err := p.validator().ValidateSession(context.Background(), p.sign(t, "k1", validClaims()))
	if err != nil {
		t.Fatalf("valid token rejected: %v", err)
	}
	if id.ID != "user-1" || id.Email != "a@example.com" {
		t.Fatalf("unexpected identity: %+v", id)
	}
}

func TestValidateTokenRejectsBadClaims(t *testing.T) {
	cases := map[string]func(jwt.MapClaims){
		"wrong aud":   func(c jwt.MapClaims) { c["aud"] = "other" },
		"missing aud": func(c jwt.MapClaims) { delete(c, "aud") },
		"wrong iss":   func(c jwt.MapClaims) { c["iss"] = "https://evil.test" },
		"missing exp": func(c jwt.MapClaims) { delete(c, "exp") },
		"expired":     func(c jwt.MapClaims) { c["exp"] = time.Now().Add(-time.Hour).Unix() },
		"future nbf":  func(c jwt.MapClaims) { c["nbf"] = time.Now().Add(time.Hour).Unix() },
	}
	p := newTestProvider(t)
	v := p.validator()
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			c := validClaims()
			mutate(c)
			if _, err := v.ValidateSession(context.Background(), p.sign(t, "k1", c)); err == nil {
				t.Fatal("token accepted")
			}
		})
	}
}

func TestUnknownKidRefetchesOnceWithoutDeadlock(t *testing.T) {
	p := newTestProvider(t)
	v := p.validator()
	if _, err := v.getKey(context.Background(), "k1"); err != nil {
		t.Fatal(err)
	}
	p.kid.Store("k2") // provider rotates its key
	done := make(chan error, 1)
	go func() {
		_, err := v.ValidateSession(context.Background(), p.sign(t, "k2", validClaims()))
		done <- err
	}()
	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("rotated key rejected: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("deadlock: unknown kid lookup did not return")
	}
	if n := p.fetches.Load(); n != 2 {
		t.Fatalf("JWKS fetches = %d, want 2", n)
	}
}

func TestUnknownKidRefetchIsRateLimited(t *testing.T) {
	p := newTestProvider(t)
	v := p.validator()
	v.minRefresh = time.Minute
	for range 3 {
		if _, err := v.getKey(context.Background(), "nope"); err == nil {
			t.Fatal("unknown kid accepted")
		}
	}
	if n := p.fetches.Load(); n != 1 {
		t.Fatalf("JWKS fetches = %d, want 1", n)
	}
}

func TestNewOIDCValidatorRequiresAudience(t *testing.T) {
	if _, err := NewOIDCValidator(&OIDCConfig{IssuerURL: testIssuer}); err == nil {
		t.Fatal("empty audience accepted")
	}
}

func TestHangingJWKSDoesNotBlockCachedKid(t *testing.T) {
	p := newTestProvider(t)
	v := p.validator()
	if _, err := v.getKey(context.Background(), "k1"); err != nil {
		t.Fatal(err)
	}
	release := make(chan struct{})
	var once sync.Once
	hang := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-release:
		case <-r.Context().Done():
		}
	}))
	t.Cleanup(hang.Close)
	t.Cleanup(func() { once.Do(func() { close(release) }) })
	v.jwksURL = hang.URL

	go func() { _, _ = v.getKey(context.Background(), "unknown") }()
	time.Sleep(100 * time.Millisecond) // let the unknown-kid fetch reach the hanging server

	done := make(chan error, 1)
	go func() {
		_, err := v.ValidateSession(context.Background(), p.sign(t, "k1", validClaims()))
		done <- err
	}()
	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("cached kid rejected: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("cached-kid validation blocked by hanging JWKS fetch")
	}
}

func TestFailedJWKSFetchIsRateLimited(t *testing.T) {
	var fetches atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		fetches.Add(1)
		w.WriteHeader(http.StatusBadGateway)
	}))
	t.Cleanup(srv.Close)
	v := &OIDCValidator{httpClient: srv.Client(), jwksURL: srv.URL, minRefresh: time.Minute}
	for range 3 {
		if _, err := v.getKey(context.Background(), "k1"); err == nil {
			t.Fatal("key returned from failing JWKS")
		}
	}
	if n := fetches.Load(); n != 1 {
		t.Fatalf("JWKS fetches = %d, want 1", n)
	}
}

func TestNbfWithinLeewayAccepted(t *testing.T) {
	p := newTestProvider(t)
	c := validClaims()
	c["nbf"] = time.Now().Add(time.Second).Unix()
	if _, err := p.validator().ValidateSession(context.Background(), p.sign(t, "k1", c)); err != nil {
		t.Fatalf("nbf 1s ahead rejected: %v", err)
	}
}

func TestParallelColdStartFetchesOnce(t *testing.T) {
	p := newTestProvider(t)
	v := p.validator()
	v.minRefresh = time.Minute
	tok := p.sign(t, "k1", validClaims())
	var wg sync.WaitGroup
	errs := make(chan error, 20)
	for range 20 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := v.ValidateSession(context.Background(), tok)
			errs <- err
		}()
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		if err != nil {
			t.Fatalf("cold-start request rejected: %v", err)
		}
	}
	if n := p.fetches.Load(); n != 1 {
		t.Fatalf("JWKS fetches = %d, want 1", n)
	}
}

func TestFailedFirstFetchRecoversOnRetry(t *testing.T) {
	p := newTestProvider(t)
	var fail atomic.Bool
	fail.Store(true)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if fail.Load() {
			w.WriteHeader(http.StatusBadGateway)
			return
		}
		p.srv.Config.Handler.ServeHTTP(w, r)
	}))
	t.Cleanup(srv.Close)
	v := p.validator()
	v.jwksURL = srv.URL
	tok := p.sign(t, "k1", validClaims())
	if _, err := v.ValidateSession(context.Background(), tok); err == nil {
		t.Fatal("token accepted without JWKS")
	}
	fail.Store(false)
	if _, err := v.ValidateSession(context.Background(), tok); err != nil {
		t.Fatalf("retry after failed first fetch rejected: %v", err)
	}
}

func TestAgeRefreshFailureUsesCachedKeys(t *testing.T) {
	p := newTestProvider(t)
	v := p.validator()
	if _, err := v.getKey(context.Background(), "k1"); err != nil {
		t.Fatal(err)
	}
	v.jwks.FetchedAt = time.Now().Add(-time.Hour)
	p.srv.Close()
	if _, err := v.ValidateSession(context.Background(), p.sign(t, "k1", validClaims())); err != nil {
		t.Fatalf("cached key rejected while provider down: %v", err)
	}
}
