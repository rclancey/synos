package itunes

import (
	//"encoding/json"
	"encoding/xml"
	"io"
	//"io/ioutil"
	"log"
	"os"
	"sort"
	"strings"
	"time"
)

type SortableTrackList []*Track

func (stl SortableTrackList) Len() int { return len(stl) }
func (stl SortableTrackList) Swap(i, j int) { stl[i], stl[j] = stl[j], stl[i] }
func (stl SortableTrackList) Less(i, j int) bool {
	a := stl[i]
	b := stl[j]
	at := a.ModDate()
	bt := b.ModDate()
	return at.Before(bt)
}

type Library struct {
	FileName string
	MajorVersion *int
	MinorVersion *int
	ApplicationVersion *string
	Date *time.Time
	Features *int
	ShowContentRatings *bool
	LibraryPersistentID *string
	MusicFolder *string
	Tracks map[string]*Track
	TrackList []*Track
	Playlists []*Playlist
	TrackIDIndex *TrackIDIndex
	TrackLocIndex map[string]*Track
	TrackIndex *TrackIndex
	PlaylistIDIndex map[string]*Playlist
	LastTrackSearch []*Track
	LastPlaylistSearch []*Playlist
	CurrentPlaylist *Playlist
	GenreIndex [][2]string
	ArtistIndex map[string][][2]string
	AlbumIndex map[AlbumKey][][2]string
	SongIndex map[SongKey][]*Track
	finder *FileFinder
}

func NewLibrary(finder *FileFinder) *Library {
	lib := &Library{}
	lib.Tracks = make(map[string]*Track)
	lib.TrackList = []*Track{}
	lib.Playlists = make([]*Playlist, 0)
	lib.TrackIDIndex = NewTrackIDIndex()
	lib.TrackLocIndex = make(map[string]*Track)
	lib.PlaylistIDIndex = make(map[string]*Playlist)
	lib.finder = finder
	return lib
}

func (lib *Library) Load(fn string) error {
	f, err := os.Open(fn)
	if err != nil {
		log.Println("error opening file", err.Error())
		return err
	}
	dec := xml.NewDecoder(f)
	lib.FileName = fn
	err = lib.Parse(dec)
	if err != nil {
		log.Println("error parsing file", err.Error())
		return err
	}
	//lib.Index()
	lib.TrackList = make([]*Track, 0, len(lib.Tracks))
	for _, t := range lib.Tracks {
		t.SetFinder(lib.finder)
		if t.Location != nil && *t.Location != "" {
			lib.TrackList = append(lib.TrackList, t)
		}
	}
	sort.Sort(SortableTrackList(lib.TrackList))
	return nil
}

func (lib *Library) Index() {
	log.Println("indexing tracks")
	lib.TrackIndex = NewTrackIndex()
	for _, t := range lib.Tracks {
		lib.TrackIndex.Add(t)
		/*
		if t.Location != nil {
			lib.TrackLocIndex[t.Path()] = t
		}
		*/
	}
	lib.GenreIndex = IndexGenres(lib)
	lib.ArtistIndex = IndexArtists(lib)
	lib.AlbumIndex = IndexAlbums(lib)
	lib.SongIndex = IndexSongs(lib)
	/*
	log.Printf("index: %d / %d\n", lib.TrackIndex.Values(), lib.TrackIndex.Keys())
	data, err := json.MarshalIndent(map[string]interface{}{
		"genreIndex": lib.GenreIndex,
		"artistIndex": lib.ArtistIndex,
		"albumIndex": lib.AlbumIndex,
		"songIndex": lib.SongIndex,
	}, "", "  ")
	if err != nil {
		log.Println("error dumping index:", err)
	} else {
		ioutil.WriteFile("libIndex.json", data, os.FileMode(0644))
	}
	*/
}

func (lib *Library) Set(key []byte, kind string, val []byte) {
	SetField(lib, key, kind, val)
}

func (lib *Library) Parse(dec *xml.Decoder) error {
	tagStack := make([]string, 0, 10)
	tagStackSize := -1
	key := make([]byte, 0)
	var val []byte
	keyStack := make([]string, 0, 10)
	keyStackSize := -1
	isKey := false
	isVal := false
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
					track, err := lib.ParseTrack(dec, key)
					if err != nil {
						return err
					}
					/*
					if track.Protected != nil && *track.Protected {
						if track.Location != nil {
							log.Println("skipping protected", *track.Location)
						}
					} else {
					*/
						if track.PersistentID != nil {
							lib.Tracks[*track.PersistentID] = track
							//lib.Tracks = append(lib.Tracks, track)
							lib.TrackIDIndex.Add(track)
						}
					/*
					}
					*/
					keyStackSize--
					tagStackSize--
				}
			} else if tagStackSize == 3 && tagStack[0] == "plist" && tagStack[1] ==  "dict" && tagStack[2] == "array" && tagStack[3] == "dict" {
				if keyStackSize >= 1 && keyStack[0] == "Playlists" {
					playlist, err := lib.ParsePlaylist(dec)
					if err != nil {
						return err
					}
					if playlist.ParentPersistentID != nil {
						parent, ok := lib.PlaylistIDIndex[*playlist.ParentPersistentID]
						if ok {
							parent.Children = append(parent.Children, playlist)
						} else {
							log.Println("warning: parent playlist not found", *playlist.ParentPersistentID)
							lib.Playlists = append(lib.Playlists, playlist)
						}
					} else {
						lib.Playlists = append(lib.Playlists, playlist)
					}
					if playlist.PlaylistPersistentID != nil {
						lib.PlaylistIDIndex[*playlist.PlaylistPersistentID] = playlist
					}
					keyStackSize--
					tagStackSize--
				}
			}
		case xml.EndElement:
			tagStackSize--
			if tagStackSize == 1 && tagStack[0] == "plist" && tagStack[1] == "dict" {
				lib.Set(key, se.Name.Local, val)
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

func (lib *Library) ParseTrack(dec *xml.Decoder, id []byte) (*Track, error) {
	track := &Track{}
	err := track.Parse(dec, id)
	if err != nil {
		return nil, err
	}
	return track, nil
}

func (lib *Library) ParsePlaylist(dec *xml.Decoder) (*Playlist, error) {
	playlist := &Playlist{}
	err := playlist.Parse(dec, lib.TrackIDIndex)
	if err != nil {
		return nil, err
	}
	if playlist.Folder != nil && *playlist.Folder {
		playlist.PlaylistItems = []*Track{}
	}
	return playlist, nil
}

func (lib *Library) FindPlaylists(name string) []*Playlist {
	playlists := make([]*Playlist, 0)
	for _, p := range lib.Playlists {
		if p.Name != nil && *p.Name == name {
			playlists = append(playlists, p)
		}
		playlists = append(playlists, p.FindByName(name)...)
	}
	return playlists
}

func (lib *Library) GetPlaylistByPath(path string) *Playlist {
	parts := strings.Split(path, "/")
	for _, p := range lib.Playlists {
		if p.Name != nil {
			if *p.Name == path {
				return p
			}
			if *p.Name == parts[0] {
				m := p.GetByPath(strings.Join(parts[1:], "/"))
				if m != nil {
					return m
				}
			}
		}
	}
	return nil
}

func (lib *Library) FindTracks(query []string) []*Track {
	return lib.TrackIndex.Search(strings.Join(query, " "))
}

func (lib *Library) CreatePlaylist(name string) *Playlist {
	return nil
}

