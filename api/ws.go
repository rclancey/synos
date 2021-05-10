package main

import (
	"net/http"
	H "github.com/rclancey/httpserver"
)

func WebSocketAPI(router H.Router, authmw Middleware) {
	router.GET("/ws", H.HandlerFunc(authmw(ServeWS)))
}

var websocketHub H.Hub

func getWebsocketHub() (H.Hub, error) {
	if websocketHub != nil && !websocketHub.Closed() {
		return websocketHub, nil
	}
	websocketHub = H.NewGenericHub(nil)
	websocketHub.Run()
	return websocketHub, nil
}

func ServeWS(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	hub, err := getWebsocketHub()
	if err != nil {
		return nil, H.ServiceUnavailable.Wrap(err, "websocket not available")
	}
	return H.ServeWS(hub, w, req)
}
