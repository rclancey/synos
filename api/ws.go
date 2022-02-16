package api

import (
	"log"
	"net/http"
	H "github.com/rclancey/httpserver/v2"
)

var websocketHub H.Hub

func WebSocketAPI(router H.Router, authmw H.Middleware) {
	websocketHub = nil
	router.GET("/ws", authmw(H.HandlerFunc(ServeWS)))
}

func getWebsocketHub() (H.Hub, error) {
	if websocketHub != nil && !websocketHub.Closed() {
		return websocketHub, nil
	}
	hub := H.NewGenericHub(nil)
	go func() {
		hub.Run()
	}()
	websocketHub = hub
	return websocketHub, nil
}

func ServeWS(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	log.Println("websocket request")
	hub, err := getWebsocketHub()
	if err != nil {
		log.Println("error getting websocket hub", err)
		return nil, H.ServiceUnavailable.Wrap(err, "websocket not available")
	}
	log.Println("serving websocket")
	res, err := H.ServeWS(hub, w, req)
	if err != nil {
		log.Println("error serving websocket:", err)
	}
	return res, err
}
