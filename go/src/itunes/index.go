package itunes

import (
	"errors"
	"fmt"
	"math/rand"
	"log"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"time"
)

type TrackList []*Track

type SortableTrackList struct {
	tl TrackList
	less func(a, b *Track) bool
}

func (stl *SortableTrackList) Len() int { return len(stl.tl) }
func (stl *SortableTrackList) Swap(i, j int) { stl.tl[i], stl.tl[j] = stl.tl[j], stl.tl[i] }
func (stl *SortableTrackList) Less(i, j int) bool {
	return stl.less(stl.tl[i], stl.tl[j])
}

func (tl *TrackList) SortBy(key string) error {
	rt := reflect.TypeOf(Track{})
	meth, ok := rt.MethodByName(key)
	stl := &SortableTrackList{tl: *tl}
	if ok {
		f := meth.Func
		if f.Type().NumIn() != 1 {
			return fmt.Errorf("can't sort by %s: method requires arguments", key)
		}
		if f.Type().NumOut() < 1 {
			return fmt.Errorf("can't sort by %s: method has no output", key)
		}
		if f.Type().Out(0).Kind() == reflect.String {
			stl.less = func(a, b *Track) bool {
				av := f.Call([]reflect.Value{reflect.ValueOf(a)})[0]
				bv := f.Call([]reflect.Value{reflect.ValueOf(b)})[0]
				return av.String() < bv.String()
			}
		} else if f.Type().Out(0) == reflect.TypeOf(time.Time{}) {
			stl.less = func(a, b *Track) bool {
				av := f.Call([]reflect.Value{reflect.ValueOf(a)})[0].Interface().(time.Time)
				bv := f.Call([]reflect.Value{reflect.ValueOf(b)})[0].Interface().(time.Time)
				return av.Before(bv)
			}
		} else if f.Type().Out(0) == reflect.TypeOf(&Time{}) {
			stl.less = func(a, b *Track) bool {
				av := f.Call([]reflect.Value{reflect.ValueOf(a)})[0].Interface().(*Time)
				bv := f.Call([]reflect.Value{reflect.ValueOf(b)})[0].Interface().(*Time)
				return av.Before(bv.Get())
			}
		} else {
			return fmt.Errorf("can't sort by %s: don't know how to compare %s", key, f.Type().Out(0).Name())
		}
	} else {
		f, ok := rt.FieldByName(key)
		if !ok {
			n := rt.NumField()
			for i := 0; i < n; i++ {
				f = rt.Field(i)
				tag := strings.Split(f.Tag.Get("json"), ",")[0]
				if tag == key {
					ok = true
					break
				}
			}
			if !ok {
				return fmt.Errorf("can't sort by %s: no such field or method", key)
			}
		}
		if f.Type == reflect.TypeOf(PersistentID(0)) {
			stl.less = func(a, b *Track) bool {
				av := reflect.ValueOf(a).FieldByIndex(f.Index).Interface().(PersistentID)
				bv := reflect.ValueOf(b).FieldByIndex(f.Index).Interface().(PersistentID)
				return uint64(av) < uint64(bv)
			}
		} else if f.Type == reflect.TypeOf(&Time{}) {
			stl.less = func(a, b *Track) bool {
				av := reflect.ValueOf(a).FieldByIndex(f.Index).Interface().(*Time)
				bv := reflect.ValueOf(b).FieldByIndex(f.Index).Interface().(*Time)
				return av.Before(bv.Get())
			}
		} else if f.Type.Kind() == reflect.Ptr {
			if f.Type.Elem().Kind() == reflect.Int {
				stl.less = func(a, b *Track) bool {
					av := reflect.ValueOf(a).FieldByIndex(f.Index)
					bv := reflect.ValueOf(b).FieldByIndex(f.Index)
					if av.IsNil() {
						return false
					}
					if bv.IsNil() {
						return true
					}
					return av.Elem().Int() < bv.Elem().Int()
				}
			} else if f.Type.Elem().Kind() == reflect.String {
				stl.less = func(a, b *Track) bool {
					av := reflect.ValueOf(a).FieldByIndex(f.Index)
					bv := reflect.ValueOf(b).FieldByIndex(f.Index)
					if av.IsNil() {
						return false
					}
					if bv.IsNil() {
						return true
					}
					return av.Elem().String() > bv.Elem().String()
				}
			} else if f.Type.Elem().Kind() == reflect.Bool {
				stl.less = func(a, b *Track) bool {
					av := reflect.ValueOf(a).FieldByIndex(f.Index)
					bv := reflect.ValueOf(b).FieldByIndex(f.Index)
					if av.IsNil() {
						return false
					}
					if bv.IsNil() {
						return true
					}
					return av.Elem().Bool() && !bv.Elem().Bool()
				}
			} else {
				return fmt.Errorf("can't sort by %s: don't know how to compare %s", key, f.Type.Elem().Name())
			}
		} else {
			return fmt.Errorf("can't sort by %s: don't know how to compare %s", key, f.Type.Name())
		}
	}
	sort.Sort(stl)
	return nil
}

