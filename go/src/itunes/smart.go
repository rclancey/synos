package itunes

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	//"encoding/json"
	"fmt"
	//"io"
	"strings"
	"time"
	"unicode/utf16"
	"unicode/utf8"
)

type FileKind struct {
	Name string `json:"name"`
	Extension string `json:"ext"`
}

var FileKinds = []FileKind{
	FileKind{"Protected AAC audio file", ".m4p"},
	FileKind{"MPEG audio file", ".mp3"},
	FileKind{"AIFF audio file", ".aiff"},
	FileKind{"WAV audio file", ".wav"},
	FileKind{"QuickTime movie file", ".mov"},
	FileKind{"MPEG-4 video file", ".mp4"},
	FileKind{"AAC audio file", ".m4a"},
}

const DateStartFromUnix = int64(-2082844800)

type FieldType int
const (
	RulesetField = iota + 1
	StringField
	IntField
	BooleanField
	DateField
	MediaKindField
	PlaylistField
	LoveField
	CloudField
	LocationField
)

var fieldTypes = map[Field]FieldType{
	Field(0x00): RulesetField,

	Field(0x03): StringField,
	Field(0x47): StringField,
	Field(0x04): StringField,
	Field(0x37): StringField,
	Field(0x0e): StringField,
	Field(0x12): StringField,
	Field(0x36): StringField,
	Field(0x08): StringField,
	Field(0x27): StringField,
	Field(0x09): StringField,
	Field(0x02): StringField,
	Field(0x3e): StringField,
	Field(0x4f): StringField,
	Field(0x51): StringField,
	Field(0x52): StringField,
	Field(0x4e): StringField,
	Field(0x53): StringField,
	Field(0x59): StringField,

	Field(0x23): IntField,
	Field(0x05): IntField,
	Field(0x1f): IntField,
	Field(0x18): IntField,
	Field(0x16): IntField,
	Field(0x19): IntField,
	Field(0x39): IntField,
	Field(0x06): IntField,
	Field(0x3f): IntField,
	Field(0x0c): IntField,
	Field(0x44): IntField,
	Field(0x0d): IntField,
	Field(0x0b): IntField,
	Field(0x07): IntField,

	Field(0x25): BooleanField,
	Field(0x29): BooleanField,
	Field(0x1d): BooleanField,

	Field(0x10): DateField,
	Field(0x0a): DateField,
	Field(0x17): DateField,
	Field(0x45): DateField,

	Field(0x3c): MediaKindField,

	Field(0x28): PlaylistField,

	Field(0x9a): LoveField,

	Field(0x86): CloudField,

	Field(0x85): LocationField,
}

func (f Field) Type() FieldType {
	t, ok := fieldTypes[f]
	if ok {
		return t
	}
	return FieldType(-1)
}

type SmartPlaylistInfo struct {
	CheckedOnly bool `json:"checked_only"`
	Descending bool `json:"descending"`
	HasLimit bool `json:"has_limit"`
	LiveUpdating bool `json:"live_updating"`
	LimitUnit *LimitMethod `json:"limit_method"`
	LimitSize *int `json:"limit_size"`
	SortField *SelectionMethod `json:"sort_field"`
}

type smartInfo struct {
	LiveUpdating uint8
	Match uint8
	HasLimit uint8
	LimitUnit uint8
	SortField uint32
	LimitSize uint32
	CheckedOnly uint8
	Ascending uint8
}

