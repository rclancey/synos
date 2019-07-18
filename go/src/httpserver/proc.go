package httpserver

import (
	"fmt"
	"net"
	"os"
	"strconv"
	"syscall"
)


func checkRunning(cfg *ServerConfig) error {
	err := checkRunningPidfile(cfg.PidFile)
	if err != nil {
		return err
	}
	err = checkRunningPort(cfg.Bind.Port)
	if err != nil {
		return err
	}
	if cfg.Bind.SSL.Enabled() {
		err = checkRunningPort(cfg.Bind.SSL.Port)
		if err != nil {
			return err
		}
	}
	return nil
}

func checkRunningPidfile(fn string) error {
	pidF, err := os.Open(fn)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer pidF.Close()
	pidData := make([]byte, 256)
	n, err := pidF.Read(pidData)
	if err != nil {
		return err
	}
	if n == 0 {
		return nil
	}
	pid, err := strconv.ParseInt(string(pidData[:n]), 10, 32)
	if err != nil {
		return err
	}
	proc, err := os.FindProcess(int(pid))
	if err != nil {
		return err
	}
	err = proc.Signal(syscall.Signal(0))
	if err == nil {
		return fmt.Errorf("%s already running at PID %d", os.Args[0], pid)
	}
	return nil
}

func checkRunningPort(port int) error {
	ln, err := net.Listen("tcp", ":" + strconv.Itoa(port))
	if err != nil {
		return fmt.Errorf("port %d is already in use", port)
	}
	ln.Close()
	return nil
}

func writePidfile(cfg *ServerConfig) error {
	pidF, err := os.Create(cfg.PidFile)
	if err != nil {
		return err
	}
	_, err = pidF.Write([]byte(strconv.Itoa(os.Getpid())))
	if err != nil {
		return err
	}
	return pidF.Close()
}

func removePidfile(cfg *ServerConfig) error {
	return os.Remove(cfg.PidFile)
}
