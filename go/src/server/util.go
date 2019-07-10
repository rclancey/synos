package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"time"

	"musicdb"
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

func ReadJSON(req *http.Request, target interface{}) error {
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return BadRequest.Raise(err, "Failed to read request payload")
	}
	err = json.Unmarshal(body, target)
	if err != nil {
		log.Println(err)
		return BadRequest.Raise(err, "Malformed JSON input")
	}
	return nil
}

func EnsureDir(fn string) error {
	dn := filepath.Dir(fn)
	st, err := os.Stat(dn)
	if err != nil {
		if os.IsNotExist(err) {
			return os.MkdirAll(dn, 0775)
		}
		return err
	}
	if !st.IsDir() {
		return os.ErrExist
	}
	return nil
}

func CopyToFile(src io.Reader, fn string, overwrite bool) (string, error) {
	var dst *os.File
	var err error
	if strings.HasPrefix(fn, "*.") {
		dst, err = ioutil.TempFile("", fn)
		if err != nil {
			return "", err
		}
		fn = dst.Name()
	} else {
		err := EnsureDir(fn)
		if err != nil {
			return "", err
		}
		st, err := os.Stat(fn)
		if err == nil {
			if !overwrite {
				return "", os.ErrExist
			}
			if st.IsDir() {
				return "", os.ErrExist
			}
		}
		dst, err = os.Create(fn)
		if err != nil {
			return "", err
		}
	}
	defer dst.Close()
	chunk := make([]byte, 8192)
	var rn, wn, start int
	for {
		rn, err = src.Read(chunk)
		if err != nil {
			if err == io.EOF {
				return fn, nil
			}
			return fn, err
		}
		start = 0
		for start < rn {
			wn, err = dst.Write(chunk[start:rn])
			if err != nil {
				return fn, err
			}
			start += wn
		}
	}
	return fn, nil
}

func QueryScan(req *http.Request, obj interface{}) error {
	qs := req.URL.Query()
	rv := reflect.ValueOf(obj)
	if rv.Kind() != reflect.Ptr {
		return errors.New("receiver is not a pointer")
	}
	rv = rv.Elem()
	if rv.Kind() != reflect.Struct {
		return errors.New("receiver is not a struct")
	}
	rt := rv.Type()
	n := rt.NumField()
	for i := 0; i < n; i++ {
		rf := rt.Field(i)
		name := rf.Tag.Get("url")
		if name == "" {
			name = strings.ToLower(rf.Name)
		}
		ss, ok := qs[name]
		if !ok {
			continue
		}
		var s string
		if len(ss) > 0 {
			s = ss[0]
		} else {
			s = ""
		}
		var v reflect.Value
		ft := rf.Type
		if ft.Kind() == reflect.Ptr {
			ft = ft.Elem()
			v = reflect.New(ft)
			rv.Field(i).Set(v)
		} else {
			v = rv.Field(i)
		}
		switch ft.Kind() {
		case reflect.String:
			v.SetString(s)
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			iv, err := strconv.ParseUint(s, 10, 64)
			if err != nil {
				return BadRequest.Raise(err, "%s param %s not an unsigned integer", name, s)
			}
			v.SetUint(iv)
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			iv, err := strconv.ParseInt(s, 10, 64)
			if err != nil {
				return BadRequest.Raise(err, "%s param %s not an integer", name, s)
			}
			v.SetInt(iv)
		case reflect.Float32, reflect.Float64:
			fv, err := strconv.ParseFloat(s, 64)
			if err != nil {
				return BadRequest.Raise(err, "%s param %s not a number", name, s)
			}
			v.SetFloat(fv)
		case reflect.Bool:
			bv, err := strconv.ParseBool(s)
			if err != nil {
				return BadRequest.Raise(err, "%s param %s not a boolean", name, s)
			}
			v.SetBool(bv)
		default:
			if ft == reflect.TypeOf(time.Time{}) {
				t, err := time.Parse("2006-01-02T15:04:05MST", s)
				if err != nil {
					return BadRequest.Raise(err, "%s param %s not a properly formatted time stamp", name, s)
				}
				v.Set(reflect.ValueOf(t))
			} else {
				return InternalServerError.Raise(nil, "bad url field %s", name)
			}
		}
	}
	return nil
}

/*
func HeaderScan(req *http.Request, obj interface{}) error {
}
*/

func getPathId(req *http.Request) (musicdb.PersistentID, error) {
	dn := req.URL.Path
	var id string
	for dn != "/" {
		dn, id = path.Split(path.Clean(dn))
		if strings.Contains(id, ".") {
			parts := strings.Split(id, ".")
			id = strings.Join(parts[:len(parts)-1], ".")
		}
		pid := new(musicdb.PersistentID)
		err := pid.Decode(id)
		if err == nil {
			return *pid, nil
		}
	}
	return musicdb.PersistentID(0), BadRequest.Raise(nil, "no id in url")
}

