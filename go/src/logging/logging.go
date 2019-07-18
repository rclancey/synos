package logging

import (
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	//"os/signal"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type watcher struct {
	timer *time.Timer
	kill chan bool
}

func newWatcher(dur time.Duration) *watcher {
	return &watcher{
		timer: time.NewTimer(dur),
		kill: make(chan bool, 1),
	}
}

func (w *watcher) Kill() {
	if !w.timer.Stop() {
		<-w.timer.C
	}
	w.kill <- true
}

type Logger struct {
	FileName string
	Level LogLevel
	RotateDuration time.Duration
	RetainCount int
	watcher *watcher
	file *os.File
	start *time.Time
}

func NewLogger(fn string, level LogLevel, rotate time.Duration, retain int) (*Logger, error) {
	l := &Logger{
		FileName: fn,
		Level: level,
		RotateDuration: rotate,
		RetainCount: retain,
	}
	err := l.Reopen()
	if err != nil {
		if l.file != nil && l.file.Name() != "/dev/stdout" && l.file.Name() != "/dev/stdin" {
			l.file.Close()
		}
		return nil, err
	}
	return l, nil
}

func (l *Logger) MakeDefault() {
	log.SetOutput(l)
}

func (l *Logger) Reopen() error {
	orig := l.file
	var err error
	if l.FileName != "" {
		l.file, err = os.OpenFile(l.FileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}
		if orig != nil {
			orig.Close()
		}
	} else {
		l.file = os.Stderr
	}
	l.start = nil
	return nil
}

func (l *Logger) Rotate() error {
	now := time.Now()
	if l.FileName == "" {
		return nil
	}
	if l.start == nil {
		return nil
	}
	l.Println("rotating", l.FileName)
	_, err := os.Stat(l.FileName)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	dt := l.start.In(time.Local).Format("20060102.1504")
	rfn := l.FileName + "." + dt
	_, err = os.Stat(rfn)
	if err == nil {
		return fmt.Errorf("rotated log file %s already exists", rfn)
	}
	if !os.IsNotExist(err) {
		return err
	}
	err = os.Rename(l.FileName, rfn)
	if err != nil {
		return err
	}
	err = l.Reopen()
	if err != nil {
		return err
	}
	err = l.compress(rfn)
	if err != nil {
		return err
	}
	err = l.cleanup(now)
	if err != nil {
		return err
	}
	return nil
}

func (l *Logger) NextRotate() time.Time {
	now := time.Now().In(time.Local)
	var next time.Time
	month := time.Duration(30 * 24 * time.Hour)
	week := time.Duration(7 * 24 * time.Hour)
	day := time.Duration(24 * time.Hour)
	hour := time.Hour
	dur := l.RotateDuration
	if dur < time.Minute {
		dur = day
	}
	if dur % month == 0 {
		y := now.Year()
		mn := int(now.Month()) + int(dur / month)
		for mn > 12 {
			mn -= 12
			y += 1
		}
		next = time.Date(y, time.Month(mn), 1, 0, 0, 0, 0, time.Local)
	} else if dur % week == 0 {
		wn := int(dur / week)
		next = time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, time.Local)
		next = next.AddDate(0, 0, wn * 7 - int(next.Weekday()))
		next = time.Date(next.Year(), next.Month(), next.Day(), 0, 0, 0, 0, time.Local)
	} else if dur % day == 0 {
		next = time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, time.Local)
		next = next.AddDate(0, 0, int(dur / day))
		next = time.Date(next.Year(), next.Month(), next.Day(), 0, 0, 0, 0, time.Local)
	} else if dur % hour == 0 {
		hn := int(dur / hour)
		hr := ((now.Hour() + hn) / hn) * hn
		next = time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, time.Local)
		for hr >= 24 {
			next = next.AddDate(0, 0, 1)
			hr -= 24
		}
		next = time.Date(next.Year(), next.Month(), next.Day(), hr, 0, 0, 0, time.Local)
	} else {
		mn := int(dur / time.Minute)
		next = now.Add(time.Duration(mn) * time.Minute)
		next = time.Date(next.Year(), next.Month(), next.Day(), next.Hour(), mn * (next.Minute() / mn), 0, 0, time.Local)
	}
	return next
}

func (l *Logger) WaitForRotate() error {
	next := l.NextRotate()
	dur := next.Sub(time.Now())
	if dur > 0 {
		time.Sleep(dur)
	}
	return l.Rotate()
}

func (l *Logger) Watch() {
	if l.watcher != nil {
		l.watcher.Kill()
		l.watcher = nil
	}
	dur := l.NextRotate().Sub(time.Now())
	if dur < 0 {
		dur = time.Second / 10
	}
	l.watcher = newWatcher(dur)
	for {
		select {
		case <-l.watcher.kill:
			if !l.watcher.timer.Stop() {
				<-l.watcher.timer.C
			}
			break
		case <-l.watcher.timer.C:
			l.Rotate()
			dur = l.NextRotate().Sub(time.Now())
			if dur < 0 {
				dur = time.Second / 10
			}
			l.watcher.timer.Reset(dur)
		}
	}
}