func (inf *SmartPlaylistInfo) Parse(raw []byte) error {
	buf := bytes.NewReader(raw)
	info := &smartInfo{}
	binary.Read(buf, binary.BigEndian, info)
	inf.CheckedOnly = (info.CheckedOnly > 0)
	inf.Descending = (info.Ascending == 0)
	inf.HasLimit = (info.HasLimit > 0)
	inf.LiveUpdating = (info.LiveUpdating > 0)
	if inf.HasLimit {
		lm := LimitMethod(info.LimitUnit)
		lf := SelectionMethod(info.SortField)
		sz := int(info.LimitSize)
		inf.LimitUnit = &lm
		inf.LimitSize = &sz
		inf.SortField = &lf
	} else {
		inf.LimitUnit = nil
		inf.LimitSize = nil
		inf.SortField = nil
	}
	/*
	inf.LiveUpdating = (info.LiveUpdating > 0)
	inf.
	buf.Seek(1, io.SeekCurrent)
	binary.Read(buf, binary.BigEndian, &hasLimit)
	binary.Read(buf, binary.BigEndian, &unitId)
	binary.Read(buf, binary.BigEndian, &fieldId)
	binary.Read(buf, binary.BigEndian, &size)
	binary.Read(buf, binary.BigEndian, &checked)
	binary.Read(buf, binary.BigEndian, &order)
	inf.CheckedOnly = (checked == 1)
	inf.Descending = (order == 1)
	inf.HasLimit = (hasLimit == 1)
	inf.LiveUpdating = (liveUpd == 1)
	if hasLimit == 1 {
		lm := LimitMethod(unitId)
		lf := Field(fieldId)
		sz := int(size)
		inf.LimitMethod = &lm
		inf.LimitSize = &sz
		inf.SortField = &lf
	} else {
		inf.LimitMethod = nil
		inf.LimitSize = nil
		inf.SortField = nil
	}
	*/
	return nil
}

type SmartRule interface {
	Match(track *Track) bool
}

type SmartPlaylistCriteria struct {
	Conjunction Conjunction `json:"conjunction"`
	Rules []SmartRule `json:"rules"`
}

func (r *SmartPlaylistCriteria) Match(track *Track) bool {
	if r.Conjunction == Conjunction_OR {
		for _, rule := range r.Rules {
			if rule != nil && rule.Match(track) {
				return true
			}
		}
		return false
	}
	for _, rule := range r.Rules {
		if rule != nil && !rule.Match(track) {
			return false
		}
	}
	return true
}

type RuleSetHeader struct {
	Junk1 [8]byte
	RuleCount uint32
	ConjunctionId uint32
	Junk2 [120]byte
}

type RuleHeader struct {
	FieldId uint32
	LogicSignId uint8
	Junk1 byte
	LogicRuleId uint16
	Junk2 [44]byte
	Length uint32
}

func (rh RuleHeader) Field() Field {
	return Field(rh.FieldId)
}

func (rh RuleHeader) LogicSign() LogicSign {
	return LogicSign(rh.LogicSignId)
}

func (rh RuleHeader) LogicRule() LogicRule {
	return LogicRule(rh.LogicRuleId)
}

type IntRuleData struct {
	Junk1 [4]byte
	IntA uint32
	Junk2 [12]byte
	BoolB uint32
	Junk3 [4]byte
	IntB uint32
	Junk4 [12]byte
	BoolC uint32
	Junk5 [4]byte
	IntC uint32
	Junk6 [12]byte
}

func (ird IntRuleData) Ints() []int64 {
	ints := []int64{int64(ird.IntA)}
	if ird.BoolB > 0 {
		ints = append(ints, int64(ird.IntB))
		if ird.BoolC > 0 {
			ints = append(ints, int64(ird.IntC))
		}
	}
	return ints
}

func (ird IntRuleData) Times() []*TrackTime {
	ints := ird.Ints()
	if ints[len(ints)-1] == 0 {
		ints = ints[:len(ints)-1]
	}
	times := make([]*TrackTime, len(ints))
	for i, v := range ints {
		t := time.Unix(v+DateStartFromUnix, 0)
		tt := TrackTime(t)
		times[i] = &tt
	}
	return times
}

