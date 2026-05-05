package directories

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("/directories", h.handleDirectories)
	mux.HandleFunc("/directories/", h.handleDirectoryByPath)
}

func (h *Handler) handleDirectories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": h.store.List()})
}

func (h *Handler) handleDirectoryByPath(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/directories/")
	segments := strings.Split(path, "/")

	if len(segments) == 1 {
		h.handleDirectory(w, r, segments[0])
		return
	}

	if len(segments) == 2 {
		h.handleEntry(w, r, segments[0], segments[1])
		return
	}

	w.WriteHeader(http.StatusNotFound)
}

func (h *Handler) handleDirectory(w http.ResponseWriter, r *http.Request, name string) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	entries, err := h.store.Get(name)
	if err != nil {
		if errors.Is(err, ErrDirectoryNotFound) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"name": name, "entries": entries})
}

func (h *Handler) handleEntry(w http.ResponseWriter, r *http.Request, name, code string) {
	switch r.Method {
	case http.MethodPut:
		var payload struct {
			Value string `json:"value"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Value == "" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		h.store.UpsertEntry(name, code, payload.Value)
		writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
	case http.MethodDelete:
		if err := h.store.DeleteEntry(name, code); err != nil {
			if errors.Is(err, ErrDirectoryNotFound) {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
