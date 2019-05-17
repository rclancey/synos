package main

import (
	"errors"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"

	"itunes"
)

var genreImages = map[string]string{
	"alternative": "electric-guitar.jpg",
	"ambient": "roland-303.jpg",
	"arenarock": "electric-guitar.jpg",
	"bluegrass": "folk.jpg",
	"blues": "blues-guitar.jpg",
	"booksspoken": "",
	"cajun": "folk.jpg",
	"celtic": "celtic.jpg",
	"childrens": "kids-music.jpg",
	"childrensmusic": "kids-music.jpg",
	"christiangospel": "religious.jpg",
	"classicrock": "electric-guitar.jpg",
	"classical": "violin.jpg",
	"classics": "violin.jpg",
	"comedy": "stand-up-comedy-square.jpg",
	"country": "country.jpg",
	"countryfolk": "country.jpg",
	"dance": "disco-ball.jpg",
	"disco": "disco-ball.jpg",
	"easylistening": "crooner.jpg",
	"electronic": "roland-303.jpg",
	"emo": "guitar.jpg",
	"folk": "folk.jpg",
	"funk": "",
	"generalalternative": "electric-guitar.jpg",
	"germanpop": "",
	"gospel": "religious.jpg",
	"goth": "",
	"grunge": "citizen-dick.jpg",
	"halloween": "halloween-square.jpg",
	"hardrock": "electric-guitar.jpg",
	"hiphop": "microphone.jpg",
	"hiphoprap": "microphone.jpg",
	"holiday": "christmas-music.jpg",
	"industrial": "",
	"instrumental": "violin.jpg",
	"irishfolk": "celtic.jpg",
	"jam": "",
	"jambands": "",
	"jazz": "saxophone.jpg",
	"karaoke": "",
	"latin": "latin-music.jpg",
	"latinalternativerock": "latin-music.jpg",
	"lullabies": "kids-music.jpg",
	"mashup": "",
	"metal": "",
	"musical": "",
	"newage": "",
	"newwave": "max-headroom.jpg",
	"oldies": "jukebox-2-square.jpg",
	"opera": "violin.jpg",
	"pop": "",
	"progressiverock": "electric-guitar.jpg",
	"punk": "",
	"rb": "",
	"rbsoul": "",
	"ragtime": "",
	"reggae": "reggae.jpg",
	"religious": "religious.jpg",
	"rock": "electric-guitar.jpg",
	"rockroll": "electric-guitar.jpg",
	"rockabilly": "jukebox-2-square.jpg",
	"singersongwriter": "",
	"ska": "trombone.jpg",
	"soundtrack": "",
	"standupcomedy": "stand-up-comedy.jpg",
	"swing": "trombone.jpg",
	"trance": "roland-303.jpg",
	"tribute": "",
	"vocal": "crooner.jpg",
	"vocalpop": "crooner.jpg",
	"world": "celtic.jpg",
}

func GetGenreImageURL(tr *itunes.Track) (string, error) {
	if tr.Genre == nil {
		return "/piano.jpg", nil
		//return "", errors.New("track has no genre")
	}
	re := regexp.MustCompile(`[^A-Za-z0-9_]`)
	bn := re.ReplaceAllString(itunes.MakeKey(*tr.Genre), "")
	img, ok := genreImages[bn]
	if ok {
		if img != "" {
			return "/" + img, nil
		}
		return "/piano.jpg", nil
		//return "", errors.New("genre image missing")
	}
	return "/piano.jpg", nil
	//return "", errors.New("unknown genre")
}

func ArtistArt(w http.ResponseWriter, req *http.Request) {
	q := req.URL.Query()
	genre := itunes.MakeKey(q.Get("genre"))
	artist := itunes.MakeKey(q.Get("artist"))
	album := itunes.MakeKey("")
	key := itunes.SongKey{genre, artist, album}
	tracks := lib.SongIndex[key]
	if tracks == nil || len(tracks) == 0 {
		log.Printf("no tracks (%s) for %#v\n", tracks, key)
		NotFound.Raise(nil, "No such artist").Respond(w)
		return
	}
	if len(tracks) < 5 {
		img, err := GetGenreImageURL(tracks[0])
		if err != nil {
			NotFound.Raise(err, "no genre for single track artist").Respond(w)
		}
		http.Redirect(w, req, img, http.StatusFound)
		return
	}
	for _, tr := range tracks {
		if tr.Artist == nil {
			continue
		}
		if itunes.MakeKey(*tr.Artist) != artist {
			continue
		}
		fn, err := GetArtistImageFilename(tr)
		if err == nil {
			http.ServeFile(w, req, fn)
			return
		}
	}
	NotFound.Raise(nil, "no artist image found").Respond(w)
}

