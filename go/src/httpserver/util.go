package httpserver

import (
	"encoding/json"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
)

func SendJSON(w http.ResponseWriter, obj interface{}) {
	data, err := json.Marshal(obj)
	if err != nil {
		InternalServerError.Raise(err, "Error serializing data to JSON").Respond(w)
		return
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

func SendError(w http.ResponseWriter, err error) {
	herr, isa := err.(HTTPError)
	if !isa {
		herr = InternalServerError.Wrap(err, "")
	}
	errId, _ := uuid.NewV1()
	if herr.StatusCode() >= 500 {
		log.Println(herr.StatusCode(), "Error", herr.Message(), ":", herr.Cause())
	}
	for k, v := range herr.Headers() {
		w.Header().Set(k, v)
	}
	w.WriteHeader(herr.StatusCode())
	w.Write([]byte(herr.Message()))
}

func EnsureDir(fn string) error {
	dn := filepath.Dir(fn)
	st, err := os.Stat(dn)
	if err != nil {
		if os.IsNotExist(errors.Cause(err)) {
			return os.MkdirAll(dn, 0775)
		}
		return errors.Wrap(err, "can't stat directory " + dn)
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
			return "", errors.Wrap(err, "can't create tempfile " + fn)
		}
		fn = dst.Name()
	} else {
		err := EnsureDir(fn)
		if err != nil {
			return "", errors.Wrap(err, "can't ensure directory for " + fn)
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
			return "", errors.Wrap(err, "can't create destination file " + fn)
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
			return fn, errors.Wrap(err, "can't read source")
		}
		start = 0
		for start < rn {
			wn, err = dst.Write(chunk[start:rn])
			if err != nil {
				return fn, errors.Wrap(err, "can't write to destination")
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
			pv := reflect.New(ft)
			rv.Field(i).Set(pv)
			v = pv.Elem()
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

