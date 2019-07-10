all: build/synos-synology.tar.gz build/synos-macos.tar.gz

go-synology:
	env PLATFORM=synology GOPATH=$(CURDIR)/go GOOS=linux GOARCH=amd64 GOARM=5 $(MAKE) -C go

.PHONY: go-synology

go-macos:
	env PLATFORM=macos GOPATH=$(CURDIR)/go GOOS=darwin GOARCH=amd64 $(MAKE) -C go

.PHONY: go-macos

js:
	cd itunes && yarn build

.PHONY: js

build-synology: go-synology js
	mkdir -p build/synology/synos/bin build/synology/synos/htdocs
	cp go/synology/server go/synology/preview_musicdb build/synology/synos/bin/
	rsync -a itunes/build/ build/synology/synos/htdocs/

.PHONY: build-synology

build-macos: go-macos js
	mkdir -p build/macos/synos/bin build/macos/synos/htdocs
	cp go/macos/server go/macos/preview_musicdb build/macos/synos/bin/
	rsync -a itunes/build/ build/macos/synos/htdocs/

.PHONY: build-macos

build/synos-synology.tar.gz: build-synology
	cd build/synology && tar -zcf ../synos-synology.tar.gz synos 

build/synos-macos.tar.gz: build-macos
	cd build/macos && tar -zcf ../synos-macos.tar.gz synos

