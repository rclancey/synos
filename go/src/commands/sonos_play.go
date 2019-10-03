package main

import (
	"fmt"
	"log"
	"os"
	"github.com/ianr0bkny/go-sonos"
	"github.com/ianr0bkny/go-sonos/ssdp"
	"github.com/ianr0bkny/go-sonos/upnp"
)

func main() {
	mgr := ssdp.MakeManager()
	// Discover()
	//  eth0 := Network device to query for UPnP devices
	// 11209 := Free local port for discovery replies
	// false := Do not subscribe for asynchronous updates
	//mgr.Discover("eth0", "11209", false)
	mgr.Discover("en0", "11209", false)

	// SericeQueryTerms
	// A map of service keys to minimum required version
	qry := ssdp.ServiceQueryTerms{
		ssdp.ServiceKey("schemas-upnp-org-MusicServices"): -1,
	}

	var player *sonos.Sonos
	// Look for the service keys in qry in the database of discovered devices
	result := mgr.QueryServices(qry)
	if dev_list, has := result["schemas-upnp-org-MusicServices"]; has {
		for _, dev := range dev_list {
			log.Printf("hey: %T %#v\n", dev, dev)
			log.Printf("%s %s %s %s %s\n", dev.Product(), dev.ProductVersion(), dev.Name(), dev.Location(), dev.UUID())
			player = sonos.Connect(dev, nil, sonos.SVC_CONNECTION_MANAGER|sonos.SVC_CONTENT_DIRECTORY|sonos.SVC_RENDERING_CONTROL|sonos.SVC_AV_TRANSPORT)
		}
	}
	if player == nil {
		log.Println("no sonos device")
		return
	}
	objs, err := player.GetQueueContents()
	if err != nil {
		log.Println("error fetching queue:", err)
		return
	}
	for i, obj := range objs {
		log.Printf("queue item %d: %s (%T: %#v)\n", i, obj.Title(), obj, obj)
	}
	pos, err := player.GetPositionInfo(0)
	if err != nil {
		log.Println("no queue position info")
	} else {
		log.Printf("queue position info = %#v\b", pos)
	}
	if len(os.Args) < 2 {
		return
	}
	/*
	err = player.RemoveAllTracksFromQueue(0)
	if err != nil {
		log.Println("error clearing queue:", err)
		return
	}
	objs, err = player.GetQueueContents()
	if err != nil {
		log.Println("error refetching queue:", err)
		return
	}
	log.Printf("queue now has %d items\n", len(objs))
	*/
	id := "1234"
	mediaUri := os.Args[1]
	parentId := "5678"
	durationInHumanFormat := "3:15"
	coverUri := "http://10.0.1.96:8181/api/track/B37D346CBF85F5FC.jpg"
	title := "Back in Black"
	artist := "ACDC"
	album := "backinblack"
	req := &upnp.AddURIToQueueIn{
		EnqueuedURI: os.Args[1],
		EnqueuedURIMetaData: fmt.Sprintf(`<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="%s" parentID="%s">
    <upnp:class>object.item.audioItem.musicTrack</upnp:class>
    <res protocolInfo="http-get:*:audio/mpeg:*" duration="%s">%s</res>
    <upnp:albumArtURI>%s</upnp:albumArtURI>
    <dc:title>%s</dc:title>
    <dc:creator>%s</dc:creator>
    <upnp:album>%s</upnp:album>
  </item>
</DIDL-Lite>`, id, parentId, durationInHumanFormat, mediaUri, coverUri, title, artist, album),
	}
	res, err := player.AddURIToQueue(0, req)
	if err != nil {
		log.Println("error adding", os.Args[1], "to queue:", err)
		return
	}
	log.Printf("added to queue: %#v\n", res)
	objs, err = player.GetQueueContents()
	if err != nil {
		log.Println("error fetching queue:", err)
		return
	}
	for i, obj := range objs {
		log.Printf("queue item %d: %s (%T: %#v)\n", i, obj.Title(), obj, obj)
	}
	err = player.Play(0, "1")
	if err != nil {
		log.Println("error starting playback:", err)
		return
	}
	log.Println("all done!")
	mgr.Close()
}
