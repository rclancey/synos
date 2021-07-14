package api

import (
	"encoding/base64"
	"io"
	"math/rand"
	"net/http"
	hprof "net/http/pprof"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"runtime/pprof"

	H "github.com/rclancey/httpserver/v2"
)

func randStr(n int) string {
	data := make([]byte, n)
	rand.Read(data)
	return base64.StdEncoding.EncodeToString(data)[:n]
}

func DebugAPI(router H.Router, authmw H.Middleware) {
	router.GET("/status", H.HandlerFunc(StatusHandler))
	router.GET("/rawprof", H.HandlerFunc(RawPProfHandler))
	router.GET("/pprof", H.HandlerFunc(PProfHandler))
	router.GET("/hprof", http.HandlerFunc(hprof.Profile))
}

func StatusHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	mem := &runtime.MemStats{}
	runtime.ReadMemStats(mem)
	return mem, nil
}

func RawPProfHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	w.Header().Set("Content-Type", "application/octet-stream")
	w.WriteHeader(http.StatusOK)
	pprof.Lookup("heap").WriteTo(w, 0)
	return nil, nil
}

func PProfHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	name := randStr(8)
	fn := filepath.Join(os.TempDir(), name + ".pprof")
	pw, err := os.Create(fn)
	if err != nil {
		return nil, err
	}
	err = pprof.Lookup("heap").WriteTo(pw, 0)
	if err != nil {
		pw.Close()
		return nil, err
	}
	err = pw.Close()
	if err != nil {
		return nil, err
	}
	svgfn := filepath.Join(os.TempDir(), name + ".svg")
	cmd := exec.Command("go", "tool", "pprof", "-svg", "-output", svgfn, fn)
	err = cmd.Run()
	os.Remove(fn)
	if err != nil {
		os.Remove(svgfn)
		return nil, err
	}
	f, err := os.Open(svgfn)
	if err != nil {
		return nil, err
	}
	w.Header().Set("Content-Type", "image/svg+xml")
	w.WriteHeader(http.StatusOK)
	io.Copy(w, f)
	f.Close()
	return nil, nil
}

