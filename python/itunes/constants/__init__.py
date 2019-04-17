import datetime

MEDIA_TYPE = list(None for x in range(32))
MEDIA_TYPE[0] = 'Music'
MEDIA_TYPE[1] = 'Movie'
MEDIA_TYPE[2] = 'Podcast'
MEDIA_TYPE[3] = 'Audiobook'
MEDIA_TYPE[5] = 'Music Video'
MEDIA_TYPE[6] = 'TV Show'
MEDIA_TYPE[16] = 'iTunes Extras'
MEDIA_TYPE[20] = 'Voice Memo'
MEDIA_TYPE[21] = 'iTunes U'
MEDIA_TYPE[22] = 'Book'
MEDIA_TYPE[23] = 'X-Book'

PLAYLIST_DISTINGUISHED_KIND = list(None for x in range(256))
PLAYLIST_DISTINGUISHED_KIND[2] = "Movies"
PLAYLIST_DISTINGUISHED_KIND[3] = "TV Shows"
PLAYLIST_DISTINGUISHED_KIND[4] = "Music"
PLAYLIST_DISTINGUISHED_KIND[5] = "Audiobooks"
PLAYLIST_DISTINGUISHED_KIND[10] = "Podcasts"
PLAYLIST_DISTINGUISHED_KIND[19] = "Purchased"
PLAYLIST_DISTINGUISHED_KIND[22] = "Party Shuffle"
PLAYLIST_DISTINGUISHED_KIND[26] = "Genius"
PLAYLIST_DISTINGUISHED_KIND[200] = "90's Music"
PLAYLIST_DISTINGUISHED_KIND[201] = "My Top Rated"
PLAYLIST_DISTINGUISHED_KIND[202] = "Top 25 Most Played"
PLAYLIST_DISTINGUISHED_KIND[203] = "Recently Played"
PLAYLIST_DISTINGUISHED_KIND[204] = "Recently Added"
PLAYLIST_DISTINGUISHED_KIND[205] = "Music Videos"

LIMIT_UNIT_TYPE = [None, 'minutes', 'MB', 'items', 'hours', 'GB']

LIMIT_FIELD_TYPE = list(None for x in range(32))
LIMIT_FIELD_TYPE[2] = 'Random'
LIMIT_FIELD_TYPE[5] = 'Name'
LIMIT_FIELD_TYPE[6] = 'Album'
LIMIT_FIELD_TYPE[7] = 'Artist'
LIMIT_FIELD_TYPE[9] = 'Genre'
LIMIT_FIELD_TYPE[21] = 'Date Added'
LIMIT_FIELD_TYPE[25] = 'Play Count'
LIMIT_FIELD_TYPE[26] = 'Play Date UTC'
LIMIT_FIELD_TYPE[28] = 'Rating'
LIMIT_FIELD_TYPE[1] = '-Rating'

