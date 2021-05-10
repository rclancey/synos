package radio

import (
	"io"
	//"log"
)

type BufferItem struct {
	data []byte
	next *BufferItem
	prev *BufferItem
}

func (bi *BufferItem) Data() []byte {
	return bi.data
}

func (bi *BufferItem) Next() *BufferItem {
	return bi.next
}

type BufferReader struct {
	head *BufferItem
	count int
	bpos int
	pos int
}

func (br *BufferReader) Read(buf []byte) (int, error) {
	if br.head == nil {
		return 0, io.EOF
	}
	j := 0
	for j < len(buf) {
		data := br.head.Data()
		for i := br.pos; i < len(data); i++ {
			buf[j] = data[i]
			j++
			if j >= len(buf) {
				br.pos = i + 1
				return j, nil
			}
		}
		br.pos = 0
		br.bpos += 1
		if br.bpos >= br.count {
			br.head = nil
			break
		}
		br.head = br.head.Next()
		if br.head == nil {
			break
		}
	}
	return j, nil
}

func (br *BufferReader) Close() error {
	br.head = nil
	return nil
}

type Buffer struct {
	head *BufferItem
	tail *BufferItem
	size int
	capacity int
	bytesize int
}

func NewBuffer(capacity int) *Buffer {
	return &Buffer{
		head: nil,
		tail: nil,
		size: 0,
		capacity: capacity,
		bytesize: 0,
	}
}

func (b *Buffer) Push(data []byte) *BufferItem {
	cp := make([]byte, len(data))
	copy(cp, data)
	bi := &BufferItem{data: cp, next: nil, prev: b.tail}
	b.bytesize += len(data)
	if b.tail == nil {
		b.head = bi
		b.tail = bi
		b.size = 1
	} else {
		b.tail.next = bi
		b.tail = bi
		b.size += 1
		for b.capacity > 0 && b.size > b.capacity {
			b.Shift()
		}
	}
	return bi
}

func (b *Buffer) Shift() *BufferItem {
	if b.head == nil {
		return nil
	}
	bi := b.head
	if bi.next == nil {
		b.head = nil
		b.tail = nil
		b.size = 0
		b.bytesize = 0
	} else {
		b.bytesize -= len(bi.data)
		b.head = bi.next
		b.head.prev = nil
		//bi.next = nil
		b.size -= 1
	}
	return bi
}

func (b *Buffer) Write(data []byte) (int, error) {
	b.Push(data)
	return len(data), nil
}
/*
func (b *Buffer) Pop() *BufferItem {
	if b.tail == nil {
		return nil
	}
	bi := b.tail
	if bi.prev == nil {
		b.head = nil
		b.tail = nil
		b.size = 0
	} else {
		b.tail = bi.prev
		b.tail.next = nil
		bi.prev = nil
	}
	b.size -= 1
	return bi
}

func (b *Buffer) Unshift(data []byte) *BufferItem {
	if b.head == nil {
		return b.Push(data)
	}
	bi := &BufferItem{data: data, next: b.head, prev: nil}
	b.head.prev = bi
	b.size += 1
	for b.capacity > 0 && b.size >= b.capacity {
		b.Pop()
	}
	return bi
}
*/

func (b *Buffer) Head() *BufferItem {
	return b.head
}

func (b *Buffer) Tail() *BufferItem {
	return b.tail
}

func (b *Buffer) Reader() *BufferReader {
	return &BufferReader{
		head: b.head,
		count: b.size,
		bpos: 0,
		pos: 0,
	}
}

