package dmap

import (
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"time"
)

type Kind int

const (
	BOOL      = Kind(1)
	UBYTE     = Kind(2)
	BYTE      = Kind(3)
	SHORT     = Kind(4)
	LONG      = Kind(5)
	LONGLONG  = Kind(6)
	STRING    = Kind(7)
	DATE      = Kind(8)
	VERSION   = Kind(9)
	CONTAINER = Kind(10)
)

/*
1	char	1-byte value, can be used as a boolean (true if the value is present, false if not)
3	short	2-byte integer
5	long	4-byte integer
7	long long	8-byte integer, tends to be represented in hex rather than numerical form
9	string	string of characters (UTF-8)
10	date	4-byte integer with seconds since 1970 (standard UNIX time format)
11	version	2-bytes major version, next byte minor version, last byte patchlevel
12	container	contains a series of other chunks, one after the other
*/

type info struct {
	Code string
	Name string
	Kind Kind
	Src string
}

type Version struct {
	Major int
	Minor int
	Patch int
}


func UnmarshalDMAP(data []byte) (map[string]interface{}, error) {
	m := map[string]interface{}{}
	pos := 0
	n := len(data)
	var len32 uint32
	for pos < n {
		key := string(data[pos:pos+4])
		buf := bytes.NewBuffer(data[pos+4:pos+8])
		err := binary.Read(buf, binary.BigEndian, &len32)
		if err != nil {
			return nil, err
		}
		if len(data) < 8 + int(len32) {
			return nil, fmt.Errorf("%s data not long enough: %d < %d", key, 8 + len32, len(data))
		}
		/*
		if len32 == 0 {
			pos += 8
			continue
		}
		*/
		valdata := data[pos+8:pos+8+int(len32)]
		pos += 8 + int(len32)
		inf, ok := keys[key]
		if !ok {
			m[key] = "unknown:" + hex.EncodeToString(valdata)
			continue
		}
		switch inf.Kind {
		case CONTAINER:
			sub, err := UnmarshalDMAP(valdata)
			if err != nil {
				return nil, err
			}
			m[inf.Name] = sub
		case VERSION:
			if len32 == 4 {
				vbuf := bytes.NewBuffer(valdata)
				var major int16
				var minor, patch int8
				err := binary.Read(vbuf, binary.BigEndian, &major)
				if err != nil {
					return nil, err
				}
				err = binary.Read(vbuf, binary.BigEndian, &minor)
				if err != nil {
					return nil, err
				}
				err = binary.Read(vbuf, binary.BigEndian, &patch)
				if err != nil {
					return nil, err
				}
				m[inf.Name] = &Version{int(major), int(minor), int(patch)}
			} else {
				m[inf.Name] = "version:" + hex.EncodeToString(valdata)
			}
		case DATE:
			if len32 == 4 {
				var v int32
				err := binary.Read(bytes.NewBuffer(valdata), binary.BigEndian, &v)
				if err != nil {
					return nil, err
				}
				if v == -2082819600 {
					m[inf.Name] = nil
				} else {
					m[inf.Name] = time.Unix(int64(v), 0)
				}
			} else {
				m[inf.Name] = "date:" + hex.EncodeToString(valdata)
			}
		case STRING:
			m[inf.Name] = string(valdata)
		case LONGLONG:
			if len32 == 8 {
				m[inf.Name] = hex.EncodeToString(valdata)
			} else {
				m[inf.Name] = "longlong:" + hex.EncodeToString(valdata)
			}
		case LONG:
			if len32 == 4 {
				var v int32
				err := binary.Read(bytes.NewBuffer(valdata), binary.BigEndian, &v)
				if err != nil {
					return nil, err
				}
				m[inf.Name] = int(v)
			} else {
				m[inf.Name] = "int:" + hex.EncodeToString(valdata)
			}
		case SHORT:
			if len32 == 2 {
				var v int16
				err := binary.Read(bytes.NewBuffer(valdata), binary.BigEndian, &v)
				if err != nil {
					return nil, err
				}
				m[inf.Name] = v
			} else {
				m[inf.Name] = "short:" + hex.EncodeToString(valdata)
			}
		case UBYTE:
			if len32 == 1 {
				m[inf.Name] = uint8(valdata[0])
			} else {
				m[inf.Name] = "ubyte:" + hex.EncodeToString(valdata)
			}
		case BYTE:
			if len32 == 1 {
				m[inf.Name] = valdata[0]
			} else {
				m[inf.Name] = "byte:" + hex.EncodeToString(valdata)
			}
		case BOOL:
			if len32 == 1 && (valdata[0] == 0 || valdata[0] == 1) {
				m[inf.Name] = (valdata[0] == 1)
			} else {
				m[inf.Name] = "bool:" + hex.EncodeToString(valdata)
			}
		}
	}
	return m, nil
}
