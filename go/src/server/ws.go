package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	//"github.com/ianr0bkny/go-sonos/upnp"

	H "httpserver"
	"sonos"
)

const (
	writeWait = 10 * time.Second
	pongWait = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMessageSize = 512
)

var newline = []byte{'\n'}
var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(req *http.Request) bool {
		return true
	},
}

type Hub struct {
	clients map[*Client]bool
	Events chan interface{}
	Broadcast chan []byte
	Register chan *Client
	Unregister chan *Client
}

func NewHub(dev *sonos.Sonos) *Hub {
	return &Hub{
		Broadcast: make(chan []byte),
		Events: dev.Events,
		Register: make(chan *Client),
		Unregister: make(chan *Client),
		clients: make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	log.Println("sonos hub running")
	for {
		select {
		case client := <-h.Register:
			log.Println("registering client", client)
			h.clients[client] = true
		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
		case evt := <-h.Events:
			//svc := evt.Service()
			//typ := evt.Type()
			var info []byte
			switch event := evt.(type) {
			case *sonos.AVTransportEvent:
				//info, _ = json.MarshalIndent(event, "", "  ")
				info, _ = json.Marshal(event)
				//log.Println("AVTransportEvent:", string(info))
				//h.Broadcast <- info
			case *sonos.RenderingControlEvent:
				//info, _ = json.MarshalIndent(event, "", "  ")
				info, _ = json.Marshal(event)
				//log.Println("RenderingControlEvent:", string(info))
				//h.Broadcast <- info
			case *sonos.Queue:
				//info, _ = json.MarshalIndent(event, "", " ")
				info, _ = json.Marshal(event)
				//log.Println("QueueEvent:", string(info))
				//h.Broadcast <- info
			default:
				log.Printf("other event: %T", event)
				info = []byte(fmt.Sprintf(`{"event": "%T"}`, event))
			}
			for client := range h.clients {
				//log.Println("attempting to send", string(info), "to", client)
				select {
				case client.Send <- info:
					//log.Println("sent", string(info), "to", client)
				default:
					log.Println("can't send to client", client, "closing")
					close(client.Send)
					delete(h.clients, client)
				}
			}
		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.Send <- message:
					//log.Println("sent", string(message), "to", client)
				default:
					log.Println("can't send to client", client, "closing")
					close(client.Send)
					delete(h.clients, client)
				}
			}
		}
	}
}

type Client struct {
	hub *Hub
	conn *websocket.Conn
	Send chan []byte
}

func (c *Client) Close() {
	c.hub.Unregister <- c
	c.conn.Close()
}

func (c *Client) ReadPump() {
	defer c.Close()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("websocket read error:", err)
			break
		}
		c.hub.Broadcast <- message
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Close()
	}()
	for {
		select {
		case message, ok := <-c.Send:
			//log.Println("client", c, "got message to send", string(message))
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				log.Println("sonos channel closed, shutting down websocket")
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				log.Println("error getting websocket writer:", err)
				return
			}
			w.Write(message)
			log.Println("ws send", string(message))
			// flush queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.Send)
			}
			err = w.Close()
			if err != nil {
				log.Println("websocket write error:", err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			err := c.conn.WriteMessage(websocket.PingMessage, nil);
			if err != nil {
				log.Println("websocket ping error:", err)
				return
			}
		}
	}
}

func ServeWS(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if hub == nil {
		return nil, H.ServiceUnavailable.Raise(nil, "sonos not available")
	}
	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		return nil, H.InternalServerError.Raise(err, "Can't upgrade websocket connection")
	}
	client := &Client{hub: hub, conn: conn, Send: make(chan []byte, 256)}
	client.hub.Register <- client
	// Allow collection of memory referenced by the caller by doing all
	// work in new goroutines
	go client.WritePump()
	go client.ReadPump()
	return H.WebSocket("WS"), nil
}

