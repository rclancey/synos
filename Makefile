PKGNAME    := synos-api
GITHASH    := $(shell git rev-parse --short HEAD)
FULLBRANCH := $(shell git branch --show-current)
TAGNAME    := $(shell git describe --exact-match --tags $(GITHASH) 2>/dev/null)
BRANCHNAME := $(shell basename "$(FULLBRANCH)")
DATE       := $(shell date '+%Y%m%d')
GITVERSION := $(shell sh -c 'if [ "x$(TAGNAME)" = "x" ] ; then echo $(GITHASH) ; else echo $(TAGNAME) ; fi')
VERSION    ?= $(GITVERSION)

BUILDDIR = build
GOSRC := $(shell find * -type f -name "*.go")

all: local

$(BUILDDIR)/local/$(PKGNAME)/bin/%: $(GOSRC) go.mod go.sum
	mkdir -p $(BUILDDIR)/local/$(PKGNAME)/bin
	go build -o $@ cmd/$*.go

$(BUILDDIR)/macos/$(PKGNAME)/bin/%: $(GOSRC) go.mod go.sum
	mkdir -p $(BUILDDIR)/local/$(PKGNAME)/bin
	env GOOS=darwin GOARCH=amd64 go build -o $@ cmd/$*.go

$(BUILDDIR)/synology/bin/%: $(GOSRC) go.mod go.sum
	mkdir -p $(BUILDDIR)/local/$(PKGNAME)/bin
	env GOOS=linux GOARCH=amd64 GOARM=5 go build -o $@ cmd/$*.go

$(BUILDDIR)/$(PKGNAME)-%-$(VERSION).tar.gz: $(BUILDDIR)/%/$(PKGNAME)/bin/synos
	cd $(BUILDDIR)/$* && tar -zcf ../$(PKGNAME)-$*-$(VERSION).tar.gz $(PKGNAME)

local: $(BUILDDIR)/$(PKGNAME)-local-$(VERSION).tar.gz

.PHONY: local

macos: $(BUILDDIR)/$(PKGNAME)-local-$(VERSION).tar.gz

.PHONY: macos

synology: $(BUILDDIR)/$(PKGNAME)-local-$(VERSION).tar.gz

.PHONY: synology

dev:
	go build -o synos cmd/synos.go

.PHONY: dev

version:
	echo $(VERSION)

