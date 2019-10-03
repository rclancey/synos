package main

import (
	"io"
	"log"
	"net/http"

	"musicdb"
	"radio"
)

func main() {
	mediaPath := []string{
		"/Volumes/music",
		"/Volumes/MultiMedia",
		"/Users/rclancey",
	}
	finder := musicdb.NewFileFinder("Music/iTunes/iTunes Music", mediaPath, mediaPath)
	musicdb.SetGlobalFinder(finder)
	db, err := musicdb.Open("dbname=musicdb sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	var plid musicdb.PersistentID
	plidp := &plid
	err = plidp.Decode("74F00434FBD4653F")
	if err != nil {
		log.Fatal(err)
	}
	plidv, _ := plid.Value()
	log.Println("id = ", plidv)
	station, err := radio.NewPlaylistStation(db, plid, true)
	if err != nil {
		log.Fatal(err)
	}
	stream, err := radio.NewStream("test", station)
	if err != nil {
		log.Fatal(err)
	}
	handler := func(w http.ResponseWriter, req *http.Request) {
		log.Println("starting client")
		flusher, ok := w.(http.Flusher)
		if !ok {
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("can't stream to client"))
			return
		}
		c, r := stream.Connect()
		defer c.Close()
		w.Header().Set("Connection", "Keep-Alive")
		w.Header().Set("Content-Type", "audio/mpeg")
		w.Header().Set("Bitrate", "128")
		w.Header().Set("Accept-Ranges", "none")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Transfer-Encoding", "chunked")
		w.WriteHeader(http.StatusOK)
		log.Println("headers sent")
		buf := make([]byte, 4096)
		for {
			n, err := r.Read(buf)
			if err != nil {
				if err == io.EOF {
					break
				}
				log.Println("error reading from stream buffer:", err)
				return
			}
			_, err = w.Write(buf[:n])
			if err != nil {
				log.Println("error sending to client:", err)
				return
			}
			flusher.Flush()
		}
		for {
			n, err := c.Read(buf)
			if err != nil {
				log.Println("error reading from stream:", err)
				return
			}
			//log.Println("read", n, "bytes from client")
			_, err = w.Write(buf[:n])
			if err != nil {
				log.Println("error sending to client:", err)
				return
			}
			//log.Println("flushing")
			flusher.Flush()
		}
	}
	h := http.HandlerFunc(handler)
	http.ListenAndServe(":8183", h)
}
