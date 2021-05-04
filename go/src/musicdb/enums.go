package musicdb

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"math/rand"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/goulash/audio"
	"github.com/pkg/errors"
)

type FileType audio.Codec

const (
	WAV  = FileType(audio.WAV)
	ALAC = FileType(audio.ALAC)
	FLAC = FileType(audio.FLAC)
	MP3  = FileType(audio.MP3)
	M4A  = FileType(audio.M4A)
	M4B  = FileType(audio.M4B)
	M4P  = FileType(audio.M4P)
	AAC  = FileType(audio.AAC)
	OGG  = FileType(audio.OGG)
)

var fileTypeNames = map[FileType]string{
	WAV:  "WAV",
	ALAC: "ALAC",
	FLAC: "FLAC",
	MP3:  "MP3",
	M4A:  "M4A",
	M4B:  "M4B",
	M4P:  "M4P",
	AAC:  "AAC",
	OGG:  "OGG",
}

var fileTypeValues = map[string]FileType{
	"WAV":  WAV,
	"ALAC": ALAC,
	"FLAC": FLAC,
	"MP3":  MP3,
	"M4A":  M4A,
	"M4B":  M4B,
	"M4P":  M4P,
	"AAC":  AAC,
	"OGG":  OGG,
}

var fileTypeMimeTypes = map[FileType]string{
	WAV:  "audio/wav",
	ALAC: "audio/mp4",
	FLAC: "audio/flac",
	MP3:  "audio/mpeg",
	M4A:  "audio/mp4",
	M4B:  "audio/mp4",
	M4P:  "audio/mp4",
	AAC:  "audio/aac",
	OGG:  "audio/ogg",
}

var fileTypeExts = map[FileType]string{
	WAV:  ".wav",
	ALAC: ".m4a",
	FLAC: ".flac",
	MP3:  ".mp3",
	M4A:  ".m4a",
	M4B:  ".m4b",
	M4P:  ".m4p",
	AAC:  ".m4a",
	OGG:  ".ogg",
}

func (ft FileType) String() string {
	s, ok := fileTypeNames[ft]
	if ok {
		return s
	}
	return fmt.Sprintf("FileType_0x%X", int(ft))
}

func (ft FileType) MimeType() string {
	mt, ok := fileTypeMimeTypes[ft]
	if ok {
		return mt
	}
	return "application/octet-stream"
}

func (ft FileType) FileExtension() string {
	ext, ok := fileTypeExts[ft]
	if ok {
		return ext
	}
	return ".bin"
}

func (ft FileType) MarshalJSON() ([]byte, error) {
	return json.Marshal(ft.String())
}

func (ft *FileType) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := fileTypeValues[s]
	if !ok {
		return errors.Errorf("Unknown file type '%s'", s)
	}
	*ft = v
	return nil
}

func (ft FileType) Value() (driver.Value, error) {
	return int64(ft), nil
}

func (ft *FileType) Scan(value interface{}) error {
	if value == nil {
		*ft = FileType(0)
	}
	switch v := value.(type) {
	case int64:
		*ft = FileType(audio.Codec(int(v)))
		return nil
	case string:
		x, ok := fileTypeValues[v]
		if ok {
			*ft = x
			return nil
		}
		return errors.Errorf("Unknown file type '%s'", v)
	}
	return errors.Errorf("don't know how to convert %T into file type", value)
}

type PlaylistKind int

const (
	MasterPlaylist            = PlaylistKind(-1)
	DownloadedMusicPlaylist   = PlaylistKind(-65)
	DownloadedMoviesPlaylist  = PlaylistKind(-66)
	DownloadedTVShowsPlaylist = PlaylistKind(-67)
	MoviesPlaylist            = PlaylistKind(2)
	TVShowsPlaylist           = PlaylistKind(3)
	MusicPlaylist             = PlaylistKind(4)
	AudiobooksPlaylist        = PlaylistKind(5)
	PodcastsPlaylist          = PlaylistKind(10)
	PurchasedMusicPlaylist    = PlaylistKind(19)
	FolderPlaylist            = PlaylistKind(100)
	PurchasedPlaylist         = PlaylistKind(101)
	MixPlaylist               = PlaylistKind(102)
	GeniusPlaylist            = PlaylistKind(103)
	SmartPlaylist             = PlaylistKind(104)
	StandardPlaylist          = PlaylistKind(199)
)