RULE_FIELD_TYPE = list('Rule %d' % x for x in range(255))
RULE_FIELD_TYPE[0] = 'Ruleset'
RULE_FIELD_TYPE[2] = 'Name'
RULE_FIELD_TYPE[3] = 'Album'
RULE_FIELD_TYPE[4] = 'Genre'
RULE_FIELD_TYPE[5] = 'Bit Rate'
RULE_FIELD_TYPE[6] = 'Sample Rate'
RULE_FIELD_TYPE[7] = 'Year'
RULE_FIELD_TYPE[8] = 'Genre'
RULE_FIELD_TYPE[9] = 'Kind'
RULE_FIELD_TYPE[10] = 'Date Modified'
RULE_FIELD_TYPE[11] = 'Track Number'
RULE_FIELD_TYPE[12] = 'Size'
RULE_FIELD_TYPE[13] = 'Total Time'
RULE_FIELD_TYPE[14] = 'Comment'
RULE_FIELD_TYPE[16] = 'Date Added'
RULE_FIELD_TYPE[18] = 'Composer'
RULE_FIELD_TYPE[22] = 'Play Count'
RULE_FIELD_TYPE[23] = 'Play Date UTC'
RULE_FIELD_TYPE[24] = 'Disc Number'
RULE_FIELD_TYPE[25] = 'Rating'
RULE_FIELD_TYPE[29] = 'Checked'
RULE_FIELD_TYPE[31] = 'Compilation'
RULE_FIELD_TYPE[35] = 'BPM'
RULE_FIELD_TYPE[37] = 'Album Artwork'
RULE_FIELD_TYPE[39] = 'Grouping'
RULE_FIELD_TYPE[40] = 'Playlist'
RULE_FIELD_TYPE[41] = 'Purchased'
RULE_FIELD_TYPE[54] = 'Description'
RULE_FIELD_TYPE[55] = 'Category'
RULE_FIELD_TYPE[57] = 'Podcast'
RULE_FIELD_TYPE[60] = 'Media Kind'
RULE_FIELD_TYPE[62] = 'Series'
RULE_FIELD_TYPE[63] = 'Season'
RULE_FIELD_TYPE[68] = 'Skip Count'
RULE_FIELD_TYPE[69] = 'Skip Date'
RULE_FIELD_TYPE[71] = 'Album Artist'
RULE_FIELD_TYPE[78] = 'Sort Name'
RULE_FIELD_TYPE[79] = 'Sort Album'
RULE_FIELD_TYPE[80] = 'Sort Artist'
RULE_FIELD_TYPE[81] = 'Sort Album Artist'
RULE_FIELD_TYPE[82] = 'Sort Composer'
RULE_FIELD_TYPE[83] = 'Sort Series'
RULE_FIELD_TYPE[90] = 'Album Rating'

RULESET_FIELDS = set(('Ruleset',))
PERSISTENT_ID_FIELDS = set(('Playlist',))
DATE_FIELDS = set(('Date Added', 'Date Modified', 'Play Date UTC', 'Skip Date'))
BOOLEAN_FIELDS = set(('Album Artwork', 'Checked', 'Compilation', 'Purchased'))
INTEGER_FIELDS = set(('Album Rating', 'Bit Rate', 'BPM', 'Disc Number', 'Playlist', 'Play Count', 'Rating', 'Sample Rate', 'Season', 'Size', 'Skip Count', 'Total Time', 'Track Number', 'Year'))
ENUM_FIELDS = set(('Media Kind', 'Podcast'))
STRING_FIELDS = set(('Album', 'Artist', 'Album Artist', 'Category', 'Comment', 'Composer', 'Description', 'Genre', 'Grouping', 'Kind', 'Name', 'Series', 'Sort Album', 'Sort Album Artist', 'Sort Artist', 'Sort Composer', 'Sort Name', 'Sort Series'))

ENUM_VALUES = {
    'Media Kind': MEDIA_TYPE,
    'Podcast': MEDIA_TYPE,
}

LIMIT_TYPE = [None, 'minutes', 'MB', 'items', 'hours', 'GB'] + list('LIMIT_TYPE_%d' % x for x in range(6, 256))

LIMIT_SORT_TYPE = list('LIMIT_SORT_TYPE_%d' % x for x in range(256))
LIMIT_SORT_TYPE[2] = 'Random'
LIMIT_SORT_TYPE[3] = 'Name'
LIMIT_SORT_TYPE[4] = 'Album'
LIMIT_SORT_TYPE[5] = 'Artist'
LIMIT_SORT_TYPE[7] = 'Genre'
LIMIT_SORT_TYPE[16] = 'Play Date UTC'
LIMIT_SORT_TYPE[20] = 'Play Count'
LIMIT_SORT_TYPE[22] = 'Rating'

