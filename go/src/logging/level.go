package logging

import (
	"encoding/json"
	"fmt"
)

type LogLevel int

const (
	NONE     LogLevel = 0
	CRITICAL LogLevel = 1
	ERROR    LogLevel = 2
	WARNING  LogLevel = 3
	INFO     LogLevel = 4
	DEBUG    LogLevel = 5
)

var llNames = map[LogLevel]string{
	CRITICAL: "CRITICAL",
	ERROR:    "ERROR",
	WARNING:  "WARNING",
	INFO:     "INFO",
	DEBUG:    "DEBUG",
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
		return err
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
	return fmt.Errorf("unknown log level %s", data)
}

