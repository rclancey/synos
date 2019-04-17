import base64, datetime

## cribbed from SmartPlaylistParser.cs from
## http:#code.google.com/p/banshee-itunes-import-plugin/
## by Scott Peterson (lunchtimemama at gmail)
## http://www.koders.com/csharp/fid70C42F40BE1C9E000B0893427B1F6AFE92C50B87.aspx

LimitMethods = {
    'Minutes':        0x01,
    'MB':             0x02,
    'Items':          0x03,
    'Hours':          0x04,
    'GB':             0x05,
}
SelectionMethods = {
    'Random':         0x02,
    'Title':          0x05,
    'AlbumTitle':     0x06,
    'Artist':         0x07,
    'Genre':          0x09,
    'HighestRating':  0x1c,
    'LowestRating':   0x01,
    'RecentlyPlayed': 0x1a,
    'OftenPlayed':    0x19,
    'RecentlyAdded':  0x15,
}
StringFields = { 
    'AlbumTitle':     0x03,
    'AlbumArtist':    0x47,
    'Artist':         0x04,
    'Category':       0x37,
    'Comments':       0x0e,
    'Composer':       0x12,
    'Description':    0x36,
    'Genre':          0x08,
    'Grouping':       0x27,
    'Kind':           0x09,
    'Title':          0x02,
    'Show':           0x3e,
}
BooleanFields = {
}
IntFields = {
    'BPM':            0x23,
    'Checked':        0x1d,
    'BitRate':        0x05,
    'Compilation':    0x1f,
    'DiskNumber':     0x18,
    'NumberOfPlays':  0x16,
    'Rating':         0x19,
    'AlbumRating':    0x5a,
    'Playlist':       0x28,    # FIXME Move this?
    'Podcast':        0x39,
    'SampleRate':     0x06,
    'Season':         0x3f,
    'Size':           0x0c,
    'SkipCount':      0x44,
    'Duration':       0x0d,
    'TrackNumber':    0x0b,
    'VideoKind':      0x3c,
    'Year':           0x07,
}
DateFields = {
    'DateAdded':      0x10,
    'DateModified':   0x0a,
    'LastPlayed':     0x17,
    'LastSkipped':    0x45,
}
IgnoreStringFields = {   
    'AlbumArtist':    0x47,
    'Category':       0x37,
    'Comments':       0x0e,
    'Composer':       0x12,
    'Description':    0x36,
    'Grouping':       0x27,
    'Show':           0x3e,
}
IgnoreBooleanFields = {
}
IgnoreIntFields = {   
    'BPM':            0x23,
    'BitRate':        0x05,
    'Compilation':    0x1f,
    'DiskNumber':     0x18,
    'Playlist':       0x28,
    'Podcast':        0x39,
    'SampleRate':     0x06,
    'Season':         0x3f,
    'Size':           0x0c,
    'SkipCount':      0x44,
    'TrackNumber':    0x0b,
    'VideoKind':      0x3c,
}
IgnoreDateFields = {   
    'DateModified':   0x0a,
    'LastSkipped':    0x45,
}
LogicSign = {   
    'IntPositive':    0x00,
    'StringPositive': 0x01,
    'IntNegative':    0x02,
    'StringNegative': 0x03,
}
LogicRule = {   
    'Other':          0x00,
    'Is':             0x01,
    'Contains':       0x02,
    'Starts':         0x04,
    'Ends':           0x08,
    'Greater':        0x10,
    'Less':           0x40,
}

ReverseLimitMethods       = dict((v,k) for k,v in LimitMethods.items())
ReverseSelectionMethods   = dict((v,k) for k,v in SelectionMethods.items())
ReverseStringFields       = dict((v,k) for k,v in StringFields.items())
ReverseBooleanFields      = dict((v,k) for k,v in BooleanFields.items())
ReverseIntFields          = dict((v,k) for k,v in IntFields.items())
ReverseDateFields         = dict((v,k) for k,v in DateFields.items())
ReverseIgnoreStringFields = dict((v,k) for k,v in IgnoreStringFields.items())
ReverseIgnoreBooleanFields= dict((v,k) for k,v in IgnoreBooleanFields.items())
ReverseIgnoreIntFields    = dict((v,k) for k,v in IgnoreIntFields.items())
ReverseIgnoreDateFields   = dict((v,k) for k,v in IgnoreDateFields.items())
ReverseLogicSign          = dict((v,k) for k,v in LogicSign.items())
ReverseLogicRule          = dict((v,k) for k,v in LogicRule.items())

