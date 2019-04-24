package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/ianr0bkny/go-sonos/upnp"

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
}

type Hub struct {
	clients map[*Client]bool
	Events chan upnp.Event
	Broadcast chan []byte
	Register chan *Client
	Unregister chan *Client
}

func NewHub(dev *sonos.Sonos) *Hub {
	return &Hub{
		Broadcast: make(chan []byte),
		Events: dev.Events(),
		Register: make(chan *Client),
		Unregister: make(chan *Client),
		clients: make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
		case client := <-h.Unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
		case evt := <-h.Events:
			svc := evt.Service()
			typ := evt.Type()
			log.Printf("%T event: %#v\n", evt, evt)
			log.Println("service:", svc.Actions())
			switch event := evt.(type) {
			case upnp.AVTRansportEvent:
				log.Println("AVTransportEvent:", event.LastChange)
			case *upnp.AVTransportEvent:
				log.Println("*AVTransportEvent:", event.LastChange)
			case upnp.RenderingControlEvent:
				log.Println("RenderingControlEvent:", event.LastChange)
			case *upnp.RenderingControlEvent:
				log.Println("*RenderingControlEvent:", event.LastChange)
			default:
				log.Println("other event")
			}
		case message := <-h.Broadcast:
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
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

func ServeWS(w http.ResponseWriter, req *http.Request) {
	if hub == nil {
		ServiceUnavailable.Raise("", "sonos not available").Respond(w)
		return
	}
	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		log.Println("error upgrading websocket connection:", err)
		return
	}
	client := &Client{s: s, conn: conn, Send: make(chan []byte, 256)}
	client.hub.Register <- client
	// Allow collection of memory referenced by the caller by doing all
	// work in new goroutines
	go client.WritePump()
	go client.ReadPump()
}

