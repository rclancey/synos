package main

import (
	//"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"itunes"
)

func main() {
	info := "AAABAwAAAAIAAAAyAAABAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
	crit := "U0xzdAABAAEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
	//infoB, _ := base64.StdEncoding.DecodeString(info)
	//critB, _ := base64.StdEncoding.DecodeString(crit)
	spl, err := itunes.ParseSmartPlaylist([]byte(info), []byte(crit))
	if err != nil {
		log.Fatal(err)
	}
	data, _ := json.Marshal(spl)
	fmt.Println(string(data))
}
