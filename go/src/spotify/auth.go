package spotify

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"time"
)

type ClientAuth struct {
	clientId string
	clientSecret string
	token string
	expires time.Time
	client *http.Client
}

type SpotifyAuthData struct {
	AccessToken string `json:"access_token"`
	TokenType string `json:"token_type"`
	TTL int `json:"expires_in"`
}

func NewClientAuth(clientId, clientSecret string) (*ClientAuth, error) {
	c := &ClientAuth{
		clientId: clientId,
		clientSecret: clientSecret,
		token: "",
		expires: time.Now().Add(-time.Second),
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
	err := c.AuthIfNecessary()
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (c *ClientAuth) AuthenticateRequest(req *http.Request) error {
	err := c.AuthIfNecessary()
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.token))
	return nil
}

func (c *ClientAuth) AuthIfNecessary() error {
	if c.expires.After(time.Now().Add(time.Second)) {
		//log.Println("auth still valid until", c.expires.String())
		return nil
	}
	q := url.Values{}
	q.Set("grant_type", "client_credentials")
	body := bytes.NewBufferString(q.Encode())
	req, err := http.NewRequest(http.MethodPost, "https://accounts.spotify.com/api/token", body)
	if err != nil {
		log.Println("error creating auth request:", err)
		return err
	}
	req.SetBasicAuth(c.clientId, c.clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	now := time.Now()
	res, err := c.client.Do(req)
	if err != nil {
		log.Println("error submitting auth request:", err)
		return err
	}
	if res.StatusCode != http.StatusOK {
		log.Println("error in auth response:", res.Status)
		data, _ := ioutil.ReadAll(res.Body)
		log.Println(string(data))
		return errors.New(res.Status)
	}
	data, err := ioutil.ReadAll(res.Body)
	if err != nil {
		log.Println("error reading auth response:", err)
		return err
	}
	auth := &SpotifyAuthData{}
	err = json.Unmarshal(data, auth)
	if err != nil {
		log.Println("error parsing auth response:", err)
		return err
	}
	c.token = auth.AccessToken
	c.expires = now.Add(time.Duration(auth.TTL - 1) * time.Second)
	//log.Println("auth token", c.token, "expires at", c.expires.String())
	return nil
}
