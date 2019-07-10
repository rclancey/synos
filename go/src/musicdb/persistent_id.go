package musicdb

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"math/rand"
	"strconv"
	"strings"
)

type PersistentID uint64

func NewPersistentID() PersistentID {
	return PersistentID(rand.Uint64())
}

func (pid PersistentID) String() string {
	v := strings.ToUpper(strconv.FormatUint(uint64(pid), 16))
	return strings.Repeat("0", 16 - len(v)) + v
}

func (pid *PersistentID) Decode(s string) error {
	v, err := strconv.ParseUint(s, 16, 64)
	if err != nil {
		return err
	}
	*pid = PersistentID(v)
	return nil
}

func (pid PersistentID) MarshalJSON() ([]byte, error) {
	return json.Marshal(pid.String())
}

func (pid *PersistentID) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}
	return pid.Decode(s)
}

func (pid PersistentID) Value() (driver.Value, error) {
	iv := int64(pid & 0x7fffffffffffffff)
	if pid > 0x7fffffffffffffff {
		iv *= -1
	}
	return iv, nil
}

func (pid *PersistentID) Scan(value interface{}) error {
	if value == nil {
		*pid = PersistentID(0)
		return nil
	}
	switch v := value.(type) {
	case int64:
		if v < 0 {
			*pid = PersistentID(uint64(-1 * v) | 0x8000000000000000)
			return nil
		}
		*pid = PersistentID(uint64(v))
		return nil
	case string:
		return pid.Decode(v)
	}
	return fmt.Errorf("don't know how to convert %T into persistent id")
}

