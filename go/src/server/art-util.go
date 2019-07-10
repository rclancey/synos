package main

import (
	"errors"
	"io/ioutil"
	"log"
	"mime"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"musicdb"
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

func GetGenreImageURL(sortGenre string) (string, error) {
	if sortGenre == "" {
		return "/piano.jpg", nil
		//return "", errors.New("track has no genre")
	}
	key := strings.ReplaceAll(sortGenre, " ", "")
	img, ok := genreImages[key]
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

func GetArtistImageFilename(name string) (string, error) {
	re := regexp.MustCompile(`[^A-Za-z0-9_]`)
	bn := re.ReplaceAllString(musicdb.MakeSort(name), "")
	for _, ext := range []string{".jpg", ".png", ".gif"} {
		fn := filepath.Join(cfg.CacheDirectory, "artists", bn + ext)
		_, err := os.Stat(fn)
		if err == nil {
			return fn, nil
		}
	}
	img, ct, err := spot.GetArtistImage(name)
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

func GetAlbumArtFilename(tr *musicdb.Track) (string, error) {
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
		return "", errors.New("track has no album")
	}
	if tr.AlbumArtist != nil {
		art = *tr.AlbumArtist
	} else if tr.Artist != nil {
		art = *tr.Artist
	} else {
		return "", errors.New("track has no artist")
	}
	img, ct, err := lastFm.GetAlbumImage(art, alb)
	if err != nil {
		return "", err
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
