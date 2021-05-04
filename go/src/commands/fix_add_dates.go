package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agnivade/levenshtein"

	"itunes/loader"
	"musicdb"
)

type File struct {
	Path string
	Track *musicdb.Track
	Dates []*musicdb.Time
	AddDate *musicdb.Time
	Extra bool
}

type Directory struct {
	Path string
	Files map[string]*File
	Date *musicdb.Time
	Purchased bool
	Extra bool
}

func findDir(fn string, lib map[string]*Directory) *Directory {
	dn := filepath.Dir(fn)
	d, ok := lib[dn]
	if ok {
		return d
	}
	bestKey := dn
	bestDist := len(dn) * 2
	for k := range lib {
		dist := levenshtein.ComputeDistance(dn, k)
		if dist < bestDist {
			bestDist = dist
			bestKey = k
		}
	}
	if bestDist < 4 && bestDist < len(dn) / 4 {
		log.Printf("match dir %s to %s\n", dn, bestKey)
		lib[dn] = lib[bestKey]
		return lib[bestKey]
	}
	d = &Directory{
		Path: dn,
		Files: map[string]*File{},
		Extra: true,
	}
	lib[dn] = d
	return d
}

func findFile(tr *musicdb.Track, lib map[string]*Directory) *File {
	fn := strings.ToLower(*tr.Location)
	d := findDir(fn, lib)
	xfn := filepath.Base(fn)
	f, ok := d.Files[xfn]
	if ok {
		return f
	}
	bestKey := fn
	bestDist := len(fn) * 2
	for k, xf := range d.Files {
		if xf.Extra {
			continue
		}
		if xf.Track.TotalTime == nil || tr.TotalTime == nil || *xf.Track.TotalTime != *tr.TotalTime {
			continue
		}
		dist := levenshtein.ComputeDistance(xfn, k)
		if dist < bestDist {
			bestDist = dist
			bestKey = k
		}
	}
	if bestDist < 4 && bestDist < len(xfn) / 4 {
		log.Printf("match file %s to %s\n", xfn, bestKey)
		d.Files[xfn] = d.Files[bestKey]
		return d.Files[bestKey]
	}
	f = &File{
		Path: xfn,
		Track: tr,
		Dates: []*musicdb.Time{},
		Extra: true,
	}
	d.Files[xfn] = f
	return f
}

func main() {
	log.SetOutput(os.Stderr)
	mediaFolder := "Music/iTunes/iTunes Music"
	mediaPath := []string{
		os.Getenv("HOME"),
		"/Volumes/music",
		"/Volumes/MultiMedia",
		"/Volumes/Video",
		"/Volumes/fattire/audio/mp3",
		"/Volumes/fattire/audio/xmp3",
		"/Volumes/guinness/mp3",
	}
	finder := musicdb.NewFileFinder(mediaFolder, mediaPath, mediaPath)
	musicdb.SetGlobalFinder(finder)
	lib := map[string]*Directory{}
	log.Println("load database")
	db, err := musicdb.Open("dbname=musicdb sslmode=disable")
	if err != nil {
		log.Println(err)
		return
	}
	tracks, err := db.Tracks(0, 0, []string{})
	if err != nil {
		log.Println(err)
		return
	}
	n := 0
	for _, tr := range tracks {
		if tr.Location == nil {
			continue
		}
		if strings.HasPrefix(*tr.Location, "http://") || strings.HasPrefix(*tr.Location, "https://") {
			continue
		}
		if tr.Kind == nil {
			continue
		}
		if *tr.Kind != "MPEG audio file" && *tr.Kind != "Protected AAC audio file" && *tr.Kind != "Purchased AAC audio file" {
			continue
		}
		n += 1
		tfn := strings.ToLower(*tr.Location)
		dn := filepath.Dir(tfn)
		d, ok := lib[dn]
		if !ok {
			d = &Directory{
				Path: dn,
				Files: map[string]*File{},
				Date: nil,
				Purchased: false,
			}
			lib[dn] = d
		}
		xfn := filepath.Base(tfn)
		f, ok := d.Files[xfn]
		if !ok {
			f = &File{
				Path: xfn,
				Track: tr,
				Dates: []*musicdb.Time{},
			}
			d.Files[xfn] = f
		}
		f.Dates = append(f.Dates, tr.DateAdded, tr.DateModified, tr.PurchaseDate, tr.PlayDate, tr.SkipDate)
	}
	log.Println(n, "tracks in db")
	for _, fn := range os.Args[1:] {
		err := loadLibFile(fn, lib)
		if err != nil {
			log.Println(fn, err)
			return
		}
	}
	for _, d := range lib {
		ds := []*musicdb.Time{}
		for _, f := range d.Files {
			if f.Track.PurchaseDate != nil {
				f.AddDate = f.Track.PurchaseDate
			} else {
				f.AddDate = minDate(f.Dates)
			}
			ds = append(ds, f.AddDate)
		}
		/*
		if filepath.Base(d.Path) != "unknown" {
			d.Date = minDate(ds)
			if d.Date != nil {
				for _, f := range d.Files {
					if f.Track.PurchaseDate == nil {
						if f.AddDate != nil && d.Date.Time().Before(f.AddDate.Time()) {
							f.AddDate = d.Date
						}
					}
				}
			}
		}
		*/
		for _, f := range d.Files {
			if f.AddDate != nil && (f.Extra || f.Track.DateAdded == nil || f.AddDate.Time().Before(f.Track.DateAdded.Time())) {
				if f.Extra {
					fmt.Printf("\t")
				} else {
					fmt.Printf("%d\t", f.Track.PersistentID.Int64())
				}
				fmt.Printf("%s\t%s\n", f.AddDate.Time().In(time.UTC).Format("20060102T150405"), *f.Track.Location)
			}
		}
	}
}

func minDate(dates []*musicdb.Time) *musicdb.Time {
	var m *musicdb.Time
	var mt time.Time
	for _, d := range dates {
		if d != nil {
			t := d.Time()
			if m == nil || t.Before(mt) {
				m = d
				mt = m.Time()
			}
		}
	}
	return m
}

func loadLibFile(fn string, lib map[string]*Directory) error {
	log.Println("lib file", fn)
	l := loader.NewLoader()
	go l.Load(fn)
	for {
		update, ok := <-l.C
		if !ok {
			return nil
		}
		switch tupdate := update.(type) {
		case *loader.Track:
			if tupdate.GetDisabled() {
				// noop
			} else if tupdate.Location == nil {
				// noop
			} else {
				tr := musicdb.TrackFromITunes(tupdate)
				if tr.Location == nil {
					continue
				}
				if strings.HasPrefix(*tr.Location, "http://") || strings.HasPrefix(*tr.Location, "https://") {
					continue
				}
				if tr.Kind == nil {
					continue
				}
				if *tr.Kind != "MPEG audio file" && *tr.Kind != "Protected AAC audio file" && *tr.Kind != "Purchased AAC audio file" {
					continue
				}
				f := findFile(tr, lib)
				f.Dates = append(f.Dates, tr.DateAdded, tr.DateModified, tr.PurchaseDate, tr.PlayDate, tr.SkipDate)
			}
		case error:
			log.Println("error in loader:", tupdate)
			l.Abort()
			return tupdate
		}
	}
	return nil
}
