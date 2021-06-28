package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	passwd, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		fmt.Println(err)
		os.Exit(2)
	}
	passwd = []byte(strings.TrimSpace(string(passwd)))
	hash, err := bcrypt.GenerateFromPassword(passwd, bcrypt.DefaultCost)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println(string(hash))
}
