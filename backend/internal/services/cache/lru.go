// Package cache provides LRU caching implementations for the application.
package cache

import (
	"container/list"
	"sync"
)

// Entry represents a cached item with its key and value
type Entry struct {
	key   string
	value []byte
}

// LRUCache is a thread-safe LRU cache implementation
type LRUCache struct {
	cache     map[string]*list.Element
	list      *list.List
	capacity  int
	maxBytes  int64
	usedBytes int64
	mu        sync.RWMutex
}

// NewLRUCache creates a new LRU cache with the specified capacity
// maxBytes: maximum total size in bytes (e.g., 15*1024*1024 for 15MB)
func NewLRUCache(maxBytes int64) *LRUCache {
	return &LRUCache{
		capacity:  1000, // Max number of items
		maxBytes:  maxBytes,
		usedBytes: 0,
		cache:     make(map[string]*list.Element),
		list:      list.New(),
	}
}

// Get retrieves a value from the cache
func (c *LRUCache) Get(key string) ([]byte, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if element, found := c.cache[key]; found {
		// Move to front (most recently used)
		c.list.MoveToFront(element)
		entry := element.Value.(*Entry)
		return entry.value, true
	}

	return nil, false
}

// Put adds or updates a value in the cache
func (c *LRUCache) Put(key string, value []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()

	valueSize := int64(len(value))

	// Check if key already exists
	if element, found := c.cache[key]; found {
		// Update existing entry
		c.list.MoveToFront(element)
		entry := element.Value.(*Entry)

		// Update used bytes
		c.usedBytes -= int64(len(entry.value))
		c.usedBytes += valueSize

		entry.value = value
		return
	}

	// Evict items if we're over capacity or size limit
	for c.usedBytes+valueSize > c.maxBytes && c.list.Len() > 0 {
		c.evictOldest()
	}

	// Also evict if we're at item capacity
	for c.list.Len() >= c.capacity {
		c.evictOldest()
	}

	// Add new entry
	entry := &Entry{key: key, value: value}
	element := c.list.PushFront(entry)
	c.cache[key] = element
	c.usedBytes += valueSize
}

// evictOldest removes the least recently used item
// Must be called with lock held
func (c *LRUCache) evictOldest() {
	element := c.list.Back()
	if element != nil {
		c.list.Remove(element)
		entry := element.Value.(*Entry)
		delete(c.cache, entry.key)
		c.usedBytes -= int64(len(entry.value))
	}
}

// Clear removes all entries from the cache
func (c *LRUCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cache = make(map[string]*list.Element)
	c.list = list.New()
	c.usedBytes = 0
}

// Stats returns cache statistics
func (c *LRUCache) Stats() (items int, bytes int64, maxBytes int64) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return c.list.Len(), c.usedBytes, c.maxBytes
}