def test():
    info_str = """
AQEBAwAAABUAAABkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAABAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABElAWbxJaYJ2MAAAAAAAAAAAAAAAAAAAAB
lAWbxJaYJ2MAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZAAAAEAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAx
AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAxAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAA
AAAAAAAA
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test2():
    info_str = """
AQEAAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEcBAAACAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAFYAYQByAGkAbwB1AHMAAAAnAwAAAQAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFABTAG8AdQBu
AGQAdAByAGEAYwBrAAAABAMAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAA4AVgBhAHIAaQBvAHUAcwAAAFoAAAAQAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAADEAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAADEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdAgAAAQAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAB
AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAA
AAAAAAAA
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test3():
    info_str = """
AQEAAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcBAAABAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAEcAcgBlAGEAdABlAHMAdAAgAEgAaQB0
AHMAAAAdAgAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAARAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAA
AAAAAAAAAAAAAAAAAAAAAAAA
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test4():
    info_str = """
AQEAAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAU0xzdAABAAEAAAACAAAAAQAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAADwAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAABEAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAg
AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnpTTHN0AAEAAQAAAAcAAAAB
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAACAEAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAABIAQwBsAGEAcwBzAGkAYwBhAGwAAAAIAQAAAQAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEABLAGwAYQBzAHMAaQBlAGsAAAAI
AQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgBD
AGwAYQBzAHMAaQBxAHUAZQAAAAgBAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAOAEsAbABhAHMAcwBpAGsAAAAIAQAAAQAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEABDAGwAYQBzAHMAaQBjAGEAAAAI
AQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACjCv
MOkwtzDDMK8AAAAIAQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAADgBDAGwA4QBzAGkAYwBh
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test5():
    info_str = """
AQEBAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFoAAAAQAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAEUAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAAEUAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdAgAAAQAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAB
AAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAHwIAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAEQAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAAAAAAAAAAAAAAAA
AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUCAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAQAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAABAAAAAAAA
AAAAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAKQIAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAE8BAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAGAGYAbwBv
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test6():
    info_str = """
AQEBAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFoAAAAQAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAEUAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAAEUAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAA=
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test7():
    info_str = """
AQEBAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0CAAABAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAA=
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test8():
    info_str = """
AQEAAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0AAAABAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAA=
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

def test9():
    info_str = """
AQEBAwAAAAIAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAA==
"""
    criteria_str = """
U0xzdAABAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAABAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAB
AAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAA=
"""
    spl = SmartPlaylistParser(info_str, criteria_str)
    return spl.parse()