func (c *SmartPlaylistCriteria) Parse(raw []byte) error {
	buf := bytes.NewReader(raw)
	rulesetHeader := &RuleSetHeader{}
	err := binary.Read(buf, binary.BigEndian, rulesetHeader)
	if err != nil {
		//fmt.Println("error reading ruleset header:", err)
		return err
	}
	c.Conjunction = Conjunction(rulesetHeader.ConjunctionId)
	c.Rules = make([]SmartRule, int(rulesetHeader.RuleCount))
	//fmt.Printf("parsing smart criteria (%d rules)\n", rulesetHeader.RuleCount)
	for i := uint32(0); i < rulesetHeader.RuleCount; i++ {
		ruleHeader := &RuleHeader{}
		binary.Read(buf, binary.BigEndian, ruleHeader)
		data := make([]byte, int(ruleHeader.Length))
		buf.Read(data)
		var rule SmartRule
		switch ruleHeader.Field().Type() {
		case RulesetField:
			// TODO
			sub := &SmartPlaylistCriteria{}
			err := sub.Parse(data)
			if err != nil {
				return err
			}
			rule = sub
		case StringField:
			rule = NewSmartPlaylistStringRule(ruleHeader, data)
		case IntField:
			rule = NewSmartPlaylistIntegerRule(ruleHeader, data)
		case BooleanField:
			rule = NewSmartPlaylistBooleanRule(ruleHeader, data)
		case DateField:
			rule = NewSmartPlaylistDateRule(ruleHeader, data)
		case MediaKindField:
			rule = NewSmartPlaylistMediaKindRule(ruleHeader, data)
		case PlaylistField:
			rule = NewSmartPlaylistPlaylistRule(ruleHeader, data)
		case LoveField:
			rule = NewSmartPlaylistLoveRule(ruleHeader, data)
		case CloudField:
			rule = NewSmartPlaylistCloudRule(ruleHeader, data)
		case LocationField:
			rule = NewSmartPlaylistLocationRule(ruleHeader, data)
		}
		//rhd, _ := json.Marshal(ruleHeader)
		//rd, _ := json.Marshal(rule)
		//fmt.Println(string(rhd), string(rd))
		c.Rules[int(i)] = rule
	}
	return nil
}

type SmartPlaylistStringRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value string `json:"value"`
}

// UTF16BytesToString converts UTF-16 encoded bytes, in big or little endian byte order,
// to a UTF-8 encoded string.
func UTF16BytesToString(b []byte, o binary.ByteOrder) string {
    utf := make([]uint16, (len(b)+(2-1))/2)
    for i := 0; i+(2-1) < len(b); i += 2 {
        utf[i/2] = o.Uint16(b[i:])
    }
    if len(b)/2 < len(utf) {
        utf[len(utf)-1] = utf8.RuneError
    }
    return string(utf16.Decode(utf))
}

func NewSmartPlaylistStringRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistStringRule {
	return &SmartPlaylistStringRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "string",
		Value: UTF16BytesToString(value, binary.BigEndian),
	}
}

func (r *SmartPlaylistStringRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistIntegerRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Values []int64 `json:"values"`
}

func NewSmartPlaylistIntegerRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistIntegerRule {
	buf := bytes.NewReader(value)
	ird := &IntRuleData{}
	binary.Read(buf, binary.BigEndian, ird)
	return &SmartPlaylistIntegerRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "int",
		Values: ird.Ints(),
	}
}

func (r *SmartPlaylistIntegerRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistBooleanRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value bool `json:"value"`
}

func NewSmartPlaylistBooleanRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistBooleanRule {
	return &SmartPlaylistBooleanRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "bool",
		Value: true,
	}
}

func (r *SmartPlaylistBooleanRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistMediaKindRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value MediaKind `json:"value"`
}

func NewSmartPlaylistMediaKindRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistMediaKindRule {
	buf := bytes.NewReader(value)
	ird := &IntRuleData{}
	binary.Read(buf, binary.BigEndian, ird)
	return &SmartPlaylistMediaKindRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "media",
		Value: MediaKind(ird.Ints()[0]),
	}
}

func (r *SmartPlaylistMediaKindRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistDateRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Values []*TrackTime `json:"values"`
}

func NewSmartPlaylistDateRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistDateRule {
	buf := bytes.NewReader(value)
	ird := &IntRuleData{}
	binary.Read(buf, binary.BigEndian, ird)
	return &SmartPlaylistDateRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "date",
		Values: ird.Times(),
	}
}

func (r *SmartPlaylistDateRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistPlaylistRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value string `json:"value"`
}

func NewSmartPlaylistPlaylistRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistPlaylistRule {
	buf := bytes.NewReader(value)
	var id uint64
	binary.Read(buf, binary.BigEndian, &id)
	ids := fmt.Sprintf("%016X", id)
	return &SmartPlaylistPlaylistRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "playlist",
		Value: ids,
	}
}

func (r *SmartPlaylistPlaylistRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistLoveRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value LoveStatus `json:"value"`
}

func NewSmartPlaylistLoveRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistLoveRule {
	buf := bytes.NewReader(value)
	ird := &IntRuleData{}
	binary.Read(buf, binary.BigEndian, ird)
	return &SmartPlaylistLoveRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "playlist",
		Value: LoveStatus(ird.IntA),
	}
}

func (r *SmartPlaylistLoveRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistCloudRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value ICloudStatus `json:"value"`
}

func NewSmartPlaylistCloudRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistCloudRule {
	buf := bytes.NewReader(value)
	ird := &IntRuleData{}
	binary.Read(buf, binary.BigEndian, ird)
	return &SmartPlaylistCloudRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "playlist",
		Value: ICloudStatus(ird.IntA),
	}
}

func (r *SmartPlaylistCloudRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylistLocationRule struct {
	Field Field `json:"field"`
	Sign LogicSign `json:"sign"`
	Operator LogicRule `json:"operator"`
	RuleType string `json:"type"`
	Value LocationStatus `json:"value"`
}

func NewSmartPlaylistLocationRule(ruleHeader *RuleHeader, value []byte) *SmartPlaylistLocationRule {
	buf := bytes.NewReader(value)
	ird := &IntRuleData{}
	binary.Read(buf, binary.BigEndian, ird)
	return &SmartPlaylistLocationRule{
		Field: ruleHeader.Field(),
		Sign: ruleHeader.LogicSign(),
		Operator: ruleHeader.LogicRule(),
		RuleType: "playlist",
		Value: LocationStatus(ird.IntA),
	}
}

func (r *SmartPlaylistLocationRule) Match(track *Track) bool {
	// TODO
	return false
}

type SmartPlaylist struct {
	rawInfo []byte
	rawCriteria []byte
	Info *SmartPlaylistInfo `json:"info"`
	Criteria *SmartPlaylistCriteria `json:"criteria"`
}

func decodeb64(data []byte) ([]byte, error) {
	s := strings.TrimSpace(string(data))
	s = strings.Join(strings.Fields(strings.TrimSpace(s)), "")
	return base64.StdEncoding.DecodeString(s)
}

func ParseSmartPlaylist(info, criteria []byte) (*SmartPlaylist, error) {
	//fmt.Println("parse smart playlist", string(info), string(criteria))
	dinfo, err := decodeb64(info)
	if err != nil {
		return nil, err
	}
	dcrit, err := decodeb64(criteria)
	if err != nil {
		return nil, err
	}
	//fmt.Println("parse smart playlist", dinfo, dcrit)
	p := &SmartPlaylist{
		rawInfo: dinfo,
		rawCriteria: dcrit,
		Info: &SmartPlaylistInfo{},
		Criteria: &SmartPlaylistCriteria{},
	}
	err = p.Info.Parse(dinfo)
	if err != nil {
		return nil, err
	}
	err = p.Criteria.Parse(dcrit)
	if err != nil {
		return nil, err
	}
	return p, nil
}

