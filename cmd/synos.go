package main

import (
	"math/rand"
	"time"

	"github.com/rclancey/synos/api"
)

func main() {
	rand.Seed(time.Now().UnixNano())
	api.APIMain()
}
