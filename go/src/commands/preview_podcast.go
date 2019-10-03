package main

import (
	"encoding/json"
	"log"
	"os"

	"github.com/mmcdole/gofeed"
)

func main() {
	parser := gofeed.NewParser()
	feed, err := parser.ParseURL(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	data, err := json.MarshalIndent(feed, "", "  ")
	os.Stdout.Write(data)
	os.Stdout.Write([]byte("\n"))
}