func (tl *TrackList) Randomize() {
	rand.Shuffle(len(*tl), func(i, j int) { (*tl)[i], (*tl)[j] = (*tl)[j], (*tl)[i] })
}

func (tl *TrackList) Add(tr *Track) {
	*tl = append(*tl, tr)
}

func (tl *TrackList) SmartFilter(s *SmartPlaylist, lib *Library) (*TrackList, error) {
	out := &TrackList{}
	for _, tr := range *tl {
		if s.Info.CheckedOnly {
			if tr.Disabled != nil && *tr.Disabled {
				continue
			}
		}
		if s.Criteria.Match(tr, lib) {
			out.Add(tr)
		}
	}
	return out.SmartLimit(s)
}

func (tl *TrackList) SmartLimit(s *SmartPlaylist) (*TrackList, error) {
	if !s.Info.HasLimit {
		return tl, nil
	}
	if s.Info.SortField == nil || *s.Info.SortField == SelectionMethod_RANDOM {
		tl.Randomize()
	} else {
		err := tl.SortBy(s.Info.SortField.String())
		if err != nil {
			return nil, err
		}
	}
	if s.Info.LimitUnit != nil && s.Info.LimitSize != nil {
		switch *s.Info.LimitUnit {
		case LimitMethod_MINUTES:
			return tl.limitTime(int64(*s.Info.LimitSize) * 60 * 1000), nil
		case LimitMethod_MB:
			return tl.limitSize(int64(*s.Info.LimitSize) * 1024 * 1024), nil
		case LimitMethod_ITEMS:
			n := *s.Info.LimitSize
			if n >= len(*tl) {
				return tl, nil
			}
			xtl := (*tl)[:n]
			return &xtl, nil
		case LimitMethod_GB:
			return tl.limitSize(int64(*s.Info.LimitSize) * 1024 * 1024 * 1024), nil
		case LimitMethod_HOURS:
			return tl.limitTime(int64(*s.Info.LimitSize) * 60 * 60 * 1000), nil
		}
		return nil, fmt.Errorf("Unknown limit unit: %s", *s.Info.LimitUnit)
	}
	return nil, errors.New("missing limits")
}

func (tl *TrackList) limitTime(ms int64) *TrackList {
	if tl.TotalTime() <= ms {
		return tl
	}
	out := TrackList{}
	var t int64 = 0
	for _, tr := range *tl {
		if tr.TotalTime != nil {
			t += int64(*tr.TotalTime)
			if t <= ms {
				out = append(out, tr)
			} else {
				break
			}
		}
	}
	return &out
}

func (tl *TrackList) limitSize(bs int64) *TrackList {
	if tl.TotalSize() <= bs {
		return tl
	}
	out := TrackList{}
	var s int64 = 0
	for _, tr := range *tl {
		if tr.Size != nil {
			s += int64(*tr.Size)
			if s <= bs {
				out = append(out, tr)
			} else {
				break
			}
		}
	}
	return &out
}

func (tl *TrackList) TotalSize() int64 {
	var bs int64 = 0
	for _, tr := range (*tl) {
		if tr.Size != nil {
			bs += int64(*tr.Size)
		}
	}
	return bs
}

func (tl *TrackList) TotalTime() int64 {
	var ms int64 = 0
	for _, tr := range (*tl) {
		if tr.TotalTime != nil {
			ms += int64(*tr.TotalTime)
		}
	}
	return ms
}

func (tl *TrackList) compare(key string, opts ...*string) bool {
	if key == "" {
		return true
	}
	for _, opt := range opts {
		if opt != nil {
			cmp := MakeKey(*opt)
			return cmp == key
		}
	}
	return false
}

