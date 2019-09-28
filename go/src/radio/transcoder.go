package radio

import (
	"fmt"
	"io"
	"log"
	"os/exec"
)

type Transcoder struct {
	fn string
	cmd *exec.Cmd
	r io.ReadCloser
}

func NewTranscoder(fn string, bitrate int) (*Transcoder, error) {
	log.Println("transcoding", fn)
	cmd := exec.Command("ffmpeg", "-loglevel", "error", "-i", fn, "-vn", "-f", "mp3", "-acodec", "libmp3lame", "-ab", fmt.Sprintf("%dk", bitrate / 1000), "-")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Println(err)
		return nil, err
	}
	err = cmd.Start()
	if err != nil {
		log.Println(err)
		stdout.Close()
		return nil, err
	}
	return &Transcoder{
		fn: fn,
		cmd: cmd,
		r: stdout,
	}, nil
}

func (t *Transcoder) Read(buf []byte) (int, error) {
	return t.r.Read(buf)
}

func (t *Transcoder) Close() error {
	t.r.Close()
	return t.cmd.Wait()
}

