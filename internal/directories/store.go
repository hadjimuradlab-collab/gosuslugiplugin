package directories

import (
	"errors"
	"sort"
	"sync"
)

var ErrDirectoryNotFound = errors.New("directory not found")

type Store struct {
	mu   sync.RWMutex
	data map[string]map[string]string
}

func NewStore(initial map[string]map[string]string) *Store {
	copied := make(map[string]map[string]string, len(initial))
	for name, entries := range initial {
		copied[name] = copyEntries(entries)
	}

	return &Store{data: copied}
}

func (s *Store) List() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	names := make([]string, 0, len(s.data))
	for name := range s.data {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func (s *Store) Get(name string) (map[string]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entries, ok := s.data[name]
	if !ok {
		return nil, ErrDirectoryNotFound
	}
	return copyEntries(entries), nil
}

func (s *Store) UpsertEntry(name, code, value string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.data[name]; !ok {
		s.data[name] = map[string]string{}
	}
	s.data[name][code] = value
}

func (s *Store) DeleteEntry(name, code string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	entries, ok := s.data[name]
	if !ok {
		return ErrDirectoryNotFound
	}
	delete(entries, code)
	return nil
}

func copyEntries(src map[string]string) map[string]string {
	copied := make(map[string]string, len(src))
	for key, value := range src {
		copied[key] = value
	}
	return copied
}
