package main

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

func realParse(pid string) uint64 {
	data, _ := hex.DecodeString(pid)
	buf := bytes.NewBuffer(data)
	var id uint64
	binary.Read(buf, binary.BigEndian, &id)
	return id
}

func realEncode(pid uint64) string {
	buf := bytes.NewBuffer([]byte{})
	binary.Write(buf, binary.BigEndian, pid)
	return strings.ToUpper(hex.EncodeToString(buf.Bytes()))
}

func simpleParse(pid string) uint64 {
	id, _ := strconv.ParseUint(pid, 16, 64)
	return id
}

func simpleEncode(pid uint64) string {
	v := strings.ToUpper(strconv.FormatUint(pid, 16))
	return strings.Repeat("0", 16 - len(v)) + v
	/*
	for len(v) < 16 {
		v = "0" + v
	}
	return v
	*/
}

func main() {
	pids := []string{}
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		pids = append(pids, scanner.Text())
	}
	var id uint64
	start := time.Now()
	for _, pid := range pids {
		id = realParse(pid)
	}
	end := time.Now()
	fmt.Println(end.Sub(start).Nanoseconds())
	fmt.Println(id)
	start = time.Now()
	for _, pid := range pids {
		id = simpleParse(pid)
	}
	end = time.Now()
	fmt.Println(end.Sub(start).Nanoseconds())
	fmt.Println(id)
	ids := make([]uint64, len(pids))
	for i, pid := range pids {
		ids[i] = simpleParse(pid)
		//if i % 2 == 0 {
		//	ids[i] = ids[i] >> 16
		//}
	}
	var pid string
	start = time.Now()
	for _, id := range ids {
		pid = realEncode(id)
	}
	end = time.Now()
	fmt.Println(end.Sub(start).Nanoseconds())
	fmt.Println(pid)
	start = time.Now()
	for _, id := range ids {
		pid = simpleEncode(id)
	}
	end = time.Now()
	fmt.Println(end.Sub(start).Nanoseconds())
	fmt.Println(pid)
}
