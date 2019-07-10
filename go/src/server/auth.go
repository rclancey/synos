package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

var hmacSecret []byte
func init() {
	log.Println("initializing hmac secret")
	hmacSecret = make([]byte, 16)
	rand.Read(hmacSecret)
	log.Println("hmac secret =", hmacSecret)
}

func LoginHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, Unauthorized
	}
	return JSONStatusOK, nil
}

func CheckAuth(w http.ResponseWriter, req *http.Request) error {
	username, password, ok := req.BasicAuth()
	if ok {
		ok, _ := CheckHTPasswd(cfg.HTPasswdFile, username, password)
		if ok {
			SetAuthCookie(w, username, time.Duration(time.Hour * 24 * 7))
			return nil
		}
	} else {
		username, ok := CheckAuthCookie(req)
		if ok {
			SetAuthCookie(w, username, time.Duration(time.Hour * 24 * 7))
			return nil
		}
	}
	return Unauthorized
}

func CheckAuthCookie(req *http.Request) (string, bool) {
	cookie, err := req.Cookie("auth")
	if err != nil {
		log.Println("no auth cookie")
		return "", false
	}
	claims := &jwt.StandardClaims{}
	token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("Unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		log.Println("key =", hmacSecret)
		return hmacSecret, nil
	})
	if err != nil {
		log.Println("cookie login error:", err)
		return "", false
	}
	ss, err := token.SigningString()
	if err != nil {
		log.Println("error getting signing string:", err)
	}
	err = token.Method.Verify(ss, token.Signature, hmacSecret)
	if err != nil {
		log.Println("error verifying signature:", err)
	} else {
		log.Printf("signature %s of %s is valid", token.Signature, ss)
	}
	if token.Valid && token.Claims.Valid() == nil {
		claims, isa := token.Claims.(*jwt.StandardClaims)
		if isa {
			log.Println("valid login for", claims.Id)
			return claims.Id, true
		}
		log.Printf("not a standard claims: %T", token.Claims)
	}
	log.Println("invalid token:", token.Valid, token.Claims.Valid())
	return "", false
}

func SetAuthCookie(w http.ResponseWriter, username string, timeout time.Duration) {
	now := jwt.TimeFunc().Unix()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
		ExpiresAt: now + int64(timeout.Seconds()),
		Id: username,
		Audience: "synos",
		Issuer: "synos",
		IssuedAt: now,
		NotBefore: now - 10,
		Subject: "",
	})
	log.Println("signing with", hmacSecret)
	tokenString, err := token.SignedString(hmacSecret)
	if err == nil {
		cookie := &http.Cookie{
			Name: "auth",
			Value: tokenString,
			Path: "/",
			Expires: time.Unix(now + int64(timeout.Seconds()), 0),
		}
		w.Header().Add("Set-Cookie", cookie.String())
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