var playlistKindNames = map[PlaylistKind]string{
	MasterPlaylist:            "master",
	DownloadedMusicPlaylist:   "downloaded_music",
	DownloadedMoviesPlaylist:  "downloaded_movies",
	DownloadedTVShowsPlaylist: "downloaded_tvshows",
	MoviesPlaylist:            "movies",
	TVShowsPlaylist:           "tvshows",
	MusicPlaylist:             "music",
	AudiobooksPlaylist:        "audiobooks",
	PodcastsPlaylist:          "podcasts",
	PurchasedMusicPlaylist:    "purchased_music",
	FolderPlaylist:            "folder",
	PurchasedPlaylist:         "purchased",
	MixPlaylist:               "mix",
	GeniusPlaylist:            "genius",
	SmartPlaylist:             "smart",
	StandardPlaylist:          "standard",
}

var playlistKindValues = map[string]PlaylistKind{
	"master":             MasterPlaylist,
	"downloaded_music":   DownloadedMusicPlaylist,
	"downloaded_movies":  DownloadedMoviesPlaylist,
	"downloaded_tvshows": DownloadedTVShowsPlaylist,
	"movies":             MoviesPlaylist,
	"tvshows":            TVShowsPlaylist,
	"music":              MusicPlaylist,
	"audiobooks":         AudiobooksPlaylist,
	"podcasts":           PodcastsPlaylist,
	"purchased_music":    PurchasedMusicPlaylist,
	"folder":             FolderPlaylist,
	"purchased":          PurchasedPlaylist,
	"mix":                MixPlaylist,
	"genius":             GeniusPlaylist,
	"smart":              SmartPlaylist,
	"standard":           StandardPlaylist,
}

func (pk PlaylistKind) String() string {
	s, ok := playlistKindNames[pk]
	if ok {
		return s
	}
	return fmt.Sprintf("PlaylistKind_0x%X", int(pk))
}

func (pk PlaylistKind) MarshalJSON() ([]byte, error) {
	return json.Marshal(pk.String())
}

func (pk *PlaylistKind) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := playlistKindValues[s]
	if !ok {
		return errors.Errorf("Unknown playlist kind '%s'", s)
	}
	*pk = v
	return nil
}

func (pk PlaylistKind) Value() (driver.Value, error) {
	return int64(pk), nil
}

func (pk *PlaylistKind) Scan(value interface{}) error {
	if value == nil {
		*pk = StandardPlaylist
	}
	switch v := value.(type) {
	case int64:
		*pk = PlaylistKind(int(v))
		return nil
	case string:
		x, ok := playlistKindValues[v]
		if ok {
			*pk = x
			return nil
		}
		return errors.Errorf("Unknown playlist kind '%s'", v)
	}
	return errors.Errorf("don't know how to convert %T into playlist kind", value)
}

type MediaKind uint

const (
	Music      = MediaKind(0x1)
	Movie      = MediaKind(0x2)
	Podcast    = MediaKind(0x4)
	Audiobook  = MediaKind(0x8)
	MusicVideo = MediaKind(0x20)
	TVShow     = MediaKind(0x40)
	HomeVideo  = MediaKind(0x400)
	VoiceMemo  = MediaKind(0x100000)
	Book       = MediaKind(0x400000 | 0x800000)
	OtherMusic = MediaKind(0x100000 | 0x2000 | 0x100 | 0x80 | 0x20 | 0x10 | 0x1)
	UndesMusic = MediaKind(0x200000 | 0x8000 | 0x4)
	UndesOther = MediaKind(0x200000 | 0x8000 | 0x2000 | 0x4)
)

var mediaKindNames = map[MediaKind]string{
	Music:      "music",
	Movie:      "movie",
	Podcast:    "podcast",
	Audiobook:  "audiobook",
	MusicVideo: "music_video",
	TVShow:     "tv_show",
	HomeVideo:  "home_video",
	VoiceMemo:  "voice_memo",
	Book:       "book",
	OtherMusic: "other_music",
	UndesMusic: "undes_music",
	UndesOther: "undes_other",
}

