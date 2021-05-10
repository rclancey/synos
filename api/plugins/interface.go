package "synosPlugins"

import (
	H "github.com/rclancey/httpserver"
	"github.com/rclancey/synos/musicdb"
)

type SynosPlugin interface {
	SetupRoutes(router H.router, db *musicdb.DB)
}
