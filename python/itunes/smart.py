import base64, datetime, struct, libxml2
from itunes.constants import *

OPERATOR_IDS = {
    0: 'EQUALS',
    1: 'STREQUALS',
    2: 'CONTAINS',
    4: 'STARTSWITH',
    8: 'ENDSWITH',
    16: 'GREATERTHAN',
    32: 'UNDEF',
    64: 'LESSTHAN',
}

class SmartPlaylist:
    def __init__(self, info, criteria):
        self.info = info
        self.criteria = criteria

    def export(self):
        info = base64.b64encode(self.info.export())
        crit = base64.b64encode(self.criteria.export())
        info = re.sub('(.{,72})', '\n\t\t\t\\1', info)
        crit = re.sub('(.{,72})', '\n\t\t\t\\1', crit)
        return info, crit

    def as_dict(self):
        return {
            'info': self.info.as_dict(),
            'criteria': self.criteria.as_dict(),
        }

    def as_xml(self):
        doc = libxml2.newDoc('1.0')
        root = doc.newChild(None, 'SmartPlaylist', None)
        self.info.as_xml(root)
        self.criteria.as_xml(root)
        xml = root.serialize(format=1)
        doc.freeDoc()
        return xml

    def select_tracks(self, library):
        q = Q(library=library) & self.criteria.queryset()
        if self.info.limit_checked:
            q = q & (Q(disabled=False) | Q(disabled__isnull=True))
        qs = Track.objects.filter(q)
        if self.info.has_limit:
            qs = qs.order_by(self.info.order_by())
        unit = self.info.limit_unit()
        size = self.info.limit_size
        if unit == 'items':
            for tr in qs[:size]:
                yield tr
        elif unit in ('minutes', 'hours'):
            if unit == 'minutes':
                size = size * 60 * 1000
            elif unit == 'hours':
                size = size * 3600 * 1000
            for tr in qs:
                size -= tr.total_time
                if size < 0:
                    break
                yield tr
        elif unit in ('MB', 'GB'):
            if unit == 'MB':
                size = size * 1024 * 1024
            elif unit == 'GB':
                size = size * 1024 * 1024 * 1024
            for tr in qs:
                size -= tr.size
                if size < 0:
                    break
                yield tr

class SmartPlaylistInfo:
    def __init__(self, live_updating, has_limit, limit_unit_id, limit_field_id, limit_size, limit_checked, limit_order):
        self.live_updating = bool(live_updating)
        self.has_limit = bool(has_limit)
        self.limit_unit_id = limit_unit_id
        self.limit_field_id = limit_field_id
        self.limit_size = limit_size
        self.limit_checked = bool(limit_checked)
        self.descending = bool(limit_order)

    def limit_unit(self):
        return LIMIT_TYPE[self.limit_unit_id]

    def limit_field(self):
        return LIMIT_SORT_TYPE[self.limit_field_id]

    def export(self):
        return struct.pack('>BBBBIIBB98s', int(self.live_updating), 1, int(self.has_limit), self.limit_unit_id, self.limit_field_id, self.limit_size, int(self.limit_checked), int(self.descending), '')

    def as_dict(self):
        d = {
            'has_limit': self.has_limit,
            'checked_only': self.limit_checked,
            'live_updating': self.live_updating,
        }
        if self.has_limit:
            d['size'] = self.limit_size
            d['units'] = self.limit_unit()
            d['sort_field'] = self.limit_field()
            d['descending'] = self.descending
        return d

    def as_xml(self, parent=None):
        if parent is None:
            parent = libxml2.newDoc('1.0')
        node = parent.newChild(None, 'Info', None)
        node.newChild(None, 'key', 'Has Limit')
        node.newChild(None, ('%s' % self.has_limit).lower(), None)
        if self.has_limit:
            node.newChild(None, 'key', 'Size')
            node.newChild(None, 'integer', '%d' % self.limit_size)
            node.newChild(None, 'key', 'Units')
            node.newChild(None, 'string', self.limit_unit())
            node.newChild(None, 'key', 'Sort Field')
            node.newChild(None, 'string', self.limit_field())
            node.newChild(None, 'key', 'descending')
            node.newChild(None, ('%s' % self.descending).lower(), None)
        node.newChild(None, 'key', 'Checked Only')
        node.newChild(None, ('%s' % self.limit_checked).lower(), None)
        node.newChild(None, 'key', 'Live Updating')
        node.newChild(None, ('%s' % self.live_updating).lower(), None)
        return node

    def order_by(self):
        fn = self.limit_field().lower().replace(' ', '_')
        if fn == 'random':
            return '?'
        elif self.descending:
            return '-%s' % fn
        else:
            return fn

