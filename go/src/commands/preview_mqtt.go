package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"time"

	"github.com/eclipse/paho.mqtt.golang"
)

func onConnect(c mqtt.Client) {
	log.Printf("onConnect: %v, %v", c.IsConnected(), c.IsConnectionOpen())
}

func onMessage(c mqtt.Client, m mqtt.Message) {
	log.Printf("got message on topic %s", m.Topic())
	log.Println(string(m.Payload()))
}

type JookiIP struct {
	Address string `json:"address"`
	Ping string `json:"ping"`
}

type JookiInfo struct {
	Label string `json:"label"`
	IP *JookiIP `json:"ip"`
	Live string `json:"live"`
	Version string `json:"version"`
}

type connectPayload struct {
	Jooki *JookiInfo `json:"jooki"`
}

func onQuitMessage(c mqtt.Client, m mqtt.Message) {
	log.Println("got quit message", string(m.Payload()))
}

func onStateMessage(c mqtt.Client, m mqtt.Message) {
	log.Println("got state message", string(m.Payload()))
}

func onErrorMessage(c mqtt.Client, m mqtt.Message) {
	log.Println("got error message", string(m.Payload()))
}

func onPongMessage(c mqtt.Client, m mqtt.Message) {
	log.Println("got pong message", string(m.Payload()))
}

func main() {
	u, err := url.Parse("ws://jooki-3be0.local:8000/mqtt")
	if err != nil {
		log.Fatal("error parsing url:", err)
	}
	t := time.Now()
	ms := t.Unix() * 1000 + int64(t.Nanosecond() / 1e6)
	opts := &mqtt.ClientOptions{
		Servers: []*url.URL{u},
		ClientID: fmt.Sprintf("web%d", ms),
		CleanSession: true,
		ProtocolVersion: 4,
		KeepAlive: 60,
		DefaultPublishHandler: onMessage,
		OnConnect: onConnect,
	}
	c := mqtt.NewClient(opts)
	tok := c.Connect()
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error connecting to jooki:", err)
	}
	tok = c.Subscribe("/j/all/quit", 0, onQuitMessage)
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error subscribing to quit topic", err)
	}
	tok = c.Subscribe("/j/web/output/state", 0, onStateMessage)
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error subscribing to state topic", err)
	}
	tok = c.Subscribe("/j/web/output/error", 0, onErrorMessage)
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error subscribing to error topic", err)
	}
	tok = c.Subscribe("/j/debug/output/pong", 0, onPongMessage)
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error subscribing to pong topic", err)
	}
	tok = c.Publish("/j/debug/input/ping", 0, false, "")
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error publishing to ping topic", err)
	}
	connectData, err := json.Marshal(connectPayload{
		Jooki: &JookiInfo{
			Label: "jooki-3BE0.local *",
			IP: &JookiIP{
				Address: "jooki-3BE0.local",
				Ping: "LIVE",
			},
			Live: "jooki-3BE0.local",
			Version: "3.5.7-m3-461d8e5",
		},
	})
	if err != nil {
		log.Fatal("error creating connect payload", err)
	}
	tok = c.Publish("/j/web/input/CONNECT", 0, false, connectData)
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error publishing to CONNECT topic", err)
	}
	tok = c.Publish("/j/web/input/GET_STATE", 0, false, "{}")
	tok.Wait()
	err = tok.Error()
	if err != nil {
		log.Fatal("error publishing to GET_STATE topic", err)
	}
	time.Sleep(2 * time.Minute)
	c.Disconnect(1000)
	log.Println("done")
}
