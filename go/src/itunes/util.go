package itunes

import (
	//"fmt"
	"reflect"
	"strings"
	"strconv"
	"time"
)

func SetField(s interface{}, key[]byte, kind string, val []byte) bool {
	k := strings.Replace(string(key), " ", "", -1)
	v := string(val)
	rs := reflect.ValueOf(s).Elem()
	f := rs.FieldByName(k)
	if !f.IsValid() {
		return false
	}
	switch f.Kind() {
	case reflect.Ptr:
		pval := reflect.New(f.Type().Elem())
		switch pval.Elem().Kind() {
		case reflect.Bool:
			if kind == "true" {
				pval.Elem().SetBool(true)
			} else {
				pval.Elem().SetBool(false)
			}
		case reflect.Int:
			if kind == "integer" {
				iv, err := strconv.Atoi(v)
				if err == nil {
					pval.Elem().SetInt(int64(iv))
				}
			}
		case reflect.String:
			if kind == "string" {
				pval.Elem().SetString(v)
			}
		default:
			vi := f.Interface()
			//fmt.Printf("default for %s (%s) %T\n", string(key), kind, vi)
			switch vi.(type) {
			case *TrackTime:
				//fmt.Println("field is time")
				t, err := time.Parse("2006-01-02T15:04:05Z", v)
				if err != nil {
					//fmt.Printf("can't parse '%s' as a time: %s\n", v, err)
					return false
				}
				pval.Elem().Set(reflect.ValueOf(TrackTime(t)))
			default:
				//fmt.Println("field is not a time")
				return false
			}
		}
		/*
		case time.Time:
			if kind == "date" {
				it, err := time.Parse("2006-01-02T15:04:05Z", v)
				if err == nil {
					pval.SetPointer(unsafe.Pointer(&it))
				//tr := reflect.TypeOf(it).Elem()
				//f.Set(reflect.Indirect(reflect.New(tr)).Interface().(*time.Time))
			}
		default:
			return false
		}
		*/
		f.Set(pval)
		return true
	case reflect.Slice:
		if kind == "data" {
			f.SetBytes(val)
		}
		return true
	}
	return false
}