var mediaKindValues = map[string]MediaKind{
	"music":       Music,
	"movie":       Movie,
	"podcast":     Podcast,
	"audiobook":   Audiobook,
	"music_video": MusicVideo,
	"tv_show":     TVShow,
	"home_video":  HomeVideo,
	"voice_memo":  VoiceMemo,
	"book":        Book,
	"other_music": OtherMusic,
	"undes_music": UndesMusic,
	"undes_other": UndesOther,
}

func (mk MediaKind) String() string {
	s, ok := mediaKindNames[mk]
	if ok {
		return s
	}
	return fmt.Sprintf("MediaKind_0x%X", uint(mk))
}

func (mk MediaKind) MarshalJSON() ([]byte, error) {
	return json.Marshal(mk.String())
}

func (mk *MediaKind) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := mediaKindValues[s]
	if !ok {
		return errors.Errorf("Unknown media kind '%s'", s)
	}
	*mk = v
	return nil
}

func (mk MediaKind) Value() (driver.Value, error) {
	return int64(mk), nil
}

func (mk *MediaKind) Scan(value interface{}) error {
	if value == nil {
		*mk = Music
	}
	switch v := value.(type) {
	case int64:
		*mk = MediaKind(uint(v))
		return nil
	case string:
		x, ok := mediaKindValues[v]
		if ok {
			*mk = x
			return nil
		}
		return errors.Errorf("Unknown media kind '%s'", v)
	}
	return errors.Errorf("don't know how to convert %T into media kind", value)
}

type Conjunction uint8

const (
	AND = Conjunction(0)
	OR  = Conjunction(1)
)

var conjunctionNames = map[Conjunction]string{
	AND: "AND",
	OR:  "OR",
}

var conjunctionValues = map[string]Conjunction{
	"AND": AND,
	"OR":  OR,
}

func (c Conjunction) String() string {
	s, ok := conjunctionNames[c]
	if ok {
		return s
	}
	return fmt.Sprintf("Conjunction_0x%X", uint8(c))
}

func (c Conjunction) MarshalJSON() ([]byte, error) {
	return json.Marshal(c.String())
}

func (c *Conjunction) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := conjunctionValues[s]
	if !ok {
		return errors.Errorf("Unknown conjunction '%s'", s)
	}
	*c = v
	return nil
}

type Unit uint8

const (
	Items   = Unit(3)
	Minutes = Unit(1)
	Hours   = Unit(4)
	MB      = Unit(2)
	GB      = Unit(5)
)

var unitNames = map[Unit]string{
	Items:   "items",
	Minutes: "minutes",
	Hours:   "hours",
	MB:      "MB",
	GB:      "GB",
}

var unitValues = map[string]Unit{
	"items":   Items,
	"minutes": Minutes,
	"hours":   Hours,
	"MB":      MB,
	"GB":      GB,
}

func (u Unit) String() string {
	s, ok := unitNames[u]
	if ok {
		return s
	}
	return fmt.Sprintf("Unit_0x%X", uint8(u))
}

func (u Unit) MarshalJSON() ([]byte, error) {
	return json.Marshal(u.String())
}

func (u *Unit) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := unitValues[s]
	if !ok {
		return errors.Errorf("Unknown unit '%s'", s)
	}
	*u = v
	return nil
}

type LogicSign uint8

const (
	POS    = LogicSign(0)
	NEG    = LogicSign(2)
	STRPOS = LogicSign(1)
	STRNEG = LogicSign(3)
)

var logicSignNames = map[LogicSign]string{
	POS:    "POS",
	NEG:    "NEG",
	STRPOS: "STRPOS",
	STRNEG: "STRNEG",
}

var logicSignValues = map[string]LogicSign{
	"POS":    POS,
	"NEG":    NEG,
	"STRPOS": STRPOS,
	"STRNEG": STRNEG,
}

func (ls LogicSign) String() string {
	s, ok := logicSignNames[ls]
	if ok {
		return s
	}
	return fmt.Sprintf("LogicSign_0x%X", uint8(ls))
}

func (ls LogicSign) MarshalJSON() ([]byte, error) {
	return json.Marshal(ls.String())
}

func (ls *LogicSign) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := logicSignValues[s]
	if !ok {
		return errors.Errorf("Unknown logic sign '%s'", s)
	}
	*ls = v
	return nil
}

