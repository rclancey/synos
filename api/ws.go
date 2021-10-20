package api

import (
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