class SmartPlaylistRuleset:
    nested = 1
    field_id = 0
    logic_id = 0
    operator_id = 1
    compare_id = 0
    ruletype = 'SmartPlaylistRuleset'
    def __init__(self, conjunction_id):
        self.conjunction_id = conjunction_id
        self.rules = list()

    def conjunction(self):
        return CONJUNCTION_TYPE[self.conjunction_id]

    def add_rule(self, rule):
        self.rules.append(rule)

    def __str__(self):
        return 'SmartPlaylistRuleset(conjuction=%s; rules=%s)' % (self.conjunction, self.rules)

    def __repr__(self):
        return self.__str__()

    def queryset(self):
        qs = list(x.queryset() for x in self.rules())
        q = qs.pop(0)
        if self.conjunction() == 'OR':
            for sq in qs:
                q = q | sq
        else:
            for sq in qs:
                q = q & sq
        return q

    def export(self, nested=True):

        header = struct.pack('>4sHHII120s', 'SLst', 1, 1, len(self.rules), self.conjunction_id, '')
        data = ''.join(x.export() for x in self.rules)
        xdata = '%s%s' % (header, data)
        if nested:
            return struct.pack('>IBBBBB45sH%ds' % len(xdata), self.field_id, self.logic_id, 0, self.compare_id, self.operator_id, self.nested, '', len(xdata), xdata)
        return '%s%s' % (header, data)

    def b64(self):
        return base64.b64encode(self.export())

    def pack_data(self):
        return self.export()

    def field(self):
        return 'Ruleset'

    def logic(self):
        return 'N/A'

    def compare_type(self):
        return 'N/A'

    def operator(self):
        return 'N/A'

    def as_dict(self):
        return {
            'conjunction': self.conjunction(),
            'rules': list(rule.as_dict() for rule in self.rules),
        }

    def as_xml(self, parent=None):
        if parent is None:
            parent = libxml2.newDoc('1.0')
        node = parent.newChild(None, 'Ruleset', None)
        node.newProp('conjunction', self.conjunction())
        for rule in self.rules:
            rnode = rule.as_xml(node)
        return node

class SmartPlaylistRule:
    nested = 0
    ruletype = 'SmartPlaylistRule'
    def __init__(self, field_id, logic_id, compare_id, operator_id, data):
        self.field_id = field_id
        self.logic_id = logic_id
        self.operator_id = operator_id
        self.compare_id = compare_id
        self.value = self.unpack_data(data)

    def __str__(self):
        return '%s(field=%s; logic=%s; operator=%s; value=%s)' % (self.ruletype, self.field(), self.logic(), self.operator(), self.value)

    def __repr__(self):
        return self.__str__()

    def unpack_data(self, data):
        return data

    def pack_data(self):
        return self.value

    def export(self):
        data = self.pack_data()
        return struct.pack('>IBBBBB45sH%ds' % len(data), self.field_id, self.logic_id, 0, self.compare_id, self.operator_id, self.nested, '', len(data), data)

    def field(self):
        return RULE_FIELD_TYPE[self.field_id]

    def logic(self):
        return LOGIC_TYPE[self.logic_id]

    def compare_type(self):
        return COMPARE_TYPE[self.compare_id]

    def operator(self):
        return OPERATOR_IDS[self.operator_id]

    def as_dict(self):
        return {
            'type': self.ruletype,
            'field_id': self.field_id,
            'field': self.field(),
            'logic_id': self.logic_id,
            'logic': self.logic(),
            'compare_id': self.compare_id,
            'compare': self.compare_type(),
            'operator_id': self.operator_id,
            'operator': self.operator(),
            'data': self.pack_data(),
        }

    def as_xml(self, parent):
        node = parent.newChild(None, 'Rule', None)
        node.newProp('type', self.ruletype)
        node.newProp('field', self.field())
        node.newProp('logic', self.logic())
        node.newProp('compare', self.compare_type())
        node.newProp('operator', self.operator())
        self.xml_data(node)
        return node

    def xml_data(self, parent):
        data = base64.b64encode(self.value)
        return parent.newChild(None, 'data', data)