func GetArtistImageFilename(tr *itunes.Track) (string, error) {
	re := regexp.MustCompile(`[^A-Za-z0-9_]`)
	bn := re.ReplaceAllString(itunes.MakeKey(*tr.Artist), "")
	for _, ext := range []string{".jpg", ".png", ".gif"} {
		fn := filepath.Join(cfg.CacheDirectory, "artists", bn + ext)
		_, err := os.Stat(fn)
		if err == nil {
			return fn, nil
		}
	}
	img, ct, err := spot.GetArtistImage(*tr.Artist)
	if err != nil {
		return "", err
	}
	var ext string
	if ct == "image/jpeg" {
		ext = ".jpg"
	} else if ct == "image/png" {
		ext = ".png"
	} else if ct == "image/gif" {
		ext = ".gif"
	} else {
		exts, err := mime.ExtensionsByType(ct)
		if err != nil && len(exts) > 0 {
			ext = exts[0]
		} else {
			log.Println("no idea what ext to use for mime type", ct)
			ext = ".img"
		}
	}
	fn := filepath.Join(cfg.CacheDirectory, "artists", bn + ext)
	log.Printf("saving %s image to %s\n", ct, fn)
	err = ioutil.WriteFile(fn, img, os.FileMode(0644))
	if err != nil {
		return fn, err
	}
	return fn, nil
}

func GetGenericCoverFilename() (string, error) {
	return "", nil
	finder := cfg.FileFinder()
	fn := filepath.Join(os.Getenv("HOME"), "Music", "iTunes", "nocover.jpg")
	return finder.FindFile(fn)
}

func GetAlbumArtFilename(tr *itunes.Track) (string, error) {
	finder := cfg.FileFinder()
	dn := filepath.Dir(tr.Path())
	for _, x := range []string{"cover.jpg", "cover.png", "cover.gif"} {
		fn := filepath.Join(dn, x)
		fn, err := finder.FindFile(fn)
		if err == nil {
			return fn, nil
		}
	}
	var art, alb string
	if tr.Album != nil {
		alb = *tr.Album
	} else {
		fn, err := GetGenericCoverFilename()
		if err == nil {
			err = errors.New("track has no album")
		}
		return fn, err
	}
	if tr.AlbumArtist != nil {
		art = *tr.AlbumArtist
	} else if tr.Artist != nil {
		art = *tr.Artist
	} else {
		fn, err := GetGenericCoverFilename()
		if err == nil {
			err = errors.New("track has no artist")
		}
		return fn, err
	}
	img, ct, err := lastFm.GetAlbumImage(art, alb)
	if err != nil {
		fn, xerr := GetGenericCoverFilename()
		if xerr == nil {
			xerr = err
		}
		return fn, xerr
	}
	var fn string
	if ct == "image/jpeg" {
		fn = filepath.Join(dn, "cover.jpg")
	} else if ct == "image/png" {
		fn = filepath.Join(dn, "cover.png")
	} else if ct == "image/gif" {
		fn = filepath.Join(dn, "cover.gif")
	} else {
		exts, err := mime.ExtensionsByType(ct)
		if err != nil && len(exts) > 0 {
			fn = filepath.Join(dn, "cover"+exts[0])
		} else {
			log.Println("no idea what ext to use for mime type", ct)
			fn = filepath.Join(dn, "cover.img")
		}
	}
	log.Printf("saving %s image to %s\n", ct, fn)
	err = ioutil.WriteFile(fn, img, os.FileMode(0644))
	if err != nil {
		return fn, err
	}
	return fn, nil
}

func AlbumArt(w http.ResponseWriter, req *http.Request) {
	q := req.URL.Query()
	genre := itunes.MakeKey(q.Get("genre"))
	artist := itunes.MakeKey(q.Get("artist"))
	album := itunes.MakeKey(q.Get("album"))
	tracks := lib.SongIndex[itunes.SongKey{genre, artist, album}]
	if tracks == nil || len(tracks) == 0 {
		NotFound.Raise(nil, "No such album").Respond(w)
		return
	}
	//var nofn string
	for _, tr := range tracks {
		fn, err := GetAlbumArtFilename(tr)
		if err == nil {
			log.Println("serving album art image", fn)
			http.ServeFile(w, req, fn)
			return
		}
		log.Println("error getting album art:", err)
		/*
		if fn != "" && nofn == "" {
			nofn = fn
		}
		*/
	}
	http.Redirect(w, req, "/nocover.jpg", http.StatusFound)
	return
	/*
	if nofn != "" {
		http.ServeFile(w, req, nofn)
		return
	}
	NotFound.Raise(nil, "no cover art found").Respond(w)
	*/
}

func GenreArt(w http.ResponseWriter, req *http.Request) {
	q := req.URL.Query()
	genre := itunes.MakeKey(q.Get("genre"))
	re := regexp.MustCompile(`[^A-Za-z0-9_]`)
	bn := re.ReplaceAllString(genre, "")
	img, ok := genreImages[bn]
	if ok {
		if img != "" {
			http.Redirect(w, req, "/" + img, http.StatusFound)
			return
		}
	}
	http.Redirect(w, req, "/piano.jpg", http.StatusFound)
}
