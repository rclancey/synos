package musicdb

import (
	"database/sql/driver"
	"time"

	"github.com/pkg/errors"
)

type Time int64

func Now() Time {
	return FromTime(time.Now())
}

func FromTime(tm time.Time) Time {
	var t Time
	xt := &t
	xt.Set(tm)
	return t
}

func (t Time) Time() time.Time {
	s := int64(t) / 1000
	ns := (int64(t) % 1000) * 1e6
	return time.Unix(s, ns)
}

func (t *Time) Set(tm time.Time) {
	*t = Time(tm.Unix() * 1000 + int64(tm.Nanosecond() / 1e6))
}

func (t Time) Value() (driver.Value, error) {
	return t.Time(), nil
}

func (t *Time) Scan(value interface{}) error {
	if value == nil {
		*t = Time(0)
		return nil
	}
	switch v := value.(type) {
	case int64:
		*t = Time(v)
		return nil
	case string:
		tm, err := time.ParseInLocation(v, "2006-01-02 15:04:05", time.UTC)
		if err != nil {
			return errors.Wrap(err, "can't parse time value " + v)
		}
		t.Set(tm)
		return nil
	case time.Time:
		t.Set(v)
		return nil
	case *time.Time:
		if v == nil {
			return errors.Errorf("can't set nil time")
		}
		t.Set(*v)
		return nil
	}
	return errors.Errorf("can't convert %T to a time", value)
}

