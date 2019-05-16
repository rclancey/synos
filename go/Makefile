GOPATH = $(CURDIR)

ITUNES_SRC = $(shell find src -type f)

export GOPATH

all: itunes_server synology/itunes_server
	GOPATH=`pwd` GOOS=linux GOARCH=amd64 GOARM=5 go build itunes_server

make_enums: src/make_enums.go
	go build src/make_enums.go

src/itunes/enums.go: make_enums src/itunes/enums.json
	./make_enums itunes < src/itunes/enums.json > src/itunes/enums.go

itunes_server: make_enums src/itunes_dump.go src/itunes/enums.go $(ITUNES_SRC)
	go build itunes_server

synology:
	mkdir synology

synology/itunes_server: synology itunes_server
	GOPATH=`pwd` GOOS=linux GOARCH=amd64 GOARM=5 go build -o synology/itunes_server itunes_server