type Operator uint16

const (
	IS          = Operator(1)
	CONTAINS    = Operator(2)
	STARTSWITH  = Operator(4)
	ENDSWITH    = Operator(8)
	GREATERTHAN = Operator(16)
	LESSTHAN    = Operator(64)
	BETWEEN     = Operator(256)
	WITHIN      = Operator(512)
	BITWISE     = Operator(1024)
)

var operatorNames = map[Operator]string{
	IS:          "IS",
	CONTAINS:    "CONTAINS",
	STARTSWITH:  "STARTSWITH",
	ENDSWITH:    "ENDSWITH",
	GREATERTHAN: "GREATERTHAN",
	LESSTHAN:    "LESSTHAN",
	BETWEEN:     "BETWEEN",
	WITHIN:      "WITHIN",
	BITWISE:     "BITWISE",
}

var operatorValues = map[string]Operator{
	"IS":          IS,
	"CONTAINS":    CONTAINS,
	"STARTSWITH":  STARTSWITH,
	"ENDSWITH":    ENDSWITH,
	"GREATERTHAN": GREATERTHAN,
	"LESSTHAN":    LESSTHAN,
	"BETWEEN":     BETWEEN,
	"WITHIN":      WITHIN,
	"BITWISE":     BITWISE,
}

func (o Operator) String() string {
	s, ok := operatorNames[o]
	if ok {
		return s
	}
	return fmt.Sprintf("Operator_0x%X", uint16(o))
}

func (o Operator) MarshalJSON() ([]byte, error) {
	return json.Marshal(o.String())
}

func (o *Operator) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := operatorValues[s]
	if !ok {
		return errors.Errorf("Unknown operator '%s'", s)
	}
	*o = v
	return nil
}

type RuleType uint8

const (
	RulesetRule   = RuleType(1)
	StringRule    = RuleType(2)
	IntRule       = RuleType(3)
	BooleanRule   = RuleType(4)
	DateRule      = RuleType(5)
	MediaKindRule = RuleType(6)
	PlaylistRule  = RuleType(7)
	LoveRule      = RuleType(8)
	CloudRule     = RuleType(9)
	LocationRule  = RuleType(10)
)

var ruleTypeNames = map[RuleType]string {
	RulesetRule:   "ruleset",
	StringRule:    "string",
	IntRule:       "int",
	BooleanRule:   "boolean",
	DateRule:      "date",
	MediaKindRule: "mediakind",
	PlaylistRule:  "playlist",
	LoveRule:      "love",
	CloudRule:     "cloud",
	LocationRule:  "location",
}

var ruleTypeValues = map[string]RuleType {
	"ruleset":   RulesetRule,
	"string":    StringRule,
	"int":       IntRule,
	"boolean":   BooleanRule,
	"date":      DateRule,
	"mediakind": MediaKindRule,
	"playlist":  PlaylistRule,
	"love":      LoveRule,
	"cloud":     CloudRule,
	"location":  LocationRule,
}

func (rt RuleType) String() string {
	s, ok := ruleTypeNames[rt]
	if ok {
		return s
	}
	return fmt.Sprintf("RuleType_0x%X", uint8(rt))
}

func (rt RuleType) MarshalJSON() ([]byte, error) {
	return json.Marshal(rt.String())
}

func (rt *RuleType) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := ruleTypeValues[s]
	if !ok {
		return errors.Errorf("Unknown rule type '%s'", s)
	}
	*rt = v
	return nil
}

type LimitField uint8

const (
	LimitLowestRating = 1
	LimitRandom       = 2
	LimitName         = 5
	LimitAlbum        = 6
	LimitArtist       = 7
	LimitGenre        = 9
	LimitDateAdded    = 21
	LimitPlayCount    = 25
	LimitPlayDate     = 26
	LimitRating       = 28
)

var limitFieldNames = map[LimitField]string{
	LimitLowestRating: "lowest_rating",
	LimitRandom:       "random",
	LimitName:         "name",
	LimitAlbum:        "album",
	LimitArtist:       "artist",
	LimitGenre:        "genre",
	LimitDateAdded:    "date_added",
	LimitPlayCount:    "play_count",
	LimitPlayDate:     "play_date",
	LimitRating:       "rating",
}