class SmartPlaylistParser:
    # INFO OFFSETS
    #
    # Offsets for bytes which...
    MATCHBOOLOFFSET = 1;           # determin whether logical matching is to be performed - Absolute offset
    LIMITBOOLOFFSET = 2;           # determin whether results are limited - Absolute offset
    LIMITMETHODOFFSET = 3;         # determin by what criteria the results are limited - Absolute offset
    SELECTIONMETHODOFFSET = 7;     # determin by what criteria limited playlists are populated - Absolute offset
    LIMITINTOFFSET = 11;           # determin the limited - Absolute offset
    SELECTIONMETHODSIGNOFFSET = 13;# determin whether certain selection methods are "most" or "least" - Absolute offset 

    # CRITERIA OFFSETS
    #
    # Offsets for bytes which...
    LOGICTYPEOFFSET = 15;   # determin whether all or any criteria must match - Absolute offset
    FIELDOFFSET = 139;      # determin what is being matched (Artist, Album, &c) - Absolute offset
    LOGICSIGNOFFSET = 1;    # determin whether the matching rule is positive or negative (e.g., is vs. is not) - Relative offset from FIELDOFFSET
    LOGICRULEOFFSET = 4;    # determin the kind of logic used (is, contains, begins, &c) - Relative offset from FIELDOFFSET
    STRINGOFFSET = 54;      # begin string data - Relative offset from FIELDOFFSET
    INTAOFFSET = 60;        # begin the first int - Relative offset from FIELDOFFSET
    INTBOFFSET = 24;        # begin the second int - Relative offset from INTAOFFSET
    TIMEMULTIPLEOFFSET = 76;# begin the int with the multiple of time - Relative offset from FIELDOFFSET
    TIMEVALUEOFFSET = 68;   # begin the inverse int with the value of time - Relative offset from FIELDOFFSET
    BOOLEANLENGTH = 121
    INTLENGTH = 64;       # The length on a int criteria starting at the first int
    STARTOFTIME = datetime.datetime(1904, 1, 1); # Dates are recorded as seconds since Jan 1, 1904

    def __init__(self, info_str, criteria_str):
        self.info = list(ord(x) for x in base64.b64decode(info_str))
        self.criteria = list(ord(x) for x in base64.b64decode(criteria_str))

    def parse(self):
        self.offset = self.FIELDOFFSET
        self.output = ''
        self.query = ''
        self.ignore = ''
        if self.info[self.MATCHBOOLOFFSET] == 1:
            x = (self.criteria[self.LOGICTYPEOFFSET] == 1)
            if x:
                self.conjunctionQuery = ' OR '
                self.conjunctionOutput = ' or\n'
            else:
                self.conjunctionQuery = ' AND '
                self.conjunctionOutput = ' and\n'
            self.again = True
            while self.again:
                self.logicSignOffset = self.offset + self.LOGICSIGNOFFSET
                self.logicRulesOffset = self.offset + self.LOGICRULEOFFSET
                self.stringOffset = self.offset + self.STRINGOFFSET
                self.intAOffset = self.offset + self.INTAOFFSET;
                self.intBOffset = self.intAOffset + self.INTBOFFSET;
                self.timeMultipleOffset = self.offset + self.TIMEMULTIPLEOFFSET;
                self.timeValueOffset = self.offset + self.TIMEVALUEOFFSET;
                if ReverseStringFields.has_key(self.criteria[self.offset]):
                    print 'string field'
                    self.ProcessStringField()
                elif ReverseBooleanFields.has_key(self.criteria[self.offset]):
                    print 'bool field'
                    self.ProcessBooleanField()
                elif ReverseIntFields.has_key(self.criteria[self.offset]):
                    print 'int field'
                    self.ProcessIntField()
                elif ReverseDateFields.has_key(self.criteria[self.offset]):
                    print 'date field'
                    self.ProcessDateField()
                else:
                    print 'ignoring %s' % self.criteria[self.offset]
                    remainder = list(self.criteria[i] for i in range(self.offset, len(self.criteria)))
                    print remainder
                    self.ignore = '%s %d Not processed' % (self.ignore, self.criteria[self.offset])
                    self.again = False
                if self.offset >= len(self.criteria):
                    self.again = False
        result = { 'Output': self.output,
                   'Query':  self.query,
                   'Ignore': self.ignore }
        if self.info[self.LIMITBOOLOFFSET] == 1:
            limit = self.BytesToUInt(self.info, self.LIMITINTOFFSET)
            lm = ReverseLimitMethods[self.info[self.LIMITMETHODOFFSET]]
            if lm == 'GB':
                result['LimitNumber'] = limit * 1024
            else:
                result['LimitNumber'] = limit
            if len(self.output) > 0:
                self.output = '%s\n' % self.output
            self.output = '%sLimited to %d %s selected by ' % (self.output, limit, lm)
            if lm == 'Items':
                result['LimitMethod'] = 0
            elif lm == 'Minutes':
                result['LimitMethod'] = 1
            elif lm == 'Hours':
                result['LimitMethod'] = 2
            elif lm == 'MB' or lm == 'GB':
                result['LimitMethod'] = 3
            sm = ReverseSelectionMethods[self.info[self.SELECTIONMETHODOFFSET]]
            if sm == 'Random':
                self.output = '%srandom' % self.output
                result['OrderBy'] = 'RANDOM()'
            elif sm == 'HighestRating':
                self.output = '%shighest rated' % self.output
                result['OrderBy'] = 'Rating DESC'
            elif sm == 'LowestRating':
                self.output = '%slowest rated' % self.output
                result['OrderBy'] = 'Rating ASC'
            elif sm == 'RecentlyPlayed':
                if self.info[self.SELECTIONMETHODSIGNOFFSET] == 0:
                    self.output = '%smost recently played' % self.output
                    result['OrderBy'] = 'LastPlayedStamp DESC'
                else:
                    self.output = '%sleast recently played' % self.output
                    result['OrderBy'] = 'LastPlayedStamp ASC'
            elif sm == 'OftenPlayed':
                if self.info[self.SELECTIONMETHODSIGNOFFSET] == 0:
                    self.output = '%smost often played' % self.output
                    result['OrderBy'] = 'NumberOfPlays DESC'
                else:
                    self.output = '%sleast often played' % self.output
                    result['OrderBy'] = 'NumberOfPlays ASC'
            elif sm == 'RecentlyAdded':
                if self.info[self.SELECTIONMETHODSIGNOFFSET] == 0:
                    self.output = '%smost recently added' % self.output
                    result['OrderBy'] = 'DateAddedStamp DESC'
                else:
                    self.output = '%sleast recently added' % self.output
                    result['OrderBy'] = 'DateAddedStamp ASC'
        if len(self.ignore) > 0:
            self.output = '%s\n\nIGNORING:\n%s' % (self.output, self.ignore)
        if len(self.query) > 0:
            self.output = '%s\n\nQUERY:\n%s' % (self.output, self.query)
        result['Output'] = self.output
        return result

    def ProcessStringField(self):
        end = False
        fieldName = ReverseStringFields[self.criteria[self.offset]]
        if fieldName == 'Kind':
            raise Exception("Can't deal with kind rule")
        workingOutput = fieldName
        workingQuery = '(lower(%s)' % fieldName
        ruleName = ReverseLogicRule[self.criteria[self.logicRulesOffset]]
        logic = ReverseLogicSign[self.criteria[self.logicSignOffset]]
        if ruleName == 'Contains':
            if logic == 'StringPositive':
                workingOutput = '%s contains ' % workingOutput
                workingQuery = "%s LIKE '%%" % workingQuery
            else:
                workingOutput = '%s does not contain ' % workingOutput
                workingQuery = "%s NOT LIKE '%%" % workingQuery
            end = True
        elif ruleName == 'Is':
            if logic == 'StringPositive':
                workingOutput = '%s is ' % workingOutput
                workingQuery = "%s = '" % workingQuery
            else:
                workingOutput = '%s is not ' % workingOutput
                workingQuery = "%s != '" % workingQuery
        elif ruleName == 'Starts':
            workingOutput = '%s starts with ' % workingOutput
            workingQuery = "%s LIKE '" % workingQuery
            end = True
        elif ruleName == 'Ends':
            workingOutput = '%s ends with ' % workingOutput
            workingQuery = "%s LIKE '%%" % workingQuery
        workingOutput = '%s"' % workingOutput
        content = ''
        onByte = True
        remainder = list(self.criteria[i] for i in range(self.stringOffset, len(self.criteria)))
        i = self.stringOffset
        n = len(self.criteria)
        while i < n:
            if self.criteria[i] == 0 and self.criteria[i+1] == 0:
                self.offset = i + 2
                if i < n - 2:
                    self.again = True
                return self.FinishStringField(content, workingOutput, workingQuery, end)
            if self.criteria[i+1] == 0:
                content = '%s%s' % (content, chr(self.criteria[i]))
            else:
                content = '%s%s%s' % (content, chr(self.criteria[i]), chr(self.criteria[i+1]))
            i += 2
        self.FinishStringField(content, workingOutput, workingQuery, end)

    def FinishStringField(self, content, workingOutput, workingQuery, end):
        content = content.decode('UTF-8')
        workingOutput = '%s%s" ' % (workingOutput, content)
        failed = False
        workingQuery = '%s%s' % (workingQuery, content.lower())
        if end:
            workingQuery = "%s%%')" % workingQuery
        else:
            workingQuery = "%s')" % workingQuery
        if ReverseIgnoreStringFields.has_key(self.criteria[self.offset]) or failed:
            if len(self.ignore) > 0:
                self.ignore = '%s%s' % (self.ignore, self.conjunctionOutput)
            self.ignore = '%s%s' % (self.ignore, workingOutput)
        else:
            if len(self.output) > 0:
                self.output = '%s%s' % (self.output, self.conjunctionOutput)
            if len(self.query) > 0:
                self.query = '%s%s' % (self.query, self.conjunctionQuery)
            self.output = '%s%s' % (self.output, workingOutput)
            self.query = '%s%s' % (self.query, workingQuery)

    def ProcessBooleanField(self):
        fieldName = ReverseBooleanFields[self.criteria[self.offset]]
        workingOutput = fieldName
        workingQuery = '(%s' % fieldName
        ruleName = ReverseLogicRule[self.criteria[self.logicRulesOffset]]
        logic = ReverseLogicSign[self.criteria[self.logicSignOffset]]
        if ruleName == 'Is':
            if logic == 'IntPositive':
                workingOutput = '%s is true' % workingOutput
                workingQuery = '%s = 1)' % workingQuery
            else:
                workingOutput = '%s is false' % workingOutput
                workignQuery  ='%s = 0)' % workingQuery
        if ReverseIgnoreBooleanFields.has_key(self.criteria[self.offset]):
            if len(self.ignore) > 0:
                self.ignore = '%s%s' % (self.ignore, self.conjunctionOutput)
            self.ignore = '%s%s' % (self.ignore, workingOutput)
        else:
            if len(self.output) > 0:
                self.output = '%s%s' % (self.output, self.conjunctionOutput)
            if len(self.query) > 0:
                self.query = '%s%s' % (self.query, self.conjunctionQuery)
            self.output = '%s%s' % (self.output, workingOutput)
            self.query = '%s%s' % (self.query, workingQuery)
        self.offset = self.offset + self.BOOLEANLENGTH
        if len(self.criteria) > self.offset:
            self.again = True
        
    def ProcessIntField(self):
        fieldName = ReverseIntFields[self.criteria[self.offset]]
        workingOutput = fieldName
        workingQuery = '(%s' % fieldName
        ruleName = ReverseLogicRule[self.criteria[self.logicRulesOffset]]
        logic = ReverseLogicSign[self.criteria[self.logicSignOffset]]
        if ruleName == 'Other':
            if self.criteria[self.logicSignOffset+2] == 1:
                workingOutput = '%s is in the range of ' % workingOutput
                workingQuery = ' BETWEEN ' % workingQuery
                num = self.BytesToUInt(self.criteria, self.intAOffset)
                workingOutput = '%s%d to ' % (workingOutput, num)
                workingQuery = '%s%d AND ' % (workingQuery, num)
                num = self.BytesToUInt(self.criteria, self.intBOffset)
                workingOutput = '%s%d' % (workingOutput, num)
                workingQuery = '%s%d ' % (workingQuery, num)
        else:
            if ruleName == 'Is':
                if logic == 'IntPositive':
                    workingOutput = '%s is ' % workingOutput
                    workingQuery = '%s = ' % workingQuery
                else:
                    workingOutput = '%s is not ' % workingOutput
                    workingQuery = '%s != ' % workingQuery
            elif ruleName == 'Greater':
                workingOutput = '%s is greater than ' % workingOutput
                workingQuery = '%s > ' % workingQuery
            elif ruleName == 'Less':
                workingOutput = '%s is less than' % workingOutput
                workingQuery = '%s < ' % workingQuery
            num = self.BytesToUInt(self.criteria, self.intAOffset)
            if fieldName == 'Rating':
                num = num / 20
            workingOutput = '%s%d' % (workingOutput, num)
            workingQuery = '%s%d' % (workingQuery, num)
        workingQuery = '%s)' % workingQuery
        if ReverseIgnoreIntFields.has_key(self.criteria[self.offset]):
            if len(self.ignore) > 0:
                self.ignore = '%s%s' % (self.ignore, self.conjunctionOutput)
            self.ignore = '%s%s' % (self.ignore, workingOutput)
        else:
            if len(self.output) > 0:
                self.output = '%s%s' % (self.output, self.conjunctionOutput)
            if len(self.query) > 0:
                self.query = '%s%s' % (self.query, self.conjunctionQuery)
            self.output = '%s%s' % (self.output, workingOutput)
            self.query = '%s%s' % (self.query, workingQuery)
        self.offset = self.intAOffset + self.INTLENGTH
        if len(self.criteria) > self.offset:
            self.again = True

    def ProcessDateField(self):
        isIgnore = False
        fieldName = ReverseDatFields[self.criteria[self.offset]]
        workingOutput = fieldName
        workingQuery = '(%s' % fieldName
        ruleName = ReverseLogicRule[self.criteria[self.logicRulesOffset]]
        if ruleName == 'Other':
            if self.criteria[self.logicSignOffset+2] == 1:
                isIgnore = True
                t2 = self.BytesToDateTime(self.criteria, self.intAOffset)
                t1 = self.BytesToDateTime(self.criteria, self.intBOffset)
                if ReverseLogicSign[self.criteria[self.logicSignOffset]] == 'IntPositive':
                    workingOutput = '%s is in the range of ' % workingOutput
                    workingQuery = '%s BETWEEN ' % workingQuery
                else:
                    workingOutput = '%s is not in the range of ' % workingOutput
                    workingQuery = '%s NOT BETWEEN ' % workingQuery
                workingOutput = '%s%s to %s' % (workingOutput, t1.strftime('%Y-%m-%d %H:%M:%S'), t2.strftime('%Y-%m-%d %H:%M:%S'))
                workingQuery = "%s'%s' AND '%s'" % (workingQuery, t1.strftime('%Y-%m-%d %H:%M:%S'), t2.strftime('%Y-%m-%d %H:%M:%S'))
            elif self.criteria[self.logicSignOffset+2] == 2:
                if ReverseLogicSign[self.criteria[self.logicSignOffset]] == 'IntPositive':
                    workingOutput = '%s is in the last ' % workingOutput
                    workingQuery = '%s < ' % workingQuery
                else:
                    workingOutput = '%s is not in the last ' % workingOutput
                    workingQuery = '%s > ' % workingQuery
                t = self.InverseBytesToUInt(self.criteria, self.timeValueOffset)
                m = self.BytesToUInt(self.criteria, self.timeMultipleOffset)
                workingOutput = '%s%d ' % (workingOutput, t)
                workingQuery = '%s%d' % (workingQuery, t*m)
                if m == 86400:
                    workingOutput = '%sdays' % workingOutput
                elif m == 604800:
                    workingOutput = '%sweeks' % workingOutput
                elif m == 2628000:
                    workingOutput ='%smonths' % workingOutput
        else:
            if ruleName == 'Greater':
                workingOutput = '%s is after ' % workingOutput
                workingQuery = '%s > ' % workingQuery
            elif ruleName == 'Less':
                workingOutput = '%s is before ' % workingOutput
                workingQuery = '%s < ' % workingQuery
            isIgnore = True
            when = self.BytesToDateTime(self.criteria, self.intAOffset)
            workingOutput = '%s%s' % (workingOutput, when.strftime('%Y-%m-%d %H:%M:%S'))
            workingQuery = "%s'%s'" % (workingQuery, when.strftime('%Y-%m-%d %H:%M:%S'))
        workingQuery = '%s)' % workingQuery
        if isIgnore or ReverseIgnoreDateFields.has_key(self.criteria[self.offset]):
            if len(self.ignore) > 0:
                self.ignore = '%s%s' % (self.ignore, self.conjunctionOutput)
            self.ignore = '%s%s' % (self.ignore, workingOutput)
        else:
            if len(self.output) > 0:
                self.output = '%s%s' % (self.output, self.conjunctionOutput)
            if len(self.query) > 0:
                self.query = '%s%s' % (self.query, self.conjunctionQuery)
            self.output = '%s%s' % (self.output, workingOutput)
            self.query = '%s%s' % (self.query, workingQuery)
        self.offset = self.intAOffset + self.INTLENGTH
        if len(self.criteria) > self.offset:
            self.again = True

    def BytesToUInt(self, byteArray, offset):
        output = 0
        for i in range(5):
            output += byteArray[offset - i] * (2**(8*i))
        return output

    def InverseBytesToUInt(self, byteArray, offset):
        output = 0
        for i in range(5):
            output += ((255 - (byteArray[offset - i])) * (2**(8*i)))
        return output + 1

    def BytesToDateTime(self, byteArray, offset):
        num = self.BytesToUInt(byteArray, offset)
        return self.STARTOFTIME + datetime.timedelta(0, num)


