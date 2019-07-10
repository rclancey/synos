package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mime"
	"os"
	"time"

	"spotify"
)

func main() {
	c, err := spotify.NewSpotifyClient(os.Args[1], os.Args[2], "./var/cache/spotify", time.Duration(0))
	if err != nil {
		fmt.Println(err)
		return
	}
	arts, err := c.SearchArtist(os.Args[3])
	if err != nil {
		fmt.Println(err)
		return
	}
	data, err := json.MarshalIndent(arts, "", "  ")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(data))
	img, ct, err := c.GetArtistImage(os.Args[3])
	if err != nil {
		fmt.Println(err)
		return
	}
	var ext string
	switch ct {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/gif":
		ext = ".gif"
	default:
		exts, err := mime.ExtensionsByType(ct)
		if err != nil && len(exts) > 0 {
			ext = exts[0]
		} else {
			ext = ".img"
		}
	}
	fn := "artist"+ext
	err = ioutil.WriteFile(fn, img, os.FileMode(0644))
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("image saved to", fn)
}