var limitFieldValues = map[string]LimitField{
	"lowest_rating": LimitLowestRating,
	"random":        LimitRandom,
	"name":          LimitName,
	"album":         LimitAlbum,
	"artist":        LimitArtist,
	"genre":         LimitGenre,
	"date_added":    LimitDateAdded,
	"play_count":    LimitPlayCount,
	"play_date":     LimitPlayDate,
	"rating":        LimitRating,
}

var limitFieldColumns = map[LimitField]string{
	LimitName: "track.sort_name",
	LimitAlbum: "track.sort_album",
	LimitArtist: "track.sort_artist",
	LimitGenre: "track.sort_genre",
	LimitDateAdded: "track.date_added",
	LimitPlayCount: "track.play_count",
	LimitPlayDate: "track.play_date",
	LimitRating: "track.rating",
}

func (lf LimitField) String() string {
	s, ok := limitFieldNames[lf]
	if ok {
		return s
	}
	return fmt.Sprintf("LimitField_0x%X", uint8(lf))
}

func (lf LimitField) Column(desc bool) string {
	if lf == LimitLowestRating {
		if desc {
			return "track.rating"
		}
		return "track.rating DESC"
	}
	if lf == LimitRandom {
		rv := strconv.Itoa(rand.Int() & 0xffffff)
		return "track.id % " + rv
	}
	s, ok := limitFieldColumns[lf]
	if !ok {
		return "track.id"
	}
	if desc {
		return s + " DESC"
	}
	return s
}

func (lf LimitField) MarshalJSON() ([]byte, error) {
	return json.Marshal(lf.String())
}

func (lf *LimitField) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := limitFieldValues[s]
	if !ok {
		return errors.Errorf("Unknown limit field '%s'", s)
	}
	*lf = v
	return nil
}

type Field int

const (
	AlbumField           = Field(3)
	AlbumArtist          = Field(71)
	AlbumRating          = Field(90)
	ArtistField          = Field(4)
	Comments             = Field(14)
	Composer             = Field(18)
	GenreField           = Field(8)
	Grouping             = Field(39)
	Kind                 = Field(9)
	Name                 = Field(2)
	SortAlbum            = Field(79)
	SortAlbumArtist      = Field(81)
	SortComposer         = Field(82)
	SortName             = Field(78)
	BPM                  = Field(35)
	BitRate              = Field(5)
	Compilation          = Field(31)
	DiskNumber           = Field(24)
	PlayCount            = Field(22)
	Rating               = Field(25)
	SampleRate           = Field(6)
	Size                 = Field(12)
	SkipCount            = Field(68)
	TotalTime            = Field(13)
	TrackNumber          = Field(11)
	Year                 = Field(7)
	Purchased            = Field(41)
	DateAdded            = Field(16)
	DateModified         = Field(10)
	PlayDate             = Field(23)
	SkipDate             = Field(69)
	MediaKindField       = Field(60)
	PlaylistPersistentID = Field(40)
	Loved                = Field(154)
)

var fieldNames = map[Field]string{
	AlbumField:           "album",
	AlbumArtist:          "album_artist",
	AlbumRating:          "album_rating",
	ArtistField:          "artist",
	Comments:             "comments",
	Composer:             "composer",
	GenreField:           "genre",
	Grouping:             "grouping",
	Kind:                 "kind",
	Name:                 "name",
	SortAlbum:            "sort_album",
	SortAlbumArtist:      "sort_album_artist",
	SortComposer:         "sort_composer",
	SortName:             "sort_name",
	BPM:                  "bpm",
	BitRate:              "bitrate",
	Compilation:          "compilation",
	DiskNumber:           "disk_number",
	PlayCount:            "play_count",
	Rating:               "rating",
	SampleRate:           "sample_rate",
	Size:                 "size",
	SkipCount:            "skip_count",
	TotalTime:            "total_time",
	TrackNumber:          "track_number",
	Year:                 "year",
	Purchased:            "purchased",
	DateAdded:            "date_added",
	DateModified:         "date_modified",
	PlayDate:             "play_date",
	SkipDate:             "skip_date",
	MediaKindField:       "media_kind",
	PlaylistPersistentID: "playlist_persistent_id",
	Loved:                "loved",
}

