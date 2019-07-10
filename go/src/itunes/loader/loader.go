package loader

import (
	"encoding/xml"
	"log"
	"io"
	"os"
	"reflect"
	"strconv"
	"strings"
	"time"
)

type Loader struct {
	LibraryCh chan *Library
	TrackCh chan *Track
	PlaylistCh chan *Playlist
	ErrorCh chan error
	trackIDMap map[int]uint64
}

func NewLoader() *Loader {
	return &Loader{
		LibraryCh: make(chan *Library, 20),
		TrackCh: make(chan *Track, 10),
		PlaylistCh: make(chan *Playlist, 10),
		ErrorCh: make(chan error, 10),
	}
}

func (l *Loader) Load(fn string) {
	f, err := os.Open(fn)
	if err != nil {
		l.ErrorCh <- err
		log.Println("loader errored (1)")
		return
	}
	defer f.Close()
	lib := &Library{
		FileName: &fn,
	}
	l.LibraryCh <- lib
	l.trackIDMap = map[int]uint64{}
	dec := xml.NewDecoder(f)
	err = l.parseLibrary(lib, dec)
	if err != nil {
		l.ErrorCh <- err
		log.Println("loader errored (2)")
		return
	}
	if lib.Date == nil {
		st, err := os.Stat(fn)
		if err != nil {
			l.ErrorCh <- err
			log.Println("loader errored (3)")
			return
		}
		t := st.ModTime()
		lib.Date = &t
		l.LibraryCh <- lib
	}
	l.ErrorCh <- io.EOF
	log.Println("loader finished")
}

func (l *Loader) parseLibrary(lib *Library, dec *xml.Decoder) error {
	tagStack := make([]string, 0, 10)
	tagStackSize := -1
	key := make([]byte, 0)
	var val []byte
	keyStack := make([]string, 0, 10)
	keyStackSize := -1
	isKey := false
	isVal := false
	trackCount := 0
	playlistCount := 0
	for {
		t, err := dec.Token()
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		switch se := t.(type) {
		case xml.StartElement:
			if se.Name.Local == "dict" {
				keyStackSize++
				if len(keyStack) <= keyStackSize {
					keyStack = append(keyStack, "")
				} else {
					keyStack[keyStackSize] = ""
				}
			}
			if se.Name.Local == "key" {
				isKey = true
				key = make([]byte, 0)
			} else if se.Name.Local == "integer" {
				isVal = true
				val = []byte{}
			} else if se.Name.Local == "string" {
				isVal = true
				val = []byte{}
			} else if se.Name.Local == "date" {
				isVal = true
				val = []byte{}
			}
			tagStackSize++
			if len(tagStack) <= tagStackSize {
				tagStack = append(tagStack, se.Name.Local)
			} else {
				tagStack[tagStackSize] = se.Name.Local
			}
			if tagStackSize == 3 && tagStack[0] == "plist" && tagStack[1] == "dict" && tagStack[2] == "dict" && tagStack[3] == "dict" {
				if keyStackSize >= 1 && keyStack[0] == "Tracks" {
					track := &Track{}
					err := l.parseTrack(track, dec)
					if err != nil {
						return err
					}
					id, err := strconv.Atoi(string(key))
					if err != nil {
						return err
					}
					if track.PersistentID != nil {
						l.trackIDMap[id] = *track.PersistentID
					}
					l.TrackCh <- track
					trackCount += 1
					keyStackSize--
					tagStackSize--
				}
			} else if tagStackSize == 3 && tagStack[0] == "plist" && tagStack[1] ==  "dict" && tagStack[2] == "array" && tagStack[3] == "dict" {
				if keyStackSize >= 1 && keyStack[0] == "Playlists" {
					playlist := &Playlist{}
					err := l.parsePlaylist(playlist, dec)
					if err != nil {
						return err
					}
					l.PlaylistCh <- playlist
					playlistCount += 1
					keyStackSize--
					tagStackSize--
				}
			}
		case xml.EndElement:
			tagStackSize--
			if tagStackSize == 1 && tagStack[0] == "plist" && tagStack[1] == "dict" {
				switch string(key) {
				case "Tracks":
					lib.Tracks = &trackCount
				case "Playlists":
					lib.Playlists = &playlistCount
				default:
					setField(lib, string(key), se.Name.Local, val)
				}
				l.LibraryCh <- lib
			}
			if se.Name.Local == "key" {
				keyStack[keyStackSize] = string(key)
				isKey = false
			} else if(se.Name.Local == "dict") {
				keyStackSize--
				if keyStackSize == 0 && keyStack[0] == "Playlists" {
					return nil
				}
			} else if se.Name.Local == "integer" {
				isVal = false
			} else if se.Name.Local == "string" {
				isVal = false
			} else if se.Name.Local == "date" {
				isVal = false
			}
		case xml.CharData:
			if isKey {
				key = append(key, []byte(se)...)
			} else if isVal {
				val = append(val, []byte(se)...)
			}
		}
	}
	return nil
}