INT_OPERATOR_TYPE = list('INT_OP_%d' % x for x in range(256))
INT_OPERATOR_TYPE[0] = '='  #EQUALS
INT_OPERATOR_TYPE[4] = '>'  #GREATERTHAN
INT_OPERATOR_TYPE[5] = '>=' #GREATEREQUAL
INT_OPERATOR_TYPE[6] = '<'  #LESSTHAN
INT_OPERATOR_TYPE[7] = '<=' #LESSEQUAL
INT_OPERATOR_TYPE[8] = '><' #BETWEEN
INT_OPERATOR_TYPE[9] = '-'  #INLAST
INT_OPERATOR_TYPE[10] = '&' #LOGICALAND

STRING_OPERATOR_TYPE = list('STRING_OP_%d' % x for x in range(256))
STRING_OPERATOR_TYPE[0] = '=' #IS
STRING_OPERATOR_TYPE[1] = '~' #CONTAINS
STRING_OPERATOR_TYPE[2] = '^' #STARTSWITH
STRING_OPERATOR_TYPE[3] = '$' #ENDSWITH

OPERATOR_TYPE = list('OP_%d' % x for x in range(256))
OPERATOR_TYPE[0] = '?' # OTHER
OPERATOR_TYPE[1] = '==' # IS
OPERATOR_TYPE[2] = '~' # CONTAINS
OPERATOR_TYPE[4] = '^' # STARTSWITH
OPERATOR_TYPE[8] = '$' # ENDSWITH
OPERATOR_TYPE[16] = '>' # GREATERTHAN
OPERATOR_TYPE[64] = '<' # LESSTHAN

CONJUNCTION_TYPE = ['AND', 'OR'] + list('CONJUNCTION_%d' % x for x in range(2, 256))

LOGIC_TYPE = ['POS', 'POS', 'NEG', 'NEG'] + list('LOGIC_%d' % x for x in range(4, 256))

COMPARE_TYPE = ['STRING', 'RANGE', 'NUMERIC', 'ENUM'] + list('COMPARE_%d' % x for x in range(4, 256))


SMART_INFO_PACKING_FORMAT = '>BBBBIIBB98s'
SMART_RULESET_HEADER_FORMAT = '>4sIII120s'
SMART_RULE_HEADER_FORMAT = '>IBBBBB45sH'
SMART_INTEGER_PACKING_FORMAT = '>Q4iQ4i5i'
SMART_DATE_LOOKBACK_CODE = 0x2dae2dae2dae2dae

def make_reverse_map(orig):
    if type(orig) == list:
        return dict( (orig[i], i) for i in range(len(orig)) if orig[i] is not None )
    elif type(orig) == dict:
        return dict( (v, k) for k, v in orig.iteritems() )
    else:
        return orig


REVERSE_MEDIA_TYPE           = make_reverse_map(MEDIA_TYPE)
REVERSE_LIMIT_UNIT_TYPE      = make_reverse_map(LIMIT_UNIT_TYPE)
REVERSE_LIMIT_FIELD_TYPE     = make_reverse_map(LIMIT_FIELD_TYPE)
REVERSE_RULE_FIELD_TYPE      = make_reverse_map(RULE_FIELD_TYPE)
REVERSE_LIMIT_TYPE           = make_reverse_map(LIMIT_TYPE)
REVERSE_LIMIT_SORT_TYPE      = make_reverse_map(LIMIT_SORT_TYPE)
REVERSE_INT_OPERATOR_TYPE    = make_reverse_map(INT_OPERATOR_TYPE)
REVERSE_STRING_OPERATOR_TYPE = make_reverse_map(STRING_OPERATOR_TYPE)
REVERSE_CONJUNCTION_TYPE     = make_reverse_map(CONJUNCTION_TYPE)
REVERSE_LOGIC_TYPE           = make_reverse_map(LOGIC_TYPE)
REVERSE_COMPARE_TYPE         = make_reverse_map(COMPARE_TYPE)

START_OF_TIME = datetime.datetime(1904, 1, 1)
