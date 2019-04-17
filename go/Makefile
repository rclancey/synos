GOPATH = $(CURDIR)

ITUNES_SRC = $(shell find src/itunes -type f)

export GOPATH

all:
	GOPATH=`pwd` GOOS=linux GOARCH=amd64 GOARM=5 go build src/itunes_dump.go 

make_enums: src/make_enums.go
	go build src/make_enums.go

src/itunes/enums.go: make_enums src/itunes/enums.json
	./make_enums itunes < src/itunes/enums.json > src/itunes/enums.go

itunes_dump: make_enums src/itunes_dump.go src/itunes/enums.go $(ITUNES_SRC)
	go build src/itunes_dump.go

