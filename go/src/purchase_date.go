package main

import (
	"fmt"
	"os"
	"time"
	"github.com/dhowden/tag"
)

func main() {
	fn := os.Args[1]
	f, err := os.Open(fn)
	if err != nil {
		fmt.Println(err)
		return
	}
	m, err := tag.ReadFrom(f)
	if err != nil {
		fmt.Println(err)
		return
	}
	/*
	v, ok := m.Raw()["purd"]
	if ok {
		fmt.Println(v)
	} else {
	*/
		d := m.Raw()
		for k, v := range d {
			s, isa := v.(string)
			if isa {
				n := len(s)
				if n > 100 {
					n = 100
				}
				fmt.Println(k, "=", s[:n])
				if k == "purd" {
					t, _ := time.Parse("2006-01-02 15:04:05", s)
					fmt.Println(t)
				}
			} else {
				fmt.Printf("%s = %v (%T)\n", k, v, v)
			}
		}
	//}
}
