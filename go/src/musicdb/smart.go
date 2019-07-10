package musicdb

import (
	"bytes"
	"database/sql/driver"
	"encoding/gob"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"itunes"
)

type Smart struct {
	RuleSet *RuleSet    `json:"ruleset"`
	Limit   *SmartLimit `json:"limit,omitempty"`
}

type RuleSet struct {
	Conjunction Conjunction `json:"conjunction"`
	Rules       []*Rule     `json:"rules"`
}

type Rule struct {
	RuleType       RuleType      `json:"type"`
	RuleSet        *RuleSet      `json:"ruleset,omitempty"`
	Field          *Field        `json:"field,omitempty"`
	LogicSign      LogicSign     `json:"sign,omitempty"`
	Operator       Operator      `json:"op,omitempty"`
	StringValues   []string      `json:"strings,omitempty"`
	IntValues      []int64       `json:"ints,omitempty"`
	TimeValues     []Time        `json:"times,omitempty"`
	BoolValue      *bool         `json:"bool"`
	MediaKindValue *MediaKind    `json:"media_kind,omitempty"`
	PlaylistValue  *PersistentID `json:"playlist,omitempty"`
}

func (r *Rule) Not() bool {
	return r.LogicSign == NEG || r.LogicSign == STRNEG
}

func (r *Rule) Where() (string, []interface{}) {
	if r.RuleType == RulesetRule {
		return r.RuleSet.Where()
	}
	var qs string
	args := []interface{}{}
	switch r.RuleType {
	case StringRule:
		if len(r.StringValues) == 0 {
			if r.Not() {
				qs = fmt.Sprintf("(%s IS NOT NULL AND %s != ?)", r.Field.Column(), r.Field.Column())
			} else {
				qs = fmt.Sprintf("(%s IS NULL OR %s == ?)", r.Field.Column(), r.Field.Column())
			}
			args = append(args, "")
			return qs, args
		}
		qs = r.Field.Column()
		switch r.Operator {
		case CONTAINS:
			if r.Not() {
				qs += " NOT LIKE ?"
			} else {
				qs += " LIKE ?"
			}
			args = append(args, "%" + r.StringValues[0] + "%")
		case STARTSWITH:
			if r.Not() {
				qs += " NOT LIKE ?"
			} else {
				qs += " LIKE ?"
			}
			args = append(args, r.StringValues[0] + "%")
		case ENDSWITH:
			if r.Not() {
				qs += " NOT LIKE ?"
			} else {
				qs += " LIKE ?"
			}
			args = append(args, "%" + r.StringValues[0])
		case GREATERTHAN:
			if r.Not() {
				qs += " <= ?"
			} else {
				qs += " > ?"
			}
			args = append(args, r.StringValues[0])
		case LESSTHAN:
			if r.Not() {
				qs += " >= ?"
			} else {
				qs += " < ?"
			}
			args = append(args, r.StringValues[0])
		case BETWEEN:
			var v1, v2 string
			v1 = r.StringValues[0]
			if len(r.StringValues) > 1 {
				v2 = r.StringValues[1]
			}
			if v1 > v2 {
				args = append(args, v2, v1)
			} else {
				args = append(args, v1, v2)
			}
			if r.Not() {
				qs = fmt.Sprintf("(%s < ? OR %s > ?)", r.Field.Column(), r.Field.Column())
			} else {
				qs = fmt.Sprintf("(%s >= ? AND %s <= ?)", r.Field.Column(), r.Field.Column())
			}
		default:
			if r.Not() {
				qs += " != ?"
			} else {
				qs += " = ?"
			}
			args = append(args, r.StringValues[0])
		}
	case IntRule:
		qs = r.Field.Column()
		if len(r.IntValues) == 0 {
			if r.Not() {
				qs += " IS NOT NULL"
			} else {
				qs += " IS NULL"
			}
			return qs, args
		}
		switch r.Operator {
		case GREATERTHAN:
			if r.Not() {
				qs += " <= ?"
			} else {
				qs += " > ?"
			}
			args = append(args, r.IntValues[0])
		case LESSTHAN:
			if r.Not() {
				qs += " >= ?"
			} else {
				qs += " < ?"
			}
			args = append(args, r.IntValues[0])
		case BETWEEN:
			var v1, v2 int64
			v1 = r.IntValues[0]
			if len(r.IntValues) > 1 {
				v2 = r.IntValues[1]
			}
			if v1 > v2 {
				args = append(args, v2, v1)
			} else {
				args = append(args, v1, v2)
			}
			if r.Not() {
				qs = fmt.Sprintf("(%s < ? OR %s > ?)", r.Field.Column(), r.Field.Column())
			} else {
				qs = fmt.Sprintf("(%s >= ? AND %s <= ?)", r.Field.Column(), r.Field.Column())
			}
		default:
			if r.Not() {
				qs += " != ?"
			} else {
				qs += " = ?"
			}
			args = append(args, r.IntValues[0])
		}
	case BooleanRule:
		qs = r.Field.Column()
		if r.BoolValue == nil {
			if r.Not() {
				qs += " IS NOT NULL"
			} else {
				qs += " IS NULL"
			}
		} else {
			if r.Not() {
				qs += " != ?"
			} else {
				qs += " = ?"
			}
			args = append(args, *r.BoolValue)
		}
	case DateRule:
		qs = r.Field.Column()
		if len(r.TimeValues) == 0 {
			if r.Not() {
				qs += " IS NOT NULL"
			} else {
				qs += " IS NULL"
			}
			return qs, args
		}
		switch r.Operator {
		case GREATERTHAN:
			if r.Not() {
				qs += " <= ?"
			} else {
				qs += " > ?"
			}
			args = append(args, r.TimeValues[0])
		case LESSTHAN:
			if r.Not() {
				qs += " >= ?"
			} else {
				qs += " < ?"
			}
			args = append(args, r.TimeValues[0])
		case BETWEEN:
			var v1, v2 Time
			v1 = r.TimeValues[0]
			if len(r.TimeValues) > 1 {
				v2 = r.TimeValues[1]
			}
			if v1 > v2 {
				args = append(args, v2, v1)
			} else {
				args = append(args, v1, v2)
			}
			if r.Not() {
				qs = fmt.Sprintf("(%s < ? OR %s > ?)", r.Field.Column(), r.Field.Column())
			} else {
				qs = fmt.Sprintf("(%s >= ? AND %s <= ?)", r.Field.Column(), r.Field.Column())
			}
		case WITHIN:
			if r.LogicSign == POS || r.LogicSign == STRPOS {
				qs += " >= "
			} else {
				qs += " < "
			}
			qs += "NOW() - interval ?"
			args = append(args, int64(r.TimeValues[0]))
		default:
			if r.Not() {
				qs += " != ?"
			} else {
				qs += " = ?"
			}
			args = append(args, r.TimeValues[0])
		}
	case MediaKindRule:
		qs = "track.media_kind"
		if r.MediaKindValue == nil {
			if r.Not() {
				qs += " IS NOT NULL"
			} else {
				qs += " IS NULL"
			}
			return qs, args
		}
		switch r.Operator {
		case BITWISE:
			if r.Not() {
				qs += " & ? = 0"
			} else {
				qs += " & ? != 0"
			}
		default:
			if r.Not() {
				qs += " != ?"
			} else {
				qs += " = ?"
			}
		}
		args = append(args, *r.MediaKindValue)
	case PlaylistRule:
		qs = "playlist_track.playlist_id"
		if r.PlaylistValue == nil {
			if r.Not() {
				qs += " IS NOT NULL"
			} else {
				qs += " IS NULL"
			}
			return qs, args
		}
		if r.Not() {
			qs += " != ?"
		} else {
			qs += " = ?"
		}
		args = append(args, *r.PlaylistValue)
	default:
		qs = "1 = 1"
	}
	return qs, args
}

