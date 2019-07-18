package httpserver

import (
	"bufio"
	"encoding/hex"
	"fmt"
	"io"
	//"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

type AuthCfg interface {
	GetAuthKey() []byte
	GetTTL() time.Duration
	Authenticate(http.ResponseWriter, *http.Request) (string, error)
	Authorize(req *http.Request, username string) bool
}

type AuthConfig struct {
	PasswordFile string `json:"htpasswd" arg:"--htpasswd"`
	AuthKey      string `json:"key"      arg:"key"`
	TTL          int    `json:"ttl"      arg:"ttl"`
	keyBytes     []byte
	authorizer   func(*http.Request, string) bool
}

func (cfg *AuthConfig) Init(serverRoot string) error {
	fn, err := makeRootAbs(serverRoot, cfg.PasswordFile)
	if err != nil {
		return err
	}
	cfg.PasswordFile = fn
	return nil
}

func (cfg *AuthConfig) GetAuthKey() []byte {
	if cfg.keyBytes == nil || len(cfg.keyBytes) != 16 {
		kb, _ := hex.DecodeString(cfg.AuthKey)
		if kb == nil {
			kb = []byte{}
		}
		if len(kb) < 16 {
			pad := make([]byte, 16 - len(kb))
			rng := rand.New(rand.NewSource(time.Now().UnixNano()))
			rng.Read(pad)
			kb = append(kb, pad...)
		}
		cfg.keyBytes = kb[:16]
	}
	return cfg.keyBytes
}

func (cfg *AuthConfig) GetTTL() time.Duration {
	return time.Duration(cfg.TTL) * time.Second
}

func (cfg *AuthConfig) SetAuthorizer(authz func(req *http.Request, username string) bool) {
	cfg.authorizer = authz
}

func (cfg *AuthConfig) Authorize(req *http.Request, username string) bool {
	if cfg.authorizer == nil {
		return true
	}
	return cfg.authorizer(req, username)
}

func (cfg *AuthConfig) Authenticate(w http.ResponseWriter, req *http.Request) (string, error) {
	username, err := cfg.GetUsername(req)
	if err != nil {
		return username, err
	}
	if username != "" {
		cfg.SetCookie(w, username)
	}
	return username, nil
}

func (cfg *AuthConfig) GetUsername(req *http.Request) (string, error) {
	username, password, ok := req.BasicAuth()
	if ok {
		ok, _ := cfg.CheckPasswd(username, password)
		if ok {
			return username, nil
		}
	} else {
		username, ok := cfg.CheckCookie(req)
		if ok {
			return username, nil
		}
	}
	return "", Unauthorized
}

func (cfg *AuthConfig) CheckPasswd(username, password string) (bool, error) {
	f, err := os.Open(cfg.PasswordFile)
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

func (cfg *AuthConfig) CheckCookie(req *http.Request) (string, bool) {
	cookie, err := req.Cookie("auth")
	if err != nil {
		//log.Println("no auth cookie")
		return "", false
	}
	claims := &jwt.StandardClaims{}
	token, err := jwt.ParseWithClaims(cookie.Value, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			//log.Printf("Unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return cfg.GetAuthKey(), nil
	})
	if err != nil {
		//log.Println("cookie login error:", err)
		return "", false
	}
	/*
	ss, err := token.SigningString()
	if err != nil {
		log.Println("error getting signing string:", err)
		return err
	}
	err = token.Method.Verify(ss, token.Signature, cfg.GetAuthKey())
	if err != nil {
		log.Println("error verifying signature:", err)
	} else {
		log.Printf("signature %s of %s is valid", token.Signature, ss)
	}
	*/
	if token.Valid && token.Claims.Valid() == nil {
		claims, isa := token.Claims.(*jwt.StandardClaims)
		if isa {
			//log.Println("valid login for", claims.Id)
			return claims.Id, true
		}
		//log.Printf("not a standard claims: %T", token.Claims)
	}
	//log.Println("invalid token:", token.Valid, token.Claims.Valid())
	return "", false
}

func (cfg *AuthConfig) SetCookie(w http.ResponseWriter, username string) {
	now := jwt.TimeFunc().Unix()
	exp := now + int64(cfg.GetTTL().Seconds())
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
		ExpiresAt: exp,
		Id: username,
		IssuedAt: now,
		NotBefore: now - 10,
		Subject: "",
	})
	tokenString, err := token.SignedString(cfg.GetAuthKey())
	if err == nil {
		cookie := &http.Cookie{
			Name: "auth",
			Value: tokenString,
			Path: "/",
			Expires: time.Unix(exp, 0),
		}
		w.Header().Add("Set-Cookie", cookie.String())
	}
}

func (cfg *AuthConfig) LoginHandler() HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) (interface{}, error) {
		username, err := cfg.Authenticate(w, req)
		if err != nil {
			return nil, err
		}
		return map[string]string{
			"status": "OK",
			"username": username,
		}, nil
	}
}

