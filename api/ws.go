package api

import (
	"net/http"
	H "github.com/rclancey/httpserver/v2"
)

func WebSocketAPI(router H.Router, authmw H.Middleware) {
	router.GET("/ws", authmw(H.HandlerFunc(ServeWS)))
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