class SmartPlaylistGenericRule(SmartPlaylistRule):
    ruletype = 'SmartPlaylistGenericRule'

class SmartPlaylistStringRule(SmartPlaylistRule):
    ruletype = 'SmartPlaylistStringRule'
    def unpack_data(self, data):
        return data.decode('UTF-16BE')

    def pack_data(self):
        return self.value.encode('UTF-16BE')

    def operator(self):
        return OPERATOR_TYPE[self.operator_id]

    def xml_data(self, parent):
        return parent.newChild(None, 'string', '%s' % self.value.encode('UTF-8'))

    def queryset(self):
        fn = self.field().lower().replace(' ', '_')
        op = self.operator()
        args = dict()
        if op in ('EQUALS', 'STREQUALS'):
            args[fn] = self.value
        elif op == 'CONTAINS':
            args['%s__icontains' % fn] = self.value
        elif op == 'STARTSWITH':
            args['%s__startswith' % fn] = self.value
        elif op == 'ENDSWITH':
            args['%s__endswith' % fn] = self.value
        else:
            args[fn] = self.value
        if self.logic_id in (0, 1):
            return Q(**args)
        else:
            return ~Q(**args)

class SmartPlaylistIntegerRule(SmartPlaylistRule):
    ruletype = 'SmartPlaylistIntegerRule'
    def unpack_data(self, data):
        return struct.unpack('>Q4iQ9i', data)

    def pack_data(self):
        values = self.value
        return struct.pack('>Q4iQ9i', *values)

    def persistent_id(self):
        return '%016X' % self.value[0]

    def set_persistent_id(self, val):
        self.value[0] = int(val, 16)
        self.value[4] = int(val, 16)

    def xml_data(self, parent):
        #return list(parent.newChild(None, 'integer', '%d' % x) for x in self.value)
        if self.compare_type() == 'RANGE':
            min = parent.newChild(None, 'min', '%d' % self.value[0])
            max = parent.newChild(None, 'max', '%d' % self.value[5])
            return (min, max)
        if self.field() == 'Playlist':
            return parent.newChild(None, 'string', self.persistent_id())
        return parent.newChild(None, 'integer', '%d' % self.value[0])
        #return list(parent.newChild(None, 'integer', '%d' % x) for x in (self.value[1], self.value[7]))

    def queryset(self):
        fn = self.field().lower().replace(' ', '_')
        op = self.operator()
        args = dict()
        q = None
        if fn == 'playlist':
            q = Q(item__playlist__playlist_persistent_id=self.persistent_id())
        elif self.compare_type() == 'RANGE':
            args['%s__gte' % fn] = self.value[0]
            q = Q(**args)
            args = dict()
            args['%s__lte' % fn] = self.value[5]
            q = q & Q(**args)
            args = dict()
        else:
            if op in ('EQUALS', 'STREQUALS'):
                args[fn] = self.value[0]
            elif op == 'GREATERTHAN':
                args['%s__gt' % fn] = self.value[0]
            elif op == 'LESSTHAN':
                args['%s__lt' % fn] = self.value[0]
            else:
                args[fn] = self.value[0]
            q = Q(**args)
        if self.logic_id in (0, 1):
            return q
        else:
            return ~q

