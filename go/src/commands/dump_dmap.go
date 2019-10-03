package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"dmap"
)

func main() {
	data, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		fmt.Println(err)
		return
	}
	m, err := dmap.UnmarshalDMAP(data)
	if err != nil {
		fmt.Println(err)
		return
	}
	data, err = json.MarshalIndent(m, "", "  ")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(data))
}
