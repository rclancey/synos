package monitor

import (
	"os"
	"time"
)

type FileMonitor struct {
	FileName string
	Interval time.Duration
	IdleTime time.Duration
	C chan time.Time
	ticker *time.Ticker
	quit chan bool
}

func NewFileMonitor(fn string, interval, idle time.Duration) *FileMonitor {
	if interval <= 100 * time.Millisecond {
		interval = 100 * time.Millisecond
	}
	fm := &FileMonitor{
		FileName: fn,
		Interval: interval,
		IdleTime: idle,
		C: make(chan time.Time, 10),
		ticker: nil,
	}
	fm.Start()
	return fm
}

func (fm *FileMonitor) Start() {
	fm.Stop()
	quit := make(chan bool, 2)
	fm.quit = quit
	var lastMod *time.Time
	tick := time.NewTicker(fm.Interval)
	fm.ticker = tick
	go func() {
		for {
			select {
			case <-quit:
				break
			case <-tick.C:
				st, err := os.Stat(fm.FileName)
				if err == nil {
					lm := st.ModTime()
					if time.Now().Sub(lm) >= fm.IdleTime {
						if lastMod == nil {
							lastMod = &lm
							fm.C <- lm
						} else if lm.After(*lastMod) {
							lastMod = &lm
							fm.C <- lm
						}
					}
				} else {
					if lastMod != nil {
						lastMod = nil
						fm.C <- time.Now()
					}
				}
			}
		}
	}()
}

func (fm *FileMonitor) Stop() {
	if fm.quit != nil {
		fm.quit <- true
	}
	if fm.ticker != nil {
		fm.ticker.Stop()
		fm.ticker = nil
	}
}
