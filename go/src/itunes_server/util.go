package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"io/ioutil"
	"net/http"
)

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
		InternalServerError.Raise(err, "Error serializing data to JSON").Respond(w)
		return
	}
	if len(data) > 25000 {
		data, err = Compress(w, data)
		if err != nil {
			InternalServerError.Raise(err, "Error compressing JSON data").Respond(w)
			return
		}
	}
	h := w.Header()
	h.Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func ReadJSON(req *http.Request, target interface{}) *HTTPError {
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return BadRequest.Raise(err, "Failed to read request payload")
	}
	err = json.Unmarshal(body, target)
	if err != nil {
		return BadRequest.Raise(err, "Malformed JSON input")
	}
	return nil
}
