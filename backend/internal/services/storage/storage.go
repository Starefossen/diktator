package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"time"

	"cloud.google.com/go/storage"
)

type Service struct {
	client     *storage.Client
	bucketName string
	ctx        context.Context
}

// NewService creates a new Cloud Storage service
func NewService() (*Service, error) {
	ctx := context.Background()

	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create storage client: %v", err)
	}

	bucketName := os.Getenv("STORAGE_BUCKET")
	if bucketName == "" {
		projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")
		if projectID == "" {
			projectID = "diktator-dev"
		}
		bucketName = projectID + "-audio"
	}

	return &Service{
		client:     client,
		bucketName: bucketName,
		ctx:        ctx,
	}, nil
}

// Close closes the storage client
func (s *Service) Close() error {
	return s.client.Close()
}

// UploadAudio uploads audio data to Cloud Storage
func (s *Service) UploadAudio(data []byte, filename string) (string, error) {
	bucket := s.client.Bucket(s.bucketName)
	obj := bucket.Object(filename)

	// Create a writer for the object
	w := obj.NewWriter(s.ctx)
	w.ContentType = "audio/mpeg"
	w.CacheControl = "public, max-age=86400" // Cache for 24 hours

	// Write the audio data
	if _, err := w.Write(data); err != nil {
		w.Close()
		return "", fmt.Errorf("failed to write audio data: %v", err)
	}

	// Close the writer
	if err := w.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %v", err)
	}

	// Generate the public URL
	url := fmt.Sprintf("https://storage.googleapis.com/%s/%s", s.bucketName, filename)

	log.Printf("Uploaded audio file: %s", url)
	return url, nil
}

// GetAudioURL returns the public URL for an audio file
func (s *Service) GetAudioURL(filename string) string {
	return fmt.Sprintf("https://storage.googleapis.com/%s/%s", s.bucketName, filename)
}

// DeleteAudio deletes an audio file from storage
func (s *Service) DeleteAudio(filename string) error {
	bucket := s.client.Bucket(s.bucketName)
	obj := bucket.Object(filename)

	if err := obj.Delete(s.ctx); err != nil {
		return fmt.Errorf("failed to delete audio file: %v", err)
	}

	log.Printf("Deleted audio file: %s", filename)
	return nil
}

// AudioExists checks if an audio file exists in storage
func (s *Service) AudioExists(filename string) (bool, error) {
	bucket := s.client.Bucket(s.bucketName)
	obj := bucket.Object(filename)

	_, err := obj.Attrs(s.ctx)
	if err != nil {
		if err == storage.ErrObjectNotExist {
			return false, nil
		}
		return false, err
	}

	return true, nil
}

// GetAudioData downloads audio data from storage
func (s *Service) GetAudioData(filename string) ([]byte, error) {
	bucket := s.client.Bucket(s.bucketName)
	obj := bucket.Object(filename)

	r, err := obj.NewReader(s.ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create reader: %v", err)
	}
	defer r.Close()

	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read audio data: %v", err)
	}

	return data, nil
}

// ListAudioFiles lists all audio files in the bucket
func (s *Service) ListAudioFiles(prefix string) ([]string, error) {
	bucket := s.client.Bucket(s.bucketName)
	query := &storage.Query{Prefix: prefix}

	var files []string
	it := bucket.Objects(s.ctx, query)

	for {
		attrs, err := it.Next()
		if err != nil {
			break
		}
		files = append(files, attrs.Name)
	}

	return files, nil
}

// CreateSignedURL creates a signed URL for temporary access
func (s *Service) CreateSignedURL(filename string, expiration time.Duration) (string, error) {
	opts := &storage.SignedURLOptions{
		Scheme:  storage.SigningSchemeV4,
		Method:  "GET",
		Expires: time.Now().Add(expiration),
	}

	url, err := storage.SignedURL(s.bucketName, filename, opts)
	if err != nil {
		return "", fmt.Errorf("failed to create signed URL: %v", err)
	}

	return url, nil
}
