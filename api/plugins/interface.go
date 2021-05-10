package "synosPlugins"

import (
	H "github.com/rclancey/httpserver"
	"musicdb"
)

type SynosPlugin interface {
	SetupRoutes(router H.router, db *musicdb.DB)
}
