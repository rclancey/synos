package main

import (
	"log"
	"os"
	"strings"

	"github.com/rclancey/synos/musicdb"
)

func fixId(badId int64) int64 {
	u := uint64(-1 * badId) | 0x8000000000000000
	u2 := uint64(u) & 0x7fffffffffffffff
	u3 := 0x8000000000000000 - u2
	u4 := int64(u3) * -1
	//log.Println(badId, u, u2, u3, u4)
	return u4
}

func main() {
	dsn := "dbname=synos sslmode=disable"
	if len(os.Args) > 1 {
		dsn = strings.Join(os.Args[1:], " ")
	}
	db, err := musicdb.Open(dsn)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("getting track ids")
	//qs := "SELECT genius_track_id FROM playlist WHERE genius_track_id IS NOT NULL AND genius_track_id < 0"
	qs := "SELECT id FROM track WHERE id < 0"
	rows, err := db.Query(qs)
	if err != nil {
		log.Fatal(err)
	}
	var badId int64
	m1 := map[int64]int64{}
	for rows.Next() {
		err = rows.Scan(&badId)
		m1[badId] = fixId(badId)
		//log.Println(badId, m1[badId])
	}
	log.Println("getting playlist ids")
	//qs = "SELECT parent_id FROM playlist WHERE parent_id IS NOT NULL AND parent_id < 0"
	qs = "SELECT id FROM playlist WHERE id < 0"
	m2 := map[int64]int64{}
	rows, err = db.Query(qs)
	if err != nil {
		log.Fatal(err)
	}
	for rows.Next() {
		err = rows.Scan(&badId)
		m2[badId] = fixId(badId)
		//log.Println(badId, m2[badId])
	}
	//return
	qs = "UPDATE track SET id = ? WHERE id = ?"
	st1, err := db.Prepare(qs)
	if err != nil {
		log.Fatal(err)
	}
	qs = "UPDATE playlist_track SET track_id = ? WHERE track_id = ?"
	st2, err := db.Prepare(qs)
	if err != nil {
		log.Fatal(err)
	}
	qs = "UPDATE playlist SET genius_track_id = ? WHERE genius_track_id = ?"
	st3, err := db.Prepare(qs)
	if err != nil {
		log.Fatal(err)
	}
	qs = "UPDATE playlist SET id = ? WHERE id = ?"
	st4, err := db.Prepare(qs)
	if err != nil {
		log.Fatal(err)
	}
	qs = "UPDATE playlist SET parent_id = ? WHERE parent_id = ?"
	st5, err := db.Prepare(qs)
	if err != nil {
		log.Fatal(err)
	}
	qs = "UPDATE playlist_track SET playlist_id = ? WHERE playlist_id = ?"
	st6, err := db.Prepare(qs)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("updating %d track ids", len(m1))
	for badId, goodId := range m1 {
		st1.Exec(goodId, badId)
		st2.Exec(goodId, badId)
		st3.Exec(goodId, badId)
	}
	log.Printf("updating %d playlist ids", len(m2))
	for badId, goodId := range m2 {
		st4.Exec(goodId, badId)
		st5.Exec(goodId, badId)
		st6.Exec(goodId, badId)
	}
	log.Println("done")
}