func (tl *TrackList) Filter(genre, artist, album *string) *TrackList {
	out := &TrackList{}
	if album != nil && *album != "" {
		key := MakeKey(*album)
		log.Printf("filtering %d tracks by album %s (%s)", len(*tl), *album, key)
		for _, tr := range *tl {
			if tl.compare(key, tr.SortAlbum, tr.Album) {
				out.Add(tr)
			}
		}
		return out.Filter(genre, artist, nil)
	}
	if artist != nil && *artist != "" {
		key := MakeKey(*artist)
		log.Printf("filtering %d tracks by artist %s (%s)", len(*tl), *artist, key)
		for _, tr := range *tl {
			if tl.compare(key, tr.SortAlbumArtist, tr.AlbumArtist) {
				out.Add(tr)
			} else if tl.compare(key, tr.SortArtist, tr.Artist) {
				out.Add(tr)
			}
		}
		return out.Filter(genre, nil, nil)
	}
	if genre != nil && *genre != "" {
		key := MakeKey(*genre)
		log.Printf("filtering %d tracks by genre %s (%s)", len(*tl), *genre, key)
		for _, tr := range *tl {
			if tl.compare(key, tr.Genre) {
				out.Add(tr)
			}
		}
		return out
	}
	return tl
}

type FilterTable map[string]map[string]int

func (ft FilterTable) Add(name, sname *string) {
	if name == nil {
		return
	}
	v := *name
	var k string
	if sname == nil {
		k = MakeKey(v)
	} else {
		k = MakeKey(*sname)
	}
	if k == "" {
		return
	}
	_, ok := ft[k]
	if ok {
		ft[k][v] = ft[k][v] + 1
	} else {
		ft[k] = map[string]int{v: 1}
	}
}

func (ft FilterTable) Values() [][2]string {
	keys := make([]string, len(ft))
	i := 0
	for k := range ft {
		keys[i] = k
		i += 1
	}
	sort.Strings(keys)
	filts := make([][2]string, len(keys))
	var n = 0
	var canon string
	for i, k := range keys {
		n = 0
		canon = ""
		for v, c := range ft[k] {
			if c > n {
				canon = v
				n = c
			}
		}
		filts[i] = [2]string{canon, k}
	}
	return filts
}

func (tl *TrackList) Genres() [][2]string {
	ft := FilterTable{}
	for _, tr := range *tl {
		ft.Add(tr.Genre, nil)
	}
	return ft.Values()
}

func (tl *TrackList) Artists() [][2]string {
	ft := FilterTable{}
	for _, tr := range *tl {
		ft.Add(tr.Artist, tr.SortArtist)
		ft.Add(tr.AlbumArtist, tr.SortAlbumArtist)
	}
	return ft.Values()
}

func (tl *TrackList) Albums() [][3]string {
	ft := FilterTable{}
	var key string
	var val string
	for _, tr := range *tl {
		if tr.Album == nil {
			continue
		}
		if tr.SortAlbum != nil {
			key = *tr.SortAlbum
		} else {
			key = *tr.Album
		}
		val = *tr.Album
		if tr.SortAlbumArtist != nil {
			key += " " + *tr.SortAlbumArtist
		} else if tr.AlbumArtist != nil {
			key += " " + *tr.AlbumArtist
		} else if tr.SortArtist != nil {
			key += " " + *tr.SortArtist
		} else if tr.Artist != nil {
			key += " " + *tr.Artist
		}
		if tr.AlbumArtist != nil {
			val += "|@@@|" + *tr.AlbumArtist
		} else if tr.Artist != nil {
			val += "|@@@|" + *tr.Artist
		} else {
			val += "|@@@|"
		}
		ft.Add(&val, &key)
	}
	vals := ft.Values()
	xvals := make([][3]string, len(vals))
	for i, v := range vals {
		parts := strings.Split(v[0], "|@@@|")
		xvals[i] = [3]string{parts[1], parts[0], v[1]}
	}
	return xvals
}

var aAnThe = regexp.MustCompile(`^(a|an|the) `)
var nonAlpha = regexp.MustCompile(`[^a-z0-9]+`)
var spaces = regexp.MustCompile(`\s+`)
var nums = regexp.MustCompile(`(\D*)(\d*)`)

func MakeKey(v string) string {
	if v == "" {
		return ""
	}
	s := strings.ToLower(v)
	if strings.Contains(s, " feat ") {
		s = strings.Split(s, " feat ")[0]
	} else if strings.Contains(s, " feat. ") {
		s = strings.Split(s, " feat. ")[0]
	} else if strings.Contains(s, " featuring ") {
		s = strings.Split(s, " featuring ")[0]
	} else if strings.Contains(s, " with ") {
		s = strings.Split(s, " with ")[0]
	}
	s = aAnThe.ReplaceAllString(s, "")
	s = nonAlpha.ReplaceAllString(s, "")
	s = nums.ReplaceAllString(s, " $1 ~$2 ")
	s = strings.TrimSuffix(s, " ~ ")
	s = strings.TrimSpace(s)
	//s = spaces.ReplaceAllString(s, " ")
	//s = aAnThe.ReplaceAllString(s, "")
	//s = strings.TrimSpace(s)
	return s
}
