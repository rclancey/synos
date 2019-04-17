package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"
)

var cpat = regexp.MustCompile("[^A-Za-z0-9_]")

func MakeEnum(name string, values map[string]int) string {
	buf := bytes.NewBuffer([]byte{})
	buf.WriteString(fmt.Sprintf("type %s int\n\n", name))
	buf.WriteString(fmt.Sprintf("var %sNames = map[%s]string{\n", name, name))
	for k, v := range(values) {
		buf.WriteString(fmt.Sprintf("\t%s(0x%X): \"%s\",\n", name, v, k))
	}
	buf.WriteString("}\n")
	buf.WriteString(fmt.Sprintf("var %sValues = map[string]%s{\n", name, name))
	for k, v := range(values) {
		buf.WriteString(fmt.Sprintf("\t\"%s\": %s(0x%X),\n", k, name, v))
	}
	buf.WriteString("}\n")
	buf.WriteString("const (\n")
	for k, v := range(values) {
		ck := cpat.ReplaceAllString(strings.ToUpper(k), "")
		buf.WriteString(fmt.Sprintf("\t%s_%s = %s(0x%X)\n", name, ck, name, v))
	}
	buf.WriteString(")\n\n")
	buf.WriteString(fmt.Sprintf("func (e %s) String() string {\n", name))
	buf.WriteString(fmt.Sprintf("\ts, ok := %sNames[e]\n", name))
	buf.WriteString("\tif ok {\n")
	buf.WriteString("\t\treturn s\n")
	buf.WriteString("\t}\n")
	buf.WriteString(fmt.Sprintf("\treturn fmt.Sprintf(\"%s_0x%%X\", int(e))\n", name))
	buf.WriteString("}\n\n")
	buf.WriteString(fmt.Sprintf("func (e %s) MarshalJSON() ([]byte, error) {\n", name))
	buf.WriteString("\treturn json.Marshal(e.String())\n")
	buf.WriteString("}\n\n")
	buf.WriteString(fmt.Sprintf("func (e *%s) UnmarshalJSON(data []byte) error {\n", name))
	buf.WriteString("\tvar s string\n")
	buf.WriteString("\terr := json.Unmarshal(data, &s)\n")
	buf.WriteString("\tif err != nil {\n")
	buf.WriteString("\t\treturn err\n")
	buf.WriteString("\t}\n")
	buf.WriteString(fmt.Sprintf("\tv, ok := %sValues[s]\n", name))
	buf.WriteString("\tif !ok {\n")
	buf.WriteString(fmt.Sprintf("\t\treturn fmt.Errorf(\"unknown %s %%s\", s)\n", name))
	buf.WriteString("\t}\n")
	buf.WriteString("\t*e = v\n")
	buf.WriteString("\treturn nil\n")
	buf.WriteString("}\n\n")
	return string(buf.Bytes())
}

type EnumData map[string]map[string]int

func main() {
	data, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		panic(err)
	}
	var enums EnumData
	err = json.Unmarshal(data, &enums)
	if err != nil {
		panic(err)
	}
	fmt.Printf("package %s\n\n", os.Args[1])
	fmt.Println("import (")
	fmt.Println("\t\"encoding/json\"")
	fmt.Println("\t\"fmt\"")
	fmt.Println(")\n\n")
	for name, values := range enums {
		fmt.Println(MakeEnum(name, values))
	}
}


