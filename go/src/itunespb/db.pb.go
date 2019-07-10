// Code generated by protoc-gen-go. DO NOT EDIT.
// source: db.proto

package itunespb

import (
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
	math "math"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion3 // please upgrade the proto package

type TrackList struct {
	Tracks               []*Track `protobuf:"bytes,1,rep,name=tracks" json:"tracks,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *TrackList) Reset()         { *m = TrackList{} }
func (m *TrackList) String() string { return proto.CompactTextString(m) }
func (*TrackList) ProtoMessage()    {}
func (*TrackList) Descriptor() ([]byte, []int) {
	return fileDescriptor_8817812184a13374, []int{0}
}

func (m *TrackList) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_TrackList.Unmarshal(m, b)
}
func (m *TrackList) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_TrackList.Marshal(b, m, deterministic)
}
func (m *TrackList) XXX_Merge(src proto.Message) {
	xxx_messageInfo_TrackList.Merge(m, src)
}
func (m *TrackList) XXX_Size() int {
	return xxx_messageInfo_TrackList.Size(m)
}
func (m *TrackList) XXX_DiscardUnknown() {
	xxx_messageInfo_TrackList.DiscardUnknown(m)
}

var xxx_messageInfo_TrackList proto.InternalMessageInfo

func (m *TrackList) GetTracks() []*Track {
	if m != nil {
		return m.Tracks
	}
	return nil
}

func init() {
	proto.RegisterType((*TrackList)(nil), "itunespb.TrackList")
}

func init() { proto.RegisterFile("db.proto", fileDescriptor_8817812184a13374) }

var fileDescriptor_8817812184a13374 = []byte{
	// 87 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0xe2, 0x48, 0x49, 0xd2, 0x2b,
	0x28, 0xca, 0x2f, 0xc9, 0x17, 0xe2, 0xc8, 0x2c, 0x29, 0xcd, 0x4b, 0x2d, 0x2e, 0x48, 0x92, 0xe2,
	0x2e, 0x29, 0x4a, 0x4c, 0xce, 0x86, 0x08, 0x2b, 0x99, 0x70, 0x71, 0x86, 0x80, 0xb8, 0x3e, 0x99,
	0xc5, 0x25, 0x42, 0xea, 0x5c, 0x6c, 0x60, 0xb9, 0x62, 0x09, 0x46, 0x05, 0x66, 0x0d, 0x6e, 0x23,
	0x7e, 0x3d, 0x98, 0x26, 0x3d, 0xb0, 0xa2, 0x20, 0xa8, 0x34, 0x20, 0x00, 0x00, 0xff, 0xff, 0x6f,
	0x04, 0x35, 0x80, 0x57, 0x00, 0x00, 0x00,
}
