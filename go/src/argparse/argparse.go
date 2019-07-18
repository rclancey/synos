package argparse

import (
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"
)

func makeArgMap(rv reflect.Value) map[string]reflect.Value {
	m := map[string]reflect.Value{}
	rt := rv.Type()
	n := rt.NumField()
	for i := 0; i < n; i++ {
		rf := rt.Field(i)
		if rf.PkgPath != "" {
			continue
		}
		tag := rf.Tag.Get("arg")
		if tag == "-" {
			continue
		}
		if tag == "" {
			tag = strings.ToLower(rf.Name)
		} else {
			tag = strings.Trim(tag, "-")
		}
		if rf.Type.Kind() == reflect.Struct {
			xm := makeArgMap(rv.Field(i))
			for k, v := range xm {
				m[tag+"-"+k] = v
			}
		} else {
			m[tag] = rv.Field(i)
		}
	}
	return m
}

func ParseArgs(recv interface{}) error {
	rv := reflect.ValueOf(recv).Elem()
	m := makeArgMap(rv)
	n := len(os.Args)
	i := 1
	for i < n {
		parts := strings.SplitN(os.Args[i], "=", 2)
		flag := strings.Trim(parts[0], "-")
		rf, ok := m[flag]
		if !ok {
			return fmt.Errorf("Unknown arg '%s'", os.Args[i])
		}
		i += 1
		switch rf.Kind() {
		case reflect.Bool:
			rf.SetBool(true)
		case reflect.String:
			if len(parts) == 2 {
				rf.SetString(parts[1])
			} else if i < n {
				rf.SetString(os.Args[i])
				i += 1
			}
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			var v string
			if len(parts) == 2 {
				v = parts[1]
			} else if i < n {
				v = os.Args[i]
				i += 1
			}
			iv, err := strconv.ParseInt(v, 10, 64)
			if err != nil {
				return err
			}
			rf.SetInt(iv)
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			var v string
			if len(parts) == 2 {
				v = parts[1]
			} else if i < n {
				v = os.Args[i]
				i += 1
			}
			iv, err := strconv.ParseUint(v, 10, 64)
			if err != nil {
				return err
			}
			rf.SetUint(iv)
		case reflect.Slice:
			vals := []string{}
			if len(parts) == 2 {
				vals = strings.Split(parts[1], ",")
			}
			for i < n && !strings.HasPrefix(os.Args[i], "-") {
				vals = append(vals, os.Args[i])
				i += 1
			}
			s := reflect.MakeSlice(rf.Elem().Type(), len(vals), len(vals))
			switch rf.Elem().Kind() {
			case reflect.String:
				for i, sv := range vals {
					s.Index(i).SetString(sv)
				}
			case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
				for i, sv := range vals {
					iv, err := strconv.ParseInt(sv, 10, 64)
					if err != nil {
						return err
					}
					s.Index(i).SetInt(iv)
				}
			case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
				for i, sv := range vals {
					iv, err := strconv.ParseUint(sv, 10, 64)
					if err != nil {
						return err
					}
					s.Index(i).SetUint(iv)
				}
			}
			rf.Set(s)
		}
	}
	return nil
}