class SmartPlaylistBooleanRule(SmartPlaylistIntegerRule):
    ruletype = 'SmartPlaylistBooleanRule'

    def xml_data(self, parent):
        return parent.newChild(None, 'true', None)

    def queryset(self):
        fn = self.field().lower().replace(' ', '_')
        if fn == 'checked':
            return Q(disabled=False) | Q(disabled__isnull=True)
        if self.logic_id in (0,1):
            args = { fn: True }
            return Q(**args)
        else:
            args = { fn: False }
            q = Q(**args)
            args = { '%s__isnull' % fn: True }
            return q | Q(**args)

class SmartPlaylistEnumRule(SmartPlaylistIntegerRule):
    ruletype = 'SmartPlaylistEnumRule'
    TYPE_BITS = ['Music',         'Movie',       'Podcast', 'Audiobook',
                 'UNKNOWN',       'Music Video', 'TV Show', 'UNKNOWN',
                 'UNKNOWN',       'UNKNOWN',     'UNKNOWN', 'UNKNOWN',
                 'UNKNOWN',       'UNKNOWN',     'UNKNOWN', 'UNKNOWN',
                 'iTunes Extras', 'UNKNOWN',     'UNKNOWN', 'UNKNOWN',
                 'Voice Memo',    'iTunes U',    'Book',    'Book',
                 'UNKNOWN',       'UNKNOWN',     'UNKNOWN', 'UNKNOWN',
                 'UNKNOWN',       'UNKNOWN',     'UNKNOWN', 'UNKNOWN']

    def enum(self):
        for i in range(32):
            if self.value[0] & (2**i):
                return self.TYPE_BITS[i]
        return 'N/A'

    def xml_data(self, parent):
        node = parent.newChild(None, 'enum', self.enum())
        node.newProp('id', '%d' % self.value[0])
        return node

    def queryset(self):
        fn = self.enum().lower().replace(' ', '_')
        args[fn] = True
        if self.logic_id in (0,1):
            return Q(**args)
        else:
            return ~Q(**args)

START_OF_TIME = datetime.datetime(1904, 1, 1)
class SmartPlaylistDateRule(SmartPlaylistIntegerRule):
    ruletype = 'SmartPlaylistDateRule'
    UNITS = { 1: 'seconds', 60: 'minuts', 3600: 'hours', 86400: 'days', 604800: 'weeks', 2628000: 'months' }
    REVERSE_UNITS = dict( (v, k) for k, v in UNITS.items() )

    def count(self):
        return self.value[2]

    def multiplier(self):
        return self.value[4]

    def start_date(self):
        return START_OF_TIME + datetime.timedelta(0, self.value[0])

    def end_date(self):
        return START_OF_TIME + datetime.timedelta(0, self.value[5])

    def unit(self):
        return self.UNITS.get(self.multiplier(), 'N/A')

    def set_count(self, val):
        self.value[2] = val

    def set_multiplier(self, val):
        self.value[4] = val

    def set_unit(self, val):
        self.set_multiplier(self.REVERSE_UNITS.get(val, 0))

    def set_start_date(self, when):
        td = when - START_OF_TIME
        self.value[0] = td.days*86400 + td.seconds

    def set_end_date(self, when):
        td = when - START_OF_TIME
        self.value[5] = td.days*86400 + td.seconds

    def xml_data(self, parent):
        if self.compare_type() == 'NUMERIC':
            return parent.newChild(None, self.unit(), '%d' % self.count())
        return list(parent.newChild(None, 'date', x.strftime('%Y-%m-%dT%H:%M:%SZ')) for x in (self.start_date(), self.end_date()))

    def queryset(self):
        fn = self.field().lower().replace(' ', '_')
        if self.compare_type() == 'NUMERIC':
            now = datetime.datetime.now()
            when = now + datetime.timedelta(0, self.count() * self.multiplier())
            op = self.operator()
            if op == 'GREATERTHAN':
                args = { '%s__gt' % fn: when }
            elif op == 'LESSTHAN':
                args = { '%s__lt' % fn: when }
            else:
                args = { fn: when }
            q = Q(**args)
        else:
            args = { '%s__gte' % fn: self.start_date() }
            q = Q(**args)
            args = { '%s__lte' % fn: self.end_date() }
            q = q & Q(**args)
        if self.logic_id in (0,1):
            return q
        else:
            return ~q

