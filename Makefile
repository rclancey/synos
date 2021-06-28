VERSION=$(shell date '+%Y%m%d')

all: build/synos-synology-$(VERSION).tar.gz build/synos-macos-$(VERSION).tar.gz

version:
	echo $(VERSION)

go-synology:
	env PLATFORM=synology GOPATH=$(CURDIR)/go GOOS=linux GOARCH=amd64 GOARM=5 $(MAKE) -C go

.PHONY: go-synology

go-macos:
	env PLATFORM=macos GOPATH=$(CURDIR)/go GOOS=darwin GOARCH=amd64 $(MAKE) -C go

.PHONY: go-macos

js:
	cd js && yarn build

.PHONY: js

build-synology: go-synology js startup.sh shutdown.sh
	mkdir -p build/synology/synos/bin build/synology/synos/htdocs
	cp go/synology/server build/synology/synos/bin/
	cp startup.sh shutdown.sh build/synology/synos/bin/
	rsync -a js/build/ build/synology/synos/htdocs/

.PHONY: build-synology

build-macos: go-macos js startup.sh shutdown.sh
	mkdir -p build/macos/synos/bin build/macos/synos/htdocs
	cp go/macos/server build/macos/synos/bin/
	cp startup.sh shutdown.sh build/macos/synos/bin/
	rsync -a js/build/ build/macos/synos/htdocs/

.PHONY: build-macos

build/synos-synology-$(VERSION).tar.gz: build-synology
	cd build/synology && tar -zcf ../synos-synology-$(VERSION).tar.gz synos 

build/synos-macos-$(VERSION).tar.gz: build-macos
	cd build/macos && tar -zcf ../synos-macos-$(VERSION).tar.gz synos