func (l *Logger) compress(fn string) error {
	gfn := fn + ".gz"
	_, err := os.Stat(gfn)
	if err == nil {
		return fmt.Errorf("compressed file %s already exists", gfn)
	}
	if !os.IsNotExist(err) {
		return err
	}
	r, err := os.Open(fn)
	if err != nil {
		return err
	}
	defer r.Close()
	gf, err := os.Create(gfn)
	if err != nil {
		return err
	}
	zw := gzip.NewWriter(gf)
	buf := make([]byte, 8192)
	for {
		n, err := r.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			zw.Close()
			gf.Close()
			os.Remove(gfn)
			return err
		}
		if n == 0 {
			break
		}
		_, err = zw.Write(buf[:n])
		if err != nil {
			zw.Close()
			gf.Close()
			os.Remove(gfn)
			return err
		}
	}
	err = zw.Close()
	if err != nil {
		gf.Close()
		os.Remove(gfn)
		return err
	}
	err = gf.Close()
	if err != nil {
		os.Remove(gfn)
	}
	return os.Remove(fn)
}

var dtRe = regexp.MustCompile(`(\d{8}\.\d{4})\.gz$`)

func (l *Logger) cleanup(asof time.Time) error {
	if l.FileName == "" {
		return nil
	}
	fns, err := filepath.Glob(l.FileName + ".*.gz")
	if err != nil {
		return err
	}
	earliest := asof.Add(-1 * l.RotateDuration * time.Duration(l.RetainCount))
	for _, fn := range fns {
		m := dtRe.FindStringSubmatch(fn)
		if m != nil && len(m) > 1 {
			t, err := time.ParseInLocation("20060102.1504", m[1], time.Local)
			if err == nil {
				if t.Before(earliest) {
					err = os.Remove(fn)
					if err != nil {
						return err
					}
				}
			}
		}
	}
	return nil
}

func (l *Logger) Close() error {
	if l.file != nil {
		err := l.file.Close()
		l.file = nil
		return err
	}
	return nil
}

func (l *Logger) Write(data []byte) (int, error) {
	if l.file == nil {
		return 0, errors.New("logger not open")
	}
	if l.start == nil {
		t := time.Now()
		l.start = &t
	}
	n, err := l.file.Write(data)
	if err != nil {
		return n, err
	}
	err = l.file.Sync()
	if err != nil {
		return n, err
	}
	return n, nil
}

func (l *Logger) log(level LogLevel, args ...interface{}) {
	if level > l.Level {
		return
	}
	t := time.Now().In(time.Local).Format("2006/01/02 15:04:05")
	_, fn, line, _ := runtime.Caller(2)
	lineref := filepath.Base(fn) + ":" + strconv.Itoa(line) + ":"
	xargs := append([]interface{}{t, level.PaddedString(8), lineref}, args...)
	l.Write([]byte(fmt.Sprintln(xargs...)))
}

func (l *Logger) logf(level LogLevel, f string, args ...interface{}) {
	if level > l.Level {
		return
	}
	t := time.Now().In(time.Local).Format("2006/01/02 15:04:05")
	_, fn, line, _ := runtime.Caller(2)
	xargs := append([]interface{}{t, level.PaddedString(8), filepath.Base(fn), line}, args...)
	out := fmt.Sprintf("%s %s %s:%d: " + f, xargs...)
	if !strings.HasSuffix(out, "\n") {
		out += "\n"
	}
	l.Write([]byte(out))
}

func (l *Logger) Println(args ...interface{}) {
	l.log(NONE, args...)
}

func (l *Logger) Printf(f string, args ...interface{}) {
	l.logf(NONE, f, args...)
}

func (l *Logger) Debug(args ...interface{}) {
	l.log(DEBUG, args...)
}

func (l *Logger) Debugf(f string, args ...interface{}) {
	l.logf(DEBUG, f, args...)
}

func (l *Logger) Info(args ...interface{}) {
	l.log(INFO, args...)
}

func (l *Logger) Infof(f string, args ...interface{}) {
	l.logf(INFO, f, args...)
}

func (l *Logger) Warn(args ...interface{}) {
	l.log(WARNING, args...)
}

func (l *Logger) Warnf(f string, args ...interface{}) {
	l.logf(WARNING, f, args...)
}

func (l *Logger) Error(args ...interface{}) {
	l.log(ERROR, args...)
}

func (l *Logger) Errorf(f string, args ...interface{}) {
	l.logf(ERROR, f, args...)
}

func (l *Logger) Trace() {
	skip := 0
	for {
		pc, fn, line, ok := runtime.Caller(skip)
		if !ok {
			break
		}
		// see https://github.com/go-errors/errors/blob/master/stackframe.go
		fnc := runtime.FuncForPC(pc)
		name := fnc.Name()
		pkg := ""
		if lastslash := strings.LastIndex(name, "/"); lastslash >= 0 {
			pkg += name[:lastslash] + "/"
			name = name[lastslash+1:]
		}
		if period := strings.Index(name, "."); period >= 0 {
			pkg += name[:period]
			name = name[period+1:]
		}
		name = strings.Replace(name, "·", ".", -1)
		l.Write([]byte(fmt.Sprintf("%s.%s()\n    %s:%s\n", pkg, name, fn, line)))
		skip += 1
	}
}

func (l *Logger) Fatal(args ...interface{}) {
	l.log(CRITICAL, args...)
	os.Exit(1)
}

func (l *Logger) Fatalf(f string, args ...interface{}) {
	l.logf(CRITICAL, f, args...)
	os.Exit(1)
}

func (l *Logger) Panic(args ...interface{}) {
	l.log(CRITICAL, args...)
	panic(fmt.Sprintln(args...))
}

func (l *Logger) Panicf(f string, args ...interface{}) {
	l.logf(CRITICAL, f, args...)
	panic(fmt.Sprintf(f, args...))
}