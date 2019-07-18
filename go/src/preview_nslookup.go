package main

import (
	"fmt"
	"net"
	"os"
)

func main() {
	name := os.Args[1]
	ips, err := net.LookupIP(name)
	if err != nil {
		fmt.Println(err)
	} else {
		for _, ip := range ips {
			fmt.Println(ip.String())
		}
	}
}

