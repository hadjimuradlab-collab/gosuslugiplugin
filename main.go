package main

import (
	"log"
	"net/http"

	"gosuslugiplugin/internal/directories"
)

func main() {
	store := directories.NewStore(map[string]map[string]string{
		"regions": {
			"77": "Москва",
			"78": "Санкт-Петербург",
		},
		"document_types": {
			"passport": "Паспорт РФ",
			"snils":    "СНИЛС",
		},
	})

	handler := directories.NewHandler(store)
	mux := http.NewServeMux()
	handler.Register(mux)

	log.Println("gosuslugiplugin started on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