type SmartLimit struct {
	MaxItems   *uint64    `json:"items,omitempty"`
	MaxSize    *uint64    `json:"size,omitempty"`
	MaxTime    *uint64    `json:"time,omitempty"`
	Field      LimitField `json:"field"`
	Descending bool       `json:"desc,omitempty"`
}

func (spl *Smart) Value() (driver.Value, error) {
	if spl == nil {
		return nil, nil
	}
	buf := bytes.Buffer{}
	enc := gob.NewEncoder(&buf)
	err := enc.Encode(spl)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (spl *Smart) Scan(value interface{}) error {
	if value == nil {
		return errors.New("can't decode nil smart playlist")
	}
	switch v := value.(type) {
	case []byte:
		buf := bytes.NewBuffer(v)
		dec := gob.NewDecoder(buf)
		return dec.Decode(spl)
	case string:
		return json.Unmarshal([]byte(v), spl)
	}
	return fmt.Errorf("don't know how to decode %T into smart playlist", value)
}

func (rs *RuleSet) Where() (string, []interface{}) {
	s := "("
	args := []interface{}{}
	for i, r := range rs.Rules {
		if i != 0 {
			s += " " + rs.Conjunction.String() + " "
		}
		rw, rargs := r.Where()
		s += rw
		args = append(args, rargs...)
	}
	s += ")"
	return s, args
}

func (sl *SmartLimit) Order() string {
	s := " ORDER BY " + sl.Field.Column(sl.Descending)
	if sl.MaxItems != nil {
		s += " LIMIT " + strconv.FormatUint(*sl.MaxItems, 10)
	}
	return s
}

func SmartPlaylistFromITunes(ispl *itunes.SmartPlaylist) *Smart {
	return &Smart{
		RuleSet: ruleSetFromITunes(ispl.Criteria),
		Limit: smartInfoFromITunes(ispl.Info),
	}
}

func ruleSetFromITunes(icrit *itunes.SmartPlaylistCriteria) *RuleSet {
	rules := []*Rule{}
	for _, irule := range icrit.Rules {
		r := ruleFromITunes(irule)
		if r == nil {
			continue
		}
		if r.Field != nil && r.Field.Column() == "" {
			continue
		}
		rules = append(rules, ruleFromITunes(irule))
	}
	return &RuleSet{
		Conjunction: Conjunction(icrit.Conjunction),
		Rules: rules,
	}
}

func fieldFromITunes(field itunes.Field) *Field {
	f := Field(field)
	return &f
}

func ruleFromITunes(irule itunes.SmartRule) *Rule {
	switch ir := irule.(type) {
	case *itunes.SmartPlaylistCriteria:
		return &Rule{
			RuleType: RulesetRule,
			RuleSet: ruleSetFromITunes(ir),
		}
	case *itunes.SmartPlaylistStringRule:
		return &Rule{
			RuleType: StringRule,
			Field: fieldFromITunes(ir.Field),
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
			StringValues: []string{ir.Value},
		}
	case *itunes.SmartPlaylistIntegerRule:
		return &Rule{
			RuleType: IntRule,
			Field: fieldFromITunes(ir.Field),
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
			IntValues: ir.Values,
		}
	case *itunes.SmartPlaylistBooleanRule:
		bv := ir.Value
		return &Rule{
			RuleType: BooleanRule,
			Field: fieldFromITunes(ir.Field),
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
			BoolValue: &bv,
		}
	case *itunes.SmartPlaylistMediaKindRule:
		mk := MediaKind(ir.Value)
		return &Rule{
			RuleType: MediaKindRule,
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
			MediaKindValue: &mk,
		}
	case *itunes.SmartPlaylistDateRule:
		r := &Rule{
			RuleType: DateRule,
			Field: fieldFromITunes(ir.Field),
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
		}
		if ir.Operator == itunes.LogicRule_WITHIN {
			r.TimeValues = []Time{Time(ir.Relative)}
		} else {
			r.TimeValues = make([]Time, len(ir.Values))
			for i, it := range ir.Values {
				r.TimeValues[i] = Time(it.EpochMS())
			}
		}
		return r
	case *itunes.SmartPlaylistPlaylistRule:
		pid := PersistentID(ir.Value)
		return &Rule{
			RuleType: PlaylistRule,
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
			PlaylistValue: &pid,
		}
	case *itunes.SmartPlaylistLoveRule:
		var bvp *bool
		switch ir.Value {
		case itunes.LoveStatus_NONE:
		case itunes.LoveStatus_LOVED:
			bvp = new(bool)
			*bvp = true
		case itunes.LoveStatus_DISLIKED:
			bvp = new(bool)
			*bvp = false
		}
		f := Loved
		return &Rule{
			RuleType: BooleanRule,
			Field: &f,
			LogicSign: LogicSign(ir.Sign),
			Operator: Operator(ir.Operator),
			BoolValue: bvp,
		}
	}
	return nil
}

func smartInfoFromITunes(iinfo *itunes.SmartPlaylistInfo) *SmartLimit {
	if !iinfo.HasLimit || iinfo.SortField == nil || iinfo.LimitUnit == nil || iinfo.LimitSize == nil {
		return nil
	}
	lim := &SmartLimit{}
	if iinfo.Descending {
		lim.Descending = true
	}
	lim.Field = LimitField(*iinfo.SortField)
	n := uint64(*iinfo.LimitSize)
	switch *iinfo.LimitUnit {
	case itunes.LimitMethod_ITEMS:
		lim.MaxItems = &n
	case itunes.LimitMethod_MB:
		n *= 1024 * 1024
		lim.MaxSize = &n
	case itunes.LimitMethod_GB:
		n *= 1024 * 1024 * 1024
		lim.MaxSize = &n
	case itunes.LimitMethod_MINUTES:
		n *= 60 * 1000
		lim.MaxTime = &n
	case itunes.LimitMethod_HOURS:
		n *= 60 * 60 * 1000
		lim.MaxTime = &n
	default:
		return nil
	}
	return lim
}

