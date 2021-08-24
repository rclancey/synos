package api

import (
	"log"
	"io"
	"net/http"
	"path"
	"strings"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/itunes/persistentId"
	"github.com/rclancey/synos/radio"
)

func RadioAPI(router H.Router, authmw H.Middleware) {
	router.GET("/radio", authmw(H.HandlerFunc(ListStations)))
	router.GET("/radio/:id", H.HandlerFunc(PlayStation))
	router.POST("/radio", authmw(H.HandlerFunc(CreateStation)))
	router.DELETE("/radio/:id", authmw(H.HandlerFunc(DeleteStation)))
}

var streams = map[string]*radio.Stream{}

func ListStations(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	vals := []*radio.Stream{}
	for _, s := range streams {
		vals = append(vals, s)
	}
	return vals, nil
}

type CreateStationMessage struct {
	StationType string `json:"type"`
	PlaylistID *pid.PersistentID `json:"playlist_id"`
	Shuffle bool `json:"shuffle"`
}

func CreateStation(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	name := path.Base(req.URL.Path)
	key := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	stream, ok := streams[key]
	if ok {
		return stream, nil
	}
	msg := &CreateStationMessage{}
	err := H.ReadJSON(req, msg)
	if err != nil {
		return nil, err
	}
	station, err := radio.NewPlaylistStation(db, *msg.PlaylistID, msg.Shuffle)
	if err != nil {
		return nil, err
	}
	stream, err = radio.NewStream(name, station)
	if err != nil {
		return nil, err
	}
	streams[key] = stream
	return stream, nil
}

func PlayStation(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	name := path.Base(req.URL.Path)
	key := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	stream, ok := streams[key]
	if !ok {
		return nil, H.NotFound.Wrapf(nil, "Station %s does not exist", name)
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		return nil, H.InternalServerError.Wrap(nil, "Connection doesn't support streaming")
	}
	c, r := stream.Connect()
	defer r.Close()
	w.Header().Set("Connection", "Keep-Alive")
	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Bitrate", "128")
	w.Header().Set("Accept-Ranges", "none")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Transfer-Encoding", "chunked")
	w.WriteHeader(http.StatusOK)
	buf := make([]byte, 4096)
	for {
		n, err := r.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			log.Println("error reading from stream buffer:", err)
			return nil, nil
		}
		_, err = w.Write(buf[:n])
		if err != nil {
			log.Println("error sending to client:", err)
			return nil, nil
		}
		flusher.Flush()
	}
	for {
		n, err := c.Read(buf)
		if err != nil {
			log.Println("error reading from stream:", err)
			return nil, nil
		}
		_, err = w.Write(buf[:n])
		if err != nil {
			log.Println("error sending to client:", err)
			return nil, nil
		}
		flusher.Flush()
	}
	return nil, nil
}

func DeleteStation(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	name := path.Base(req.URL.Path)
	key := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	stream, ok := streams[key]
	if !ok {
		return nil, H.NotFound.Wrapf(nil, "Station %s does not exist", name)
	}
	stream.Shutdown()
	return JSONStatusOK, nil
}

func RadioHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		if strings.HasSuffix(req.URL.Path, "/") {
			return ListStations(w, req)
		}
		return PlayStation(w, req)
	case http.MethodPost:
		return CreateStation(w, req)
	case http.MethodDelete:
		return DeleteStation(w, req)
	}
	return nil, H.MethodNotAllowed
}