var fieldValues = map[string]Field{
	"album":                  AlbumField,
	"album_artist":           AlbumArtist,
	"album_rating":           AlbumRating,
	"artist":                 ArtistField,
	"comments":               Comments,
	"composer":               Composer,
	"genre":                  GenreField,
	"grouping":               Grouping,
	"kind":                   Kind,
	"name":                   Name,
	"sort_album":             SortAlbum,
	"sort_album_artist":      SortAlbumArtist,
	"sort_composer":          SortComposer,
	"sort_name":              SortName,
	"bpm":                    BPM,
	"bitrate":                BitRate,
	"compilation":            Compilation,
	"disk_number":            DiskNumber,
	"play_count":             PlayCount,
	"rating":                 Rating,
	"sample_rate":            SampleRate,
	"size":                   Size,
	"skip_count":             SkipCount,
	"total_time":             TotalTime,
	"track_number":           TrackNumber,
	"year":                   Year,
	"purchased":              Purchased,
	"date_added":             DateAdded,
	"date_modified":          DateModified,
	"play_date":              PlayDate,
	"skip_date":              SkipDate,
	"media_kind":             MediaKindField,
	"playlist_persistent_id": PlaylistPersistentID,
	"loved":                  Loved,
}

var fieldColumns = map[Field]string{
	AlbumField:           "track.album",
	AlbumArtist:          "track.album_artist",
	AlbumRating:          "track.album_rating",
	ArtistField:          "track.artist",
	Comments:             "track.comments",
	Composer:             "track.composer",
	GenreField:           "track.genre",
	Grouping:             "track.grouping",
	Kind:                 "track.kind",
	Name:                 "track.name",
	SortAlbum:            "track.sort_album",
	SortAlbumArtist:      "track.sort_album_artist",
	SortComposer:         "track.sort_composer",
	SortName:             "track.sort_name",
	BPM:                  "track.bpm",
	BitRate:              "track.bitrate",
	Compilation:          "track.compilation",
	DiskNumber:           "track.disk_number",
	PlayCount:            "track.play_count",
	Rating:               "track.rating",
	SampleRate:           "track.sample_rate",
	Size:                 "track.size",
	SkipCount:            "track.skip_count",
	TotalTime:            "track.total_time",
	TrackNumber:          "track.track_number",
	Year:                 "date_part('year', track.release_date)",
	Purchased:            "track.purchased",
	DateAdded:            "track.date_added",
	DateModified:         "track.date_modified",
	PlayDate:             "track.play_date",
	SkipDate:             "track.skip_date",
	MediaKindField:       "track.media_kind",
	PlaylistPersistentID: "playlist_track.playlist_id",
	Loved:                "track.loved",
}

var fieldIndices map[Field]int
var fieldTypes map[Field]reflect.Type
var fieldKinds map[Field]reflect.Kind

func init() {
	fieldIndices = map[Field]int{}
	fieldTypes = map[Field]reflect.Type{}
	fieldKinds = map[Field]reflect.Kind{}
	rt := reflect.TypeOf(Track{})
	n := rt.NumField()
	for i := 0; i < n; i++ {
		rf := rt.Field(i)
		name := rf.Name
		f, ok := fieldValues[name]
		if ok {
			fieldIndices[f] = i
			fieldTypes[f] = rf.Type
			fieldKinds[f] = rf.Type.Kind()
			continue
		}
		name = strings.Split(rf.Tag.Get("json"), ",")[0]
		f, ok = fieldValues[name]
		if ok {
			fieldIndices[f] = i
			fieldTypes[f] = rf.Type
			fieldKinds[f] = rf.Type.Kind()
		}
	}
}

func (f Field) String() string {
	s, ok := fieldNames[f]
	if ok {
		return s
	}
	return fmt.Sprintf("Field_0x%X", int(f))
}

func (f Field) Column() string {
	return fieldColumns[f]
}

func (f Field) MarshalJSON() ([]byte, error) {
	return json.Marshal(f.String())
}

func (f *Field) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	v, ok := fieldValues[s]
	if !ok {
		return errors.Errorf("Unknown field '%s'", s)
	}
	*f = v
	return nil
}

func (f Field) Index() int {
	idx, ok := fieldIndices[f]
	if !ok {
		return -1
	}
	return idx
}

