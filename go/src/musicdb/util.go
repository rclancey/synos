package musicdb

func uintp(v uint) *uint { return &v }
func uint8p(v uint8) *uint8 { return &v }
func uint16p(v uint16) *uint16 { return &v }
func uint32p(v uint32) *uint32 { return &v }
func uint64p(v uint64) *uint64 { return &v }
func intp(v int) *int { return &v }
func int8p(v int8) *int8 { return &v }
func int16p(v int16) *int16 { return &v }
func int32p(v int32) *int32 { return &v }
func int64p(v int64) *int64 { return &v }
func stringp(v string) *string {
	if v == "" { return nil }
	return &v
}
func boolp(v bool) *bool { return &v }
func Timep(v Time) *Time { return &v }

func stringpCompare(a, b *string) bool {
	if a == nil && b == nil { return true }
	if a == nil { return *b == "" }
	if b == nil { return *a == "" }
	return *a == *b
}

func boolpCompare(a, b *bool) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func TimepCompare(a, b *Time) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func uintpCompare(a, b *uint) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func uint8pCompare(a, b *uint8) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func uint16pCompare(a, b *uint16) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func uint32pCompare(a, b *uint32) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func uint64pCompare(a, b *uint64) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func intpCompare(a, b *int) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func int8pCompare(a, b *int8) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func int16pCompare(a, b *int16) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func int32pCompare(a, b *int32) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

func int64pCompare(a, b *int64) bool {
	if a == nil && b == nil { return true }
	if a == nil || b == nil { return false }
	return *a == *b
}

