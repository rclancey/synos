package httpserver

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
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

type Hub interface {
	Run()
	Stop()
	Closed() bool
	Register(*Client)
	Unregister(*Client)
	Broadcast([]byte)
	BroadcastEvent(interface{})
}

type GenericHub struct {
	clients map[*Client]bool
	stopper chan bool
	broadcast chan []byte
	register chan *Client
	unregister chan *Client
	closed bool
	Events chan interface{}
}

func NewGenericHub(source chan interface{}) *GenericHub {
	return &GenericHub{
		clients: make(map[*Client]bool),
		stopper: make(chan bool),
		broadcast: make(chan []byte),
		register: make(chan *Client),
		unregister: make(chan *Client),
		closed: false,
		Events: source,
	}
}

func (h *GenericHub) Run() {
	h.closed = false
	stopped := false
	for !stopped {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
		case evt, ok := <-h.Events:
			if !ok {
				stopped = true
			}
			message, _ := json.Marshal(evt)
			toClose := []*Client{}
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					toClose = append(toClose, client)
				}
			}
			for _, client := range toClose {
				log.Println("can't send to client", client, "closing")
				close(client.Send)
				delete(h.clients, client)
			}
		case message := <-h.broadcast:
			toClose := []*Client{}
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					toClose = append(toClose, client)
				}
			}
			for _, client := range toClose {
				log.Println("can't send to client", client, "closing")
				close(client.Send)
				delete(h.clients, client)
			}
		case <-h.stopper:
			stopped = true
		}
	}
	h.closed = true
	toClose := []*Client{}
	for client := range h.clients {
		toClose = append(toClose, client)
	}
	for _, client := range toClose {
		close(client.Send)
		delete(h.clients, client)
	}
}

func (h *GenericHub) Stop() {
	h.stopper <- true
}

func (h *GenericHub) Closed() bool {
	return h.closed
}

func (h *GenericHub) Register(c *Client) {
	h.register <- c
}

func (h *GenericHub) Unregister(c *Client) {
	h.unregister <- c
}

func (h *GenericHub) Broadcast(msg []byte) {
	h.broadcast <- msg
}

func (h *GenericHub) BroadcastEvent(evt interface{}) {
	msg, _ := json.Marshal(evt)
	h.Broadcast(msg)
}

type Client struct {
	hub Hub
	conn *websocket.Conn
	Send chan []byte
}

func (c *Client) Open(conn *websocket.Conn) error {
	c.conn = conn
	c.hub.Register(c)
	return nil
}

func (c *Client) Close() {
	if c.hub != nil {
		c.hub.Unregister(c)
		c.hub = nil
	}
	if c.conn != nil {
		c.conn.Close()
	}
}

func (c *Client) ReadPump() {
	defer c.Close()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		if c.hub == nil {
			break
		}
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("websocket read error:", err)
			break
		}
		c.hub.Broadcast(message)
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
				log.Println("source channel closed, shutting down websocket")
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				log.Println("error getting websocket writer:", err)
				return
			}
			w.Write(message)
			//log.Println("ws send", string(message))
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

func ServeWS(hub Hub, w http.ResponseWriter, req *http.Request) (interface{}, error) {
	/*
	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		return nil, InternalServerError.Raise(err, "Can't upgrade websocket connection")
	}
	*/
	client := &Client{hub: hub, Send: make(chan []byte, 256)}
	//client.hub.Register(client)
	return client, nil
	/*
	// Allow collection of memory referenced by the caller by doing all
	// work in new goroutines
	go client.WritePump()
	go client.ReadPump()
	return WebSocket("WS"), nil
	*/
}

