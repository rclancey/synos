package musicdb

type Genre struct {
	SortName string `json:"sort"`
	Names map[string]int `json:"names"`
	db *DB
}

type Artist struct {
	SortName string `json:"sort"`
	Names map[string]int `json:"names"`
	db *DB
}

type Album struct {
	Artist *Artist `json:"artist"`
	SortName string `json:"sort"`
	Names map[string]int `json:"names"`
	db *DB
}

func NewGenre(name string) *Genre {
	if name == "" {
		return nil
	}
	return &Genre{SortName: MakeSort(name)}
}

func NewArtist(name string) *Artist {
	if name == "" {
		return nil
	}
	return &Artist{SortName: MakeSortArtist(name)}
}

func NewAlbum(name string, artist *Artist) *Album {
	if name == "" || artist == nil {
		return nil
	}
	return &Album{SortName: MakeSort(name), Artist: artist}
}

type SortableGenreList []*Genre
type SortableArtistList []*Artist
type SortableAlbumList []*Album

func (s SortableGenreList) Len() int { return len(s) }
func (s SortableArtistList) Len() int { return len(s) }
func (s SortableAlbumList) Len() int { return len(s) }

func (s SortableGenreList) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s SortableArtistList) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s SortableAlbumList) Swap(i, j int) { s[i], s[j] = s[j], s[i] }

func (s SortableGenreList) Less(i, j int) bool { return s[i].SortName < s[j].SortName }
func (s SortableArtistList) Less(i, j int) bool { return s[i].SortName < s[j].SortName }
func (s SortableAlbumList) Less(i, j int) bool { return s[i].SortName < s[j].SortName }
