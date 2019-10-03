package main

import (
	"bufio"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	fn := os.Args[1]
	username := os.Args[2]
	passwd, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		fmt.Println(err)
		os.Exit(2)
	}
	passwd = []byte(strings.TrimSpace(string(passwd)))
	ok, err := CheckHTPasswd(fn, username, string(passwd))
	if err != nil {
		fmt.Println(err)
		os.Exit(2)
	} else if ok {
		fmt.Println("OK")
		os.Exit(0)
	} else {
		fmt.Println("nope")
		os.Exit(1)
	}
}

func CheckHTPasswd(fn, username, password string) (bool, error) {
	f, err := os.Open(fn)
	if err != nil {
		return false, err
	}
	buf := bufio.NewReader(f)
	for {
		line, err := buf.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				return false, nil
			}
			return false, err
		}
		parts := strings.Split(strings.TrimSpace(line), ":")
		if len(parts) == 2 && parts[0] == username {
			err := bcrypt.CompareHashAndPassword([]byte(parts[1]), []byte(password))
			if err == nil {
				return true, nil
			}
			if err == bcrypt.ErrMismatchedHashAndPassword {
				return false, nil
			}
			return false, err
		}
	}
	return false, nil
}