class SmartPlaylistParser:
    def __init__(self, info, criteria):
        self.info = SmartPlaylistInfoParser(base64.b64decode(info))
        self.criteria = SmartPlaylistRuleParser(base64.b64decode(criteria))

    def parse(self):
        return SmartPlaylist(self.info.parse(), self.criteria.parse())

class SmartPlaylistDataParser:

    def __init__(self, data):
        self.data = data
        self.index = 0

    def skip(self, size):
        self.index += size

    def readstring(self, size):
        i = self.index
        j = i+size
        if j > len(self.data):
            j = len(self.data)
        self.index = j
        return self.data[i:j]

    def readchar(self):
        i = self.index
        j = i+1
        self.index = j
        return self.data[i]

    def readbyte(self, signed=False):
        i = self.index
        j = i+1
        self.index = j
        if signed:
            fmt = 'b'
        else:
            fmt = 'B'
        vals = struct.unpack(fmt, self.data[i])
        #print 'byte(%d:%d) = %s' % (i, j, vals[0])
        return vals[0]
        #print 'byte(%d:%d) = %s' % (i, j, ord(self.data[i]))
        #return ord(self.data[i])

## @   native  native  native
## =   native  standard    none
## <   little-endian   standard    none
## >   big-endian  standard    none
## !   network (= big-endian)  standard    none
## 
## x   pad byte no value         
## c   char    string of length 1  1    
## b   signed char integer 1   (3)
## B   unsigned char   integer 1   (3)
## ?   _Bool   bool    1   (1)
## h   short   integer 2   (3)
## H   unsigned short  integer 2   (3)
## i   int integer 4   (3)
## I   unsigned int    integer 4   (3)
## l   long    integer 4   (3)
## L   unsigned long   integer 4   (3)
## q   long long   integer 8   (2), (3)
## Q   unsigned long long  integer 8   (2), (3)
## f   float   float   4   (4)
## d   double  float   8   (4)
## s   char[]  string       
## p   char[]  string       
## P   void *  integer     (5), (3)
    def readshort(self, signed=False, be=True):
        i = self.index
        j = i+2
        self.index = j
        if be:
            endian='>'
        else:
            endian='<'
        if signed:
            fmt = '%sh' % endian
        else:
            fmt = '%sH' % endian
        vals = struct.unpack(fmt, self.data[i:j])
        #print 'short (%d:%d ~ %02x %02x) = %s (%s)' % (i, j, ord(self.data[i]), ord(self.data[i+1]), vals[0], fmt)
        return vals[0]

    def readlong(self, signed=False, be=True):
        i = self.index
        j = i+4
        self.index = j
        if be:
            endian='>'
        else:
            endian='<'
        if signed:
            fmt = '%sl' % endian
        else:
            fmt = '%sL' % endian
        vals = struct.unpack(fmt, self.data[i:j])
        #print 'long(%d:%d) = %s' % (i, j, vals[0])
        return vals[0]

class SmartPlaylistInfoParser(SmartPlaylistDataParser):

## offset  field  size  type  value
## 0       live updating  1  byte  0=false, 1=true
## 1       unknown        1  byte  1
## 2       has limit      1  byte  0=false, 1=true
## 3       limit type     1  byte  1=minutes, 2=MB, 3=items, 4=hours, 5=GB
## 4       limit sort     4  long  0x02=random, 0x15=add date, 0x06=album, 0x07=artist, 0x09=genre, 0x05=name, 0x19=play count, 0x1a=play date, 0x1c=rating
## 8       limit size     4  long
## 12      limit checked  1  byte  0=false, 1=true
## 13      limit order    1  byte  0=ascending, 1=descending
## 14      padding        98 string  null

    def parse(self):
        live_updating = self.readbyte()
        self.skip(1)
        has_limit = self.readbyte()
        limit_unit_id = self.readbyte()
        limit_field_id = self.readlong()
        limit_size = self.readlong()
        limit_checked = self.readbyte()
        limit_order = self.readbyte()
        return SmartPlaylistInfo(live_updating, has_limit, limit_unit_id, limit_field_id, limit_size, limit_checked, limit_order)

