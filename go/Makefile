GOPATH = $(CURDIR)

ITUNES_SRC = $(shell find src -type f)

export GOPATH

all: $(PLATFORM)/server

make_enums: src/make_enums.go
	env GOARCH="" GOOS="" GOARM="" go build src/make_enums.go

src/itunes/enums.go: make_enums src/itunes/enums.json
	./make_enums itunes < src/itunes/enums.json > src/itunes/enums.go

$(PLATFORM):
	mkdir $(PLATFORM)

$(PLATFORM)/server: $(PLATFORM) make_enums src/itunes_dump.go src/itunes/enums.go $(ITUNES_SRC)
	go build -o $(PLATFORM)/server server

$(PLATFORM)/preview_musicdb: $(PLATFORM) make_enums src/itunes_dump.go src/itunes/enums.go $(ITUNES_SRC)
	go build -o $(PLATFORM)/preview_musicdb src/preview_musicdb.go
