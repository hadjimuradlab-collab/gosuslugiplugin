package directories

import "testing"

func TestUpsertAndGet(t *testing.T) {
	store := NewStore(nil)
	store.UpsertEntry("regions", "01", "Адыгея")

	entries, err := store.Get("regions")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if entries["01"] != "Адыгея" {
		t.Fatalf("unexpected value: %q", entries["01"])
	}
}