class SmartPlaylistRuleParser(SmartPlaylistDataParser):

    def parse(self):
        marker = self.readstring(4)
        self.skip(4)
        rule_count = self.readlong()
        conjunction_id = self.readlong()
        ruleset = SmartPlaylistRuleset(conjunction_id)
        self.skip(120)
        for i in range(rule_count):
            field_id = self.readlong()
            logic_id = self.readbyte()
            self.skip(1)
            compare_id = self.readbyte()
            operator_id = self.readbyte()
            nested = self.readbyte()
            self.skip(45)
            length = self.readshort()
            data = self.readstring(length)
            field = RULE_FIELD_TYPE[field_id]
            if field in RULESET_FIELDS:
                rule = SmartPlaylistRuleParser(data).parse()
            elif field in DATE_FIELDS:
                rule = SmartPlaylistDateRule(field_id, logic_id, compare_id, operator_id, data)
            elif field in BOOLEAN_FIELDS:
                rule = SmartPlaylistBooleanRule(field_id, logic_id, compare_id, operator_id, data)
            elif field in INTEGER_FIELDS:
                rule = SmartPlaylistIntegerRule(field_id, logic_id, compare_id, operator_id, data)
            elif field in ENUM_FIELDS:
                rule = SmartPlaylistEnumRule(field_id, logic_id, compare_id, operator_id, data)
            elif field in STRING_FIELDS:
                rule = SmartPlaylistStringRule(field_id, logic_id, compare_id, operator_id, data)
            else:
                print 'unhandled field: %s (%d)' % (field, field_id)
                rule = SmartPlaylistGenericRule(field_id, logic_id, compare_id, operator_id, data)
            #rule = SmartPlaylistRule(field, logic, compare_type, operator, nested, length, data)
            ruleset.add_rule(rule)
        return ruleset
#offset     field    size   type   value
#0          rule marker   4  string  'SLst'
#4          unknown       2  le-short  1
#6          unknown       2  le-short  1
#8          rule count    4  le-long
#12         conjunction   4  le-int    0=AND, 1=OR
#16         padding       120 string   null
#136        field id      4  le-long   0x03=Album, 0x10=Date Added, 0x5a=Album Rating, 0x04=Artist, 0x25=Album Artwork, 0x05=Bit Rate, 0x23=BPM, 0x37=Category, 0x1d=Checked, 0x0e=Comments, 0x1f=Compilation, 0x12=Composer, 0x36=Description, 0x18=Disc Number, 0x08=Genre, 0x27=Grouping, 0x09=Kind, 0x17=Last Played, 0x45=Last Skipped, 0x3c=Media Kind, 0x0a=Date Modified, 0x02=Name, 0x00=Nested, 0x28=Playlist, 0x16=Plays, 0x29=Purchased, 0x19=Rating, 0x06=Sample Rate, 0x3f=Season, 0x3e=Show, 0x0c=Size, 0x44=Skips, 0x4f=Sort Album, 0x51=Sort Album Artist, 0x50=Sort Artist, 0x52=Sort Composer, 0x4e=SortName, 0x53=SortShow, 0x0d=Time, 0x0b=Track Number, 0x07=Year
#140      logic operator    1 byte  1=contains/is, 3=does not contain/is not, 0=is, 2=is not, 
#141      unknown          1 byte 0
#142      compare type          1 byte 0=string, 1=date, 2=int, 4=enum
#143      operator          1 byte  0=equals?, 1=equals, 2=contains, 4=starts with, 8=ends with, 16=after, 32=??, 64=before
#144       nested          1 byte 0=no, 1=yes
#145       padding         45 string null
#190       length          2 le-short
#192       data            length

