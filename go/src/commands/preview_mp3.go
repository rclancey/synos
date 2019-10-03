package main

import (
	"io/ioutil"
	"log"
	"os"

	"github.com/tcolgate/mp3"
)

func main() {
	d := mp3.NewDecoder(os.Stdin)
	var frame mp3.Frame
	skipped := 0
	for {
		err := d.Decode(&frame, &skipped)
		if err != nil {
			log.Fatal(err)
		}
		fp := &frame
		data, err := ioutil.ReadAll(fp.Reader())
		if err != nil {
			log.Fatal(err)
		}
		log.Println(fp.Header().BitRate(), fp.Duration(), fp.Size(), len(data), float64(int64(fp.Duration()) * int64(fp.Header().BitRate())) / 8e9)
		os.Stdout.Write(data)
	}
}
