package itunes

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/text/unicode/norm"
)

type FileFinder struct {
	MediaFolder []string
	SourcePath []string
	TargetPath []string
}

var norms = []norm.Form{
	norm.NFC,
	norm.NFD,
	norm.NFKC,
	norm.NFKD,
}

var sep = string(filepath.Separator)

func fileExists(fn string) (string, bool) {
	_, err := os.Stat(fn)
	if err == nil {
		return fn, true
	}
	for _, nrm := range norms {
		nfn := nrm.String(fn)
		_, err = os.Stat(nfn)
		if err == nil {
			return nfn, true
		}
	}
	return fn, false
}

func fileUnder(fn, dn string) bool {
	xdn := strings.ToLower(filepath.Clean(dn) + sep)
	xfn := strings.ToLower(filepath.Clean(fn))
	if strings.HasPrefix(xfn, xdn) {
		return true
	}
	for _, nrm := range norms {
		ndn := nrm.String(xdn)
		nfn := nrm.String(xfn)
		if strings.HasPrefix(nfn, ndn) {
			return true
		}
	}
	return false
}

func pathContains(fn, dn string) bool {
	xdn := strings.ToLower(filepath.Clean(sep + dn) + sep)
	xfn := strings.ToLower(filepath.Clean(fn))
	if strings.Contains(xfn, xdn) {
		return true
	}
	for _, nrm := range norms {
		ndn := nrm.String(xdn)
		nfn := nrm.String(xfn)
		if strings.Contains(nfn, ndn) {
			return true
		}
	}
	return false
}

func pathAfter(fn, dn string) string {
	cfn := filepath.Clean(fn)
	xdn := strings.ToLower(filepath.Clean(sep + dn) + sep)
	xfn := strings.ToLower(cfn)
	idx := strings.Index(xfn, xdn)
	if idx >= 0 {
		return cfn[idx+len(xdn):]
	}
	for _, nrm := range norms {
		ndn := nrm.String(xdn)
		nfn := nrm.String(cfn)
		idx = strings.Index(strings.ToLower(nfn), ndn)
		if idx >= 0 {
			return nfn[idx+len(ndn):]
		}
	}
	return ""
}

func NewFileFinder(mediaFolder string, sourcePath, targetPath []string) *FileFinder {
	ff := &FileFinder{
		MediaFolder: []string{},
		SourcePath: sourcePath,
		TargetPath: []string{},
	}
	f := mediaFolder
	if f == "" || f == "." {
		ff.MediaFolder = []string{"."}
	} else {
		for f != "." {
			ff.MediaFolder = append(ff.MediaFolder, f)
			f = filepath.Dir(f)
		}
	}
	for _, d := range targetPath {
		d, ex := fileExists(d)
		if ex {
			ff.TargetPath = append(ff.TargetPath, d)
		}
	}
	return ff
}

func (ff *FileFinder) FindFile(fn string) (string, error) {
	origfn := fn
	if filepath.IsAbs(fn) {
		xfn, ex := fileExists(fn)
		if ex {
			return xfn, nil
		}
		for _, dn := range ff.SourcePath {
			if fileUnder(fn, dn) {
				fn = pathAfter(fn, dn)
				break
			}
		}
		if filepath.IsAbs(fn) && ff.MediaFolder[0] != "." {
			if pathContains(fn, ff.MediaFolder[0]) {
				fn = pathAfter(fn, ff.MediaFolder[0])
			}
		}
	}
	if filepath.IsAbs(fn) {
		return "", fmt.Errorf("File %s doesn't appear to reference a media folder", origfn)
	}
	for _, dn := range ff.TargetPath {
		for _, f := range ff.MediaFolder {
			xfn, ex := fileExists(filepath.Join(dn, f, fn))
			if ex {
				return xfn, nil
			}
		}
	}
	return origfn, fmt.Errorf("can't find file %s in any media folder", fn)
}

