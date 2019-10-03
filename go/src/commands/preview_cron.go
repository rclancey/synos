package main

import (
	"log"
	"time"

	"cron"
)

func main() {
	f := func() {
		log.Println("hey hey")
	}
	now := time.Now().Add(time.Minute * 2)
	s := cron.NewSchedule()
	s.AddJob(cron.NewJob(now.Weekday(), now.Hour(), now.Minute(), f))
	now = time.Now()
	s.Run()
	s.Override(now.Add(time.Second * 30))
	time.Sleep(3 * time.Minute)
}
