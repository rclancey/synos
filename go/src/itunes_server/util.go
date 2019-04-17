package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"log"
	"net/http"
)

func HTTPError(w http.ResponseWriter, status int, text string) {
	w.WriteHeader(status)
	w.Write([]byte(text))
}

func Compress(w http.ResponseWriter, data []byte) ([]byte, error) {
	buf := bytes.NewBuffer([]byte{})
	gz := gzip.NewWriter(buf)
	_, err := gz.Write(data)
	if err != nil {
		return nil, err
	}
	err = gz.Close()
	if err != nil {
		return nil, err
	}
	h := w.Header()
	h.Set("Content-Encoding", "gzip")
	return buf.Bytes(), nil
}

func SendJSON(w http.ResponseWriter, obj interface{}) {
	data, err := json.Marshal(obj)
	if err != nil {
		log.Println(err)
		HTTPError(w, http.StatusInternalServerError, "error serializing tracks to json")
		return
	}
	if len(data) > 25000 {
		data, err = Compress(w, data)
		if err != nil {
			log.Println(err)
			HTTPError(w, http.StatusInternalServerError, "error gzipping track list")
			return
		}
	}
	h := w.Header()
	h.Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

