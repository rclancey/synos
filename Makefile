PKGNAME    := synos
GITHASH    := $(shell git rev-parse --short HEAD)
FULLBRANCH := $(shell git branch --show-current)
TAGNAME    := $(shell git describe --exact-match --tags $(GITHASH) 2>/dev/null)
BRANCHNAME := $(shell basename "$(FULLBRANCH)")
DATE       := $(shell date '+%Y%m%d')
GITVERSION := $(shell sh -c 'if [ "x$(TAGNAME)" = "x" ] ; then echo $(GITHASH) ; else echo $(TAGNAME) ; fi')
VERSION    ?= $(GITVERSION)
TARGET     ?= local
BUILDDIR   = build
TARFILE    = $(PKGNAME)-$(VERSION).tar.gz

ifeq "$(TARGET)" "macos"
GOOS = darwin
GOARCH = amd64
GOARM = 
BUILDDIR = build-macos
TARFILE = $(PKGNAME)-$(TARGET)-$(VERSION).tar.gz
endif
ifeq "$(TARGET)" "synology"
GOOS = linux
GOARCH = amd64
GOARM = 5
BUILDDIR = build-synology
TARFILE = $(PKGNAME)-$(TARGET)-$(VERSION).tar.gz
endif

GOSRC := $(shell find * -type f -name "*.go")
JSSRC := $(shell find js/public js/src -type f)

all: compile

$(BUILDDIR)/$(PKGNAME)/bin/%: $(GOSRC) go.mod go.sum
	mkdir -p $(BUILDDIR)/$(PKGNAME)/bin
	env GOOS=$(GOOS) GOARCH=$(GOARCH) GOARM=$(GOARM) go build -o $@ cmd/$*.go

$(BUILDDIR)/$(PKGNAME)/htdocs/index.html: $(JSSRC) js/package.json
	mkdir -p $(BUILDDIR)/$(PKGNAME)/htdocs
	cd js && yarn install && yarn build
	rsync -a js/build/ $(BUILDDIR)/$(PKGNAME)/htdocs/

go-compile: $(BUILDDIR)/$(PKGNAME)/bin/synos

.PHONY: go-compile

js-compile: $(BUILDDIR)/$(PKGNAME)/htdocs/index.html

.PHONY: js-compile

compile: go-compile js-compile

.PHONY: compile

$(BUILDDIR)/$(TARFILE): compile
	cd $(BUILDDIR) && tar -zcf $(TARFILE) $(PKGNAME)

dist: $(BUILDDIR)/$(TARFILE)

.PHONY: dist

dev:
	go build -o synos cmd/synos.go

.PHONY: dev

version:
	echo $(VERSION)

.PHONY: version