func (l *Loader) parseTrack(tr *Track, dec *xml.Decoder) error {
	var key, val []byte
	isKey := false
	isVal := false
	for {
		tk, err := dec.Token()
		if err != nil {
			return err
		}
		switch se := tk.(type) {
		case xml.StartElement:
			if se.Name.Local == "key" {
				isKey = true
				key = []byte{}
			} else {
				isVal = true
				val = []byte{}
			}
		case xml.EndElement:
			switch se.Name.Local {
			case "key":
				isKey = false
			case "dict":
				return nil
			default:
				setField(tr, string(key), se.Name.Local, val)
				isVal = false
			}
		case xml.CharData:
			if isKey {
				key = append(key, []byte(se)...)
			} else if isVal {
				val = append(val, []byte(se)...)
			}
		}
	}
	return nil
}

func (l *Loader) parsePlaylist(pl *Playlist, dec *xml.Decoder) error {
	var key, val []byte
	isKey := false
	isVal := false
	isArray := false
	keyStack := make([]string, 1, 5)
	keyStackSize := 0
	keyStack[0] = ""
	for {
		t, err := dec.Token()
		if err != nil {
			return err
		}
		switch se := t.(type) {
		case xml.StartElement:
			if se.Name.Local == "key" {
				isKey = true
				key = []byte{}
			} else if se.Name.Local == "array" {
				isArray = true
			} else if se.Name.Local == "dict" {
				keyStackSize++
				if len(keyStack) <= keyStackSize {
					keyStack = append(keyStack, "")
				}
			} else {
				isVal = true
				val = []byte{}
			}
		case xml.EndElement:
			if se.Name.Local == "key" {
				keyStack[keyStackSize] = string(key)
				isKey = false
			} else if se.Name.Local == "array" {
				isArray = false
			} else if se.Name.Local == "dict" {
				keyStackSize--
				if keyStackSize < 0 {
					return nil
				}
			} else {
				if isArray {
					if se.Name.Local == "integer" && keyStackSize == 1 && keyStack[0] == "Playlist Items" && keyStack[1] == "Track ID" {
						id, _ := strconv.Atoi(string(val))
						pid, ok := l.trackIDMap[id]
						if ok {
							pl.TrackIDs = append(pl.TrackIDs, pid)
						}
					}
				} else {
					if string(key) == "Genius Track ID" {
						id, _ := strconv.Atoi(string(val))
						pid, ok := l.trackIDMap[id]
						if ok {
							pl.GeniusTrackID = &pid
						}
					} else {
						setField(pl, string(key), se.Name.Local, val)
					}
				}
				isVal = false
			}
		case xml.CharData:
			if isKey {
				key = append(key, []byte(se)...)
			} else if(isVal) {
				val = append(val, []byte(se)...)
			}
		}
	}
	return nil
}

var fieldMap = map[string]map[string]int{}

func getField(s interface{}, key string) reflect.Value {
	rv := reflect.ValueOf(s)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	if rv.Kind() != reflect.Struct {
		return reflect.Value{}
	}
	fm, ok := fieldMap[rv.Type().Name()]
	if !ok {
		fm = map[string]int{}
		fieldMap[rv.Type().Name()] = fm
	}
	idx, ok := fm[key]
	if ok {
		return rv.Field(idx)
	}
	rt := rv.Type()
	n := rt.NumField()
	xkey := strings.ToLower(strings.Replace(string(key), " ", "", -1))
	for i := 0; i < n; i++ {
		rf := rt.Field(i)
		if rf.Name == key {
			fm[key] = i
			return rv.Field(i)
		}
		if strings.Split(rf.Tag.Get("plist"), ",")[0] == key {
			fm[key] = i
			return rv.Field(i)
		}
		if strings.ToLower(rf.Name) == xkey {
			fm[key] = i
			return rv.Field(i)
		}
	}
	return reflect.Value{}
}

func setField(s interface{}, key string, kind string, val []byte) bool {
	f := getField(s, key)
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
			} else if kind == "false" {
				pval.Elem().SetBool(false)
			} else {
				return false
			}
		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			var base int
			if kind == "string" {
				base = 16
			} else if kind == "integer" {
				base = 10
			} else {
				return false
			}
			uv, err := strconv.ParseUint(string(val), base, 64)
			if err != nil {
				return false
			}
			pval.Elem().SetUint(uv)
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			var base int
			if kind == "string" {
				base = 16
			} else if kind == "integer" {
				base = 10
			} else {
				return false
			}
			iv, err := strconv.ParseInt(string(val), base, 64)
			if err != nil {
				return false
			}
			pval.Elem().SetInt(iv)
		case reflect.String:
			pval.Elem().SetString(string(val))
		default:
			vi := f.Interface()
			switch vi.(type) {
			case *time.Time:
				t, err := time.Parse("2006-01-02T15:04:05Z", string(val))
				if err != nil {
					return false
				}
				pval.Elem().Set(reflect.ValueOf(t))
			default:
				return false
			}
		}
		f.Set(pval)
		return true
	case reflect.Slice:
		if f.Type().Elem().Kind() == reflect.Uint8 {
			f.SetBytes(val)
			return true
		}
	}
	return false
}