#def SmartPlaylist:
#    def __init__(self):
#        self.conjunction = 'AND'
#        self.rules = list()
#        self.limit = 0
#        self.limit_field = None
#        self.sort_order = 0
#        self.sort_field = None
#
#class SmartPlaylistRule:
#    def __init__(self, field, value, operator, value):
#
#class SmartPlaylistStringRule(SmartPlaylistRule):
#
#    def export(self):
#        bytes = list()
#        
#    def ProcessStringField(self):
#        end = False
#        fieldName = ReverseStringFields[self.criteria[self.offset]]
#        workingOutput = fieldName
#        workingQuery = '(lower(%s)' % fieldName
#        ruleName = ReverseLogicRule[self.criteria[self.logicRulesOffset]]
#        logic = ReverseLogicSign[self.criteria[self.logicSignOffset]]
#        if ruleName == 'Contains':
#            if logic == 'StringPositive':
#                workingOutput = '%s contains ' % workingOutput
#                workingQuery = "%s LIKE '%%" % workingQuery
#            else:
#                workingOutput = '%s does not contain ' % workingOutput
#                workingQuery = "%s NOT LIKE '%%" % workingQuery
#            end = True
#        elif ruleName == 'Is':
#            if logic == 'StringPositive':
#                workingOutput = '%s is ' % workingOutput
#                workingQuery = "%s = '" % workingQuery
#            else:
#                workingOutput = '%s is not ' % workingOutput
#                workingQuery = "%s != '" % workingQuery
#        elif ruleName == 'Starts':
#            workingOutput = '%s starts with ' % workingOutput
#            workingQuery = "%s LIKE '" % workingQuery
#            end = True
#        elif ruleName == 'Ends':
#            workingOutput = '%s ends with ' % workingOutput
#            workingQuery = "%s LIKE '%%" % workingQuery
#        workingOutput = '%s"' % workingOutput
#        content = ''
#        onByte = True
#        for i in range(self.stringOffset, len(self.criteria)):
#            if onByte:
#                if self.criteria[i] == 0 and i != len(self.criteria) - 1:
#                    self.again = True
#                    self.FinishStringField(content, workingOutput, workingQuery, end)
#                    self.offset = i + 2
#                    return
#                content = '%s%s' % (content, chr(self.criteria[i]))
#            onByte = not onByte
#        self.FinishStringField(content, workingOutput, workingQuery, end)
#        
#
#    def FinishStringField(self, content, workingOutput, workingQuery, end):
#        workingOutput = '%s%s" ' % (workingOutput, content)
#        failed = False
#        workingQuery = '%s%s' % (workingQuery, content.lower())
#        if end:
#            workingQuery = "%s%%')" % workingQuery
#        else:
#            workingQuery = "%s')" % workingQuery
#        if ReverseIgnoreStringFields.has_key(self.criteria[self.offset]) or failed:
#            if len(self.ignore) > 0:
#                self.ignore = '%s%s' % (self.ignore, self.conjunctionOutput)
#            self.ignore = '%s%s' % (self.ignore, workingOutput)
#        else:
#            if len(self.output) > 0:
#                self.output = '%s%s' % (self.output, self.conjunctionOutput)
#            if len(self.query) > 0:
#                self.query = '%s%s' % (self.query, self.conjunctionQuery)
#            self.output = '%s%s' % (self.output, workingOutput)
#            self.query = '%s%s' % (self.query, workingQuery)
