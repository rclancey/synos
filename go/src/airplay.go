package main

import (
	"encoding/json"
	"fmt"
	//"net/url"
	"os"
	//"path/filepath"
	"github.com/gongo/go-airplay"
)

func main() {
	devs := airplay.Devices()
	for _, dev := range devs {
		data, err := json.MarshalIndent(dev, "", "  ")
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(string(data))
		}
	}
	if len(devs) == 0 {
		fmt.Println("no airplay devices")
		return
	}
	client, err := airplay.NewClient(&airplay.ClientParam{
		Addr: devs[0].Addr,
		Port: devs[0].Port,
		Password: "",
	})
	if err != nil {
		fmt.Println(err)
		return
	}
	info, err := client.GetPlaybackInfo()
	if err != nil {
		fmt.Println(err)
	} else {
		data, err := json.MarshalIndent(info, "", "  ")
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(string(data))
		}
	}
	if len(os.Args) < 2 {
		fmt.Println("missing url")
		return
	}
	/*
	fn, err := filepath.Abs(os.Args[1])
	if err != nil {
		fmt.Println(err)
		return
	}
	u := &url.URL{
		Scheme: "file",
		Path: fn,
	}
	fmt.Println(u.String())
	ch := client.Play(u.String())
	*/
	ch := client.Play(os.Args[1])
	fmt.Println("waiting...")
	err = <-ch
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("playing complete")
}
