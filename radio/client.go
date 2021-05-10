package radio

import (
	"errors"
)

type Client struct {
	id uint64
	s *Stream
	closed bool
	C chan []byte
	buf []byte
}

func (c *Client) write(data []byte) error {
	if c.closed {
		return errors.New("client closed")
	}
	select {
	case c.C <- data:
		return nil
	default:
		return errors.New("client fell behind")
	}
	return errors.New("unexpected client write error")
}

func (c *Client) Close() error {
	if c.closed {
		return nil
	}
	c.s.removeClient(c)
	c.closed = true
	close(c.C)
	return nil
}

func (c *Client) Read(buf []byte) (int, error) {
	j := 0
	if len(c.buf) > 0 {
		if len(c.buf) > len(buf) {
			for i := 0; i < len(buf); i++ {
				buf[i] = c.buf[i]
			}
			c.buf = c.buf[len(buf):]
			return len(buf), nil
		}
		for i := 0; i < len(c.buf); i++ {
			buf[i] = c.buf[i]
		}
		j = len(c.buf)
		c.buf = []byte{}
	}
	for j < len(buf) {
		data := <-c.C
		for i := 0; i < len(data); i++ {
			if j >= len(buf) {
				c.buf = data[i:]
				return len(buf), nil
			}
			buf[j] = data[i]
			j++
		}
	}
	return j, nil
}

