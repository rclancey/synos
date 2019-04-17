package lastfm

type Tag struct {
	Name string `json:"name"`
	URL string `json:"url"`
}

type TagSet struct {
	Tags []*Tag `json:"tag"`
}

type Link struct {
	Text string `json:"#text"`
	Rel string `json:"rel"`
	URL string `json:"href"`
}

type Image struct {
	Size string `json:"size"`
	URL string `json:"#text"`
}

type Wiki struct {
	Published string `json:"published"`
	Summary string `json:"summary"`
	Content string `json:"content"`
}

type Artist struct {
	Name string `json:"name"`
	MBID string `json:"mbid"`
	URL string `json:"url"`
	Image []*Image `json:"image"`
	Similar ArtistSet `json:"similar"`
	Tags TagSet `json:"tags"`
	Wiki *Wiki `json:"bio"`
}

type ArtistSet struct {
	Artists []*Artist `json:"artist"`
}

type Album struct {
	Name string `json:"name"`
	Artist string `json:"artist"`
	MBID string `json:"mbid"`
	URL string `json:"url"`
	Image []*Image `json:"image"`
	Tracks TrackSet `json:"tracks"`
	Tags TagSet `json:"tags"`
}

type Track struct {
	Name string `json:"name"`
	MBID string `json:"mbid"`
	URL string `json:"url"`
	Duration string `json:"duration"`
	Artist *Artist `json:"artist"`
	Album *Album `json:"album"`
	Tags TagSet `json:"toptags"`
	Wiki *Wiki `json:"wiki"`
}

type TrackSet struct {
	Tracks []*Track `json:"track"`
}

