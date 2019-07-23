package logging

import (
	"encoding/json"
	"fmt"

	"github.com/pkg/errors"
)

type LogLevel int

const (
	NONE     LogLevel = 0
	LOG      LogLevel = 1
	CRITICAL LogLevel = 2
	ERROR    LogLevel = 3
	WARNING  LogLevel = 4
	INFO     LogLevel = 5
	DEBUG    LogLevel = 6
	IGNORED  LogLevel = 100
)

var llNames = map[LogLevel]string{
	LOG:      "LOG",
	CRITICAL: "CRITICAL",
	ERROR:    "ERROR",
	WARNING:  "WARNING",
	INFO:     "INFO",
	DEBUG:    "DEBUG",
	IGNORED:  "IGNORED",
}

func (ll LogLevel) String() string {
	return llNames[ll]
}

func (ll LogLevel) PaddedString(n int) string {
	if n <= 0 {
		n = 8
	}
	f := fmt.Sprintf("%%%ds", -1 * n)
	return fmt.Sprintf(f, ll.String())[:n]
}

func (ll LogLevel) MarshalJSON() ([]byte, error) {
	return json.Marshal(ll.String())
}

func (ll *LogLevel) UnmarshalJSON(data []byte) error {
	var s string
	err := json.Unmarshal(data, &s)
	if err != nil {
		return errors.Wrapf(err, "can't unmarshal log level %s", string(data))
	}
	return ll.UnmarshalText(s)
}

func (ll *LogLevel) UnmarshalText(data string) error {
	for k, v := range llNames {
		if v == data {
			*ll = k
			return nil
		}
	}
	return errors.Errorf("unknown log level %s", data)
}

