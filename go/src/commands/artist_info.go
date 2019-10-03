package main

import (
	"fmt"
	"os"
	"encoding/json"
	"lastfm"
)

func main() {
	artist_name := os.Args[1]
	api_key := os.Args[2]
	c := lastfm.NewLastFM(api_key)
	artist, err := c.GetArtistInfo(artist_name)
	if err != nil {
		fmt.Println(err)
	} else {
		data, err := json.MarshalIndent(artist, "", "  ")
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(string(data))
		}
	}
}