func (f Field) Type() reflect.Type {
	t, ok := fieldTypes[f]
	if !ok {
		return nil
	}
	return t
}

func (f Field) Kind() reflect.Kind {
	t, ok := fieldKinds[f]
	if !ok {
		return reflect.Invalid
	}
	return t
}

func (f Field) Value(tr *Track) interface{} {
	idx := f.Index()
	if idx < 0 {
		return nil
	}
	return reflect.ValueOf(*tr).Field(idx).Interface()
}

func (f Field) StringValue(tr *Track) string {
	idx := f.Index()
	if idx < 0 {
		return ""
	}
	rf := reflect.ValueOf(*tr).Field(idx)
	if rf.Kind() == reflect.Ptr {
		if rf.IsNil() {
			return ""
		}
		rf = rf.Elem()
	}
	switch rf.Kind() {
	case reflect.String:
		return rf.String()
	case reflect.Uint64:
		pid, isa := rf.Interface().(PersistentID)
		if isa {
			return pid.String()
		}
		return strconv.FormatUint(rf.Uint(), 10)
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32:
		return strconv.FormatUint(rf.Uint(), 10)
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return strconv.FormatInt(rf.Int(), 10)
	case reflect.Bool:
		return strconv.FormatBool(rf.Bool())
	default:
		t, isa := rf.Interface().(Time)
		if isa {
			return t.Time().In(time.UTC).Format("2006-01-02T15:04:05Z")
		}
	}
	return ""
}

func (f Field) IntValue(tr *Track) int64 {
	idx := f.Index()
	if idx < 0 {
		return 0
	}
	rf := reflect.ValueOf(*tr).Field(idx)
	if rf.Kind() == reflect.Ptr {
		if rf.IsNil() {
			return 0
		}
		rf = rf.Elem()
	}
	switch rf.Kind() {
	case reflect.String:
		v, err := strconv.ParseInt(rf.String(), 10, 64)
		if err == nil {
			return v
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return int64(rf.Uint())
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return rf.Int()
	case reflect.Bool:
		if rf.Bool() {
			return 1
		}
	default:
		t, isa := rf.Interface().(Time)
		if isa {
			return int64(t)
		}
	}
	return 0
}

func (f Field) UintValue(tr *Track) uint64 {
	idx := f.Index()
	if idx < 0 {
		return 0
	}
	rf := reflect.ValueOf(*tr).Field(idx)
	if rf.Kind() == reflect.Ptr {
		if rf.IsNil() {
			return 0
		}
		rf = rf.Elem()
	}
	switch rf.Kind() {
	case reflect.String:
		v, err := strconv.ParseUint(rf.String(), 10, 64)
		if err == nil {
			return v
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return rf.Uint()
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return uint64(rf.Int())
	case reflect.Bool:
		if rf.Bool() {
			return 1
		}
	default:
		t, isa := rf.Interface().(Time)
		if isa {
			return uint64(t)
		}
	}
	return 0
}

func (f Field) BoolValue(tr *Track) bool {
	idx := f.Index()
	if idx < 0 {
		return false
	}
	rf := reflect.ValueOf(*tr).Field(idx)
	if rf.Kind() == reflect.Ptr {
		if rf.IsNil() {
			return false
		}
		rf = rf.Elem()
	}
	switch rf.Kind() {
	case reflect.String:
		v, err := strconv.ParseBool(rf.String())
		if err == nil {
			return v
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return rf.Uint() != 0
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return rf.Int() > 0
	case reflect.Bool:
		return rf.Bool()
	}
	return false
}

func (f Field) TimeValue(tr *Track) *Time {
	idx := f.Index()
	if idx < 0 {
		return nil
	}
	rf := reflect.ValueOf(*tr).Field(idx)
	if rf.Kind() == reflect.Ptr {
		if rf.IsNil() {
			return nil
		}
		rf = rf.Elem()
	}
	switch rf.Kind() {
	case reflect.String:
		tm, err := time.Parse("2006-01-02T15:04:05Z", rf.String())
		if err == nil {
			var t Time
			t.Set(tm)
			return &t
		}
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		t := Time(int64(rf.Uint()))
		return &t
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		t := Time(rf.Int())
		return &t
	}
	return nil
}

