package apiclient

import (
	"bufio"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"time"
)

type Authenticator interface {
	AuthenticateRequest(req *http.Request) error
}

type QueryArgAuth struct {
	arg string
	key string
}

func NewQueryArgAuth(arg, key string) *QueryArgAuth {
	return &QueryArgAuth{arg: arg, key: key}
}

func (a *QueryArgAuth) AuthenticateRequest(req *http.Request) error {
	u := req.URL
	v := u.Query()
	v.Set(a.arg, a.key)
	u.RawQuery = v.Encode()
	return nil
}

type BearerAuth string

func NewBearerAuth(token string) *BearerAuth {
	a := BearerAuth(token)
	return &a
}

func (a *BearerAuth) AuthenticateRequest(req *http.Request) error {
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", string(*a)))
	return nil
}

type BasicAuth struct {
	user string
	pwd string
}

func NewBasicAuth(user, pwd string) *BasicAuth {
	return &BasicAuth{user: user, pwd: pwd}
}

func (a *BasicAuth) AuthenticateRequest(req *http.Request) error {
	req.SetBasicAuth(a.user, a.pwd)
	return nil
}

type APIClient struct {
	BaseURL *url.URL
	CacheDirectory string
	MaxCacheTime time.Duration
	MaxRequestsPerSecond float64
	Authenticator Authenticator
	client *http.Client
	lastFetch time.Time
}

func NewAPIClient(baseUrl string, cacheDir string, maxCacheTime time.Duration, maxReqsPerSec float64, auth Authenticator) (*APIClient, error) {
	u, err := url.Parse(baseUrl)
	if err != nil {
		return nil, err
	}
	c := &APIClient{
		BaseURL: u,
		CacheDirectory: cacheDir,
		MaxCacheTime: maxCacheTime,
		MaxRequestsPerSecond: maxReqsPerSec,
		Authenticator: auth,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		lastFetch: time.Unix(0, 0),
	}
	return c, nil
}

func (c *APIClient) Client() *http.Client {
	return c.client
}

func (c *APIClient) minGap() time.Duration {
	if c.MaxRequestsPerSecond <= 0.0 {
		return time.Duration(0)
	}
	return time.Duration(int(1.0 / c.MaxRequestsPerSecond)) * time.Second
}

func ensureDir(dn string) error {
	if dn == "" {
		return errors.New("no directory specified")
	}
	st, err := os.Stat(dn)
	if err == nil {
		if st.IsDir() {
			return nil
		}
		return fmt.Errorf("%s exists but is not a directory", dn)
	}
	if !os.IsNotExist(err) {
		return err
	}
	return os.MkdirAll(dn, os.FileMode(0775))
}

func (c *APIClient) cacheFile(req *http.Request) (dn, fn string) {
	sum := sha1.Sum([]byte(req.URL.String()))
	code := hex.EncodeToString(sum[:])
	dn = filepath.Join(c.CacheDirectory, code[0:2], code[2:4])
	fn = filepath.Join(dn, code[4:])
	return dn, fn
}

func (c *APIClient) loadFromCache(req *http.Request) (*http.Response, error) {
	if req.Method != http.MethodGet {
		return nil, nil
	}
	_, fn := c.cacheFile(req)
	st, err := os.Stat(fn)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		log.Println("error checking cache:", err)
		return nil, err
	}
	if time.Now().Sub(st.ModTime()) > c.MaxCacheTime {
		//log.Println("cache file expired")
		return nil, nil
	}
	f, err := os.Open(fn)
	if f != nil {
		defer f.Close()
	}
	if err != nil {
		log.Println("error opening cache file:", err)
		return nil, err
	}
	rd := bufio.NewReader(f)
	res, err := http.ReadResponse(rd, req)
	if err != nil {
		log.Println("error reading cached response:", err)
		return nil, err
	}
	//log.Printf("using cached response from %s for %s\n", fn, req.URL.String())
	return res, nil
}

func (c *APIClient) saveToCache(res *http.Response) error {
	if res.Request.Method != http.MethodGet {
		return nil
	}
	if res.StatusCode != http.StatusOK {
		return nil
	}
	dn, fn := c.cacheFile(res.Request)
	err := ensureDir(dn)
	if err != nil {
		log.Println("error creating cache directory:", err)
		return err
	}
	resdata, err := httputil.DumpResponse(res, true)
	if err != nil {
		log.Println("error serializing response for cache:", err)
		return err
	}
	err = ioutil.WriteFile(fn, resdata, os.FileMode(0644))
	if err != nil {
		log.Println("error writing cache file:", err)
		return err
	}
	return nil
}

func (c *APIClient) RateLimit(req *http.Request) (*http.Response, error) {
	delta := c.minGap() - time.Now().Sub(c.lastFetch)
	if delta > 0 {
		time.Sleep(delta)
	}
	res, err := c.client.Do(req)
	c.lastFetch = time.Now()
	return res, err
}

func (c *APIClient) Do(req *http.Request) (*http.Response, error) {
	res, err := c.loadFromCache(req)
	if res != nil && err == nil {
		return res, nil
	}
	res, err = c.RateLimit(req)
	if err != nil {
		return res, err
	}
	err = c.saveToCache(res)
	return res, err
}

func (c *APIClient) Get(rsrc string, args url.Values) (*http.Response, error) {
	u, err := c.BaseURL.Parse(rsrc)
	if err != nil {
		return nil, err
	}
	if args != nil {
		u.RawQuery = args.Encode()
	}
	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	if c.Authenticator != nil {
		err = c.Authenticator.AuthenticateRequest(req)
		if err != nil {
			return nil, err
		}
	}
	return c.Do(req)
}

func (c *APIClient) GetObj(rsrc string, args url.Values, obj interface{}) error {
	res, err := c.Get(rsrc, args)
	if err != nil {
		return err
	}
	if res.StatusCode != http.StatusOK {
		return errors.New(res.Status)
	}
	ct := res.Header.Get("Content-Type")
	if ct != "application/json" {
		return fmt.Errorf("not a json response (%s)", ct)
	}
	data, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return err
	}
	err = json.Unmarshal(data, obj)
	if err != nil {
		return err
	}
	return nil
}

