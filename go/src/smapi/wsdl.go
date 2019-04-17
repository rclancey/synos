package smapi

import (
	"encoding/xml"
	"github.com/hooklift/gowsdl/soap"
	"time"
)

// against "unused imports"
var _ time.Time
var _ xml.Name

type PrivateDataType string

type SonosUri string

type Id string

type Algorithm string

const (
	AlgorithmAESCBCPKCS7 Algorithm = "AES/CBC/PKCS#7"
)

type UserAccountType string

const (
	UserAccountTypePremium UserAccountType = "premium"

	UserAccountTypeTrial UserAccountType = "trial"

	UserAccountTypeFree UserAccountType = "free"
)

type UserAccountStatus string

const (
	UserAccountStatusActive UserAccountStatus = "active"

	UserAccountStatusRestricted UserAccountStatus = "restricted"

	UserAccountStatusExpired UserAccountStatus = "expired"
)

type ItemType string

const (
	ItemTypeArtist ItemType = "artist"

	ItemTypeAlbum ItemType = "album"

	ItemTypeGenre ItemType = "genre"

	ItemTypePlaylist ItemType = "playlist"

	ItemTypeTrack ItemType = "track"

	ItemTypeSearch ItemType = "search"

	ItemTypeStream ItemType = "stream"

	ItemTypeShow ItemType = "show"

	ItemTypeProgram ItemType = "program"

	ItemTypeFavorites ItemType = "favorites"

	ItemTypeFavorite ItemType = "favorite"

	ItemTypeCollection ItemType = "collection"

	ItemTypeContainer ItemType = "container"

	ItemTypeAlbumList ItemType = "albumList"

	ItemTypeTrackList ItemType = "trackList"

	ItemTypeStreamList ItemType = "streamList"

	ItemTypeArtistTrackList ItemType = "artistTrackList"

	ItemTypeAudiobook ItemType = "audiobook"

	ItemTypeOther ItemType = "other"
)

// It is a token that is specific to a device to allow that device to stream.
// If a deviceSessionToken was returned in a previous call, this is provided here.  There may be
// some tracks that do not include one in the mediaUriResponse; this will not cause Sonos to
// remove the previous deviceSessionToken. Sonos will send this element until a new one is returned, always.
// This element can be used to avoid having to re-validate the cert by encoding that information.
// It can provide a lower cost short cut for encoding session keys.
//
type DeviceSessionToken string

type EncryptionType string

const (
	EncryptionTypeNONE EncryptionType = "NONE"

	EncryptionTypeAESECB EncryptionType = "AES-ECB"

	EncryptionTypeAESCBC EncryptionType = "AES-CBC"
)

type MediaUriAction string

const (
	MediaUriActionIMPLICIT MediaUriAction = "IMPLICIT"

	MediaUriActionEXPLICITPLAY MediaUriAction = "EXPLICIT:PLAY"

	MediaUriActionEXPLICITSEEK MediaUriAction = "EXPLICIT:SEEK"

	MediaUriActionEXPLICITSKIP_FORWARD MediaUriAction = "EXPLICIT:SKIP_FORWARD"

	MediaUriActionEXPLICITSKIP_BACK MediaUriAction = "EXPLICIT:SKIP_BACK"
)

type ActionType string

const (
	ActionTypeOpenUrl ActionType = "openUrl"

	ActionTypeSimpleHttpRequest ActionType = "simpleHttpRequest"

	ActionTypeRateItem ActionType = "rateItem"
)

type Login struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 login"`

	Username *Username `xml:"username,omitempty"`

	Password *Password `xml:"password,omitempty"`
}

type LoginToken struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 loginToken"`

	Token string `xml:"token,omitempty"`

	Key string `xml:"key,omitempty"`

	HouseholdId string `xml:"householdId,omitempty"`
}

type Credentials struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 credentials"`

	ZonePlayerId *Id `xml:"zonePlayerId,omitempty"`

	DeviceId *Id `xml:"deviceId,omitempty"`

	DeviceProvider string `xml:"deviceProvider,omitempty"`

	DeviceCert string `xml:"deviceCert,omitempty"`

	SessionId *SessionId `xml:"sessionId,omitempty"`

	Login *Login `xml:"login,omitempty"`

	LoginToken *LoginToken `xml:"loginToken,omitempty"`
}

type Context struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 context"`

	TimeZone string `xml:"timeZone,omitempty"`
}

type GetSessionId struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getSessionId"`

	Username *Username `xml:"username,omitempty"`

	Password *Password `xml:"password,omitempty"`
}

type GetSessionIdResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getSessionIdResponse"`

	GetSessionIdResult *Id `xml:"getSessionIdResult,omitempty"`
}

type GetMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getMetadata"`

	Id *Id `xml:"id,omitempty"`

	Index int32 `xml:"index,omitempty"`

	Count int32 `xml:"count,omitempty"`

	Recursive bool `xml:"recursive,omitempty"`
}

type GetMetadataResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getMetadataResponse"`

	GetMetadataResult *MediaList `xml:"getMetadataResult,omitempty"`
}

type GetExtendedMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getExtendedMetadata"`

	Id *Id `xml:"id,omitempty"`
}

type GetExtendedMetadataResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getExtendedMetadataResponse"`

	GetExtendedMetadataResult *ExtendedMetadata `xml:"getExtendedMetadataResult,omitempty"`
}

type GetExtendedMetadataText struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getExtendedMetadataText"`

	Id *Id `xml:"id,omitempty"`

	Type_ string `xml:"type,omitempty"`
}

type GetExtendedMetadataTextResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getExtendedMetadataTextResponse"`

	GetExtendedMetadataTextResult string `xml:"getExtendedMetadataTextResult,omitempty"`
}

type GetUserInfo struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getUserInfo"`
}

type GetUserInfoResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getUserInfoResponse"`

	GetUserInfoResult *UserInfo `xml:"getUserInfoResult,omitempty"`
}

type RateItem struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 rateItem"`

	Id *Id `xml:"id,omitempty"`

	Rating int32 `xml:"rating,omitempty"`
}

type RateItemResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 rateItemResponse"`

	RateItemResult *ItemRating `xml:"rateItemResult,omitempty"`
}

type Search struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 search"`

	Id *Id `xml:"id,omitempty"`

	Term string `xml:"term,omitempty"`

	Index int32 `xml:"index,omitempty"`

	Count int32 `xml:"count,omitempty"`
}

type SearchResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 searchResponse"`

	SearchResult *MediaList `xml:"searchResult,omitempty"`
}

type GetMediaMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getMediaMetadata"`

	Id *Id `xml:"id,omitempty"`
}

type GetMediaMetadataResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getMediaMetadataResponse"`

	GetMediaMetadataResult *MediaMetadata `xml:"getMediaMetadataResult,omitempty"`
}

type GetMediaURI struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getMediaURI"`

	Id *Id `xml:"id,omitempty"`

	Action *MediaUriAction `xml:"action,omitempty"`

	SecondsSinceExplicit int32 `xml:"secondsSinceExplicit,omitempty"`

	DeviceSessionToken *DeviceSessionToken `xml:"deviceSessionToken,omitempty"`
}

type GetMediaURIResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getMediaURIResponse"`

	GetMediaURIResult *AnyURI `xml:"getMediaURIResult,omitempty"`

	DeviceSessionToken *DeviceSessionToken `xml:"deviceSessionToken,omitempty"`

	DeviceSessionKey *EncryptionContext `xml:"deviceSessionKey,omitempty"`

	ContentKey *EncryptionContext `xml:"contentKey,omitempty"`

	HttpHeaders *HttpHeaders `xml:"httpHeaders,omitempty"`

	UriTimeout int32 `xml:"uriTimeout,omitempty"`

	PositionInformation *PositionInformation `xml:"positionInformation,omitempty"`

	PrivateDataFieldName string `xml:"privateDataFieldName,omitempty"`
}

type CreateItem struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 createItem"`

	Favorite *Id `xml:"favorite,omitempty"`
}

type CreateItemResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 createItemResponse"`

	CreateItemResult *Id `xml:"createItemResult,omitempty"`
}

type DeleteItem struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deleteItem"`

	Favorite *Id `xml:"favorite,omitempty"`
}

type DeleteItemResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deleteItemResponse"`
}

type GetScrollIndices struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getScrollIndices"`

	Id *Id `xml:"id,omitempty"`
}

type GetScrollIndicesResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getScrollIndicesResponse"`

	GetScrollIndicesResult string `xml:"getScrollIndicesResult,omitempty"`
}

type GetLastUpdate struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getLastUpdate"`
}

type GetLastUpdateResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getLastUpdateResponse"`

	GetLastUpdateResult *LastUpdate `xml:"getLastUpdateResult,omitempty"`
}

type ReportStatus struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportStatus"`

	Id *Id `xml:"id,omitempty"`

	ErrorCode int32 `xml:"errorCode,omitempty"`

	Message string `xml:"message,omitempty"`
}

type ReportStatusResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportStatusResponse"`
}

type SetPlayedSeconds struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 setPlayedSeconds"`

	Id *Id `xml:"id,omitempty"`

	Seconds int32 `xml:"seconds,omitempty"`

	ContextId string `xml:"contextId,omitempty"`

	PrivateData *PrivateDataType `xml:"privateData,omitempty"`

	OffsetMillis int32 `xml:"offsetMillis,omitempty"`
}

type SetPlayedSecondsResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 setPlayedSecondsResponse"`
}

type ReportPlaySeconds struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportPlaySeconds"`

	Id *Id `xml:"id,omitempty"`

	Seconds int32 `xml:"seconds,omitempty"`

	ContextId string `xml:"contextId,omitempty"`

	PrivateData *PrivateDataType `xml:"privateData,omitempty"`

	OffsetMillis int32 `xml:"offsetMillis,omitempty"`
}

type ReportPlaySecondsResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportPlaySecondsResponse"`

	ReportPlaySecondsResult *ReportPlaySecondsResult `xml:"reportPlaySecondsResult,omitempty"`
}

type ReportPlayStatus struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportPlayStatus"`

	Id *Id `xml:"id,omitempty"`

	Status string `xml:"status,omitempty"`

	ContextId string `xml:"contextId,omitempty"`

	OffsetMillis int32 `xml:"offsetMillis,omitempty"`
}

type ReportPlayStatusResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportPlayStatusResponse"`
}

type ReportAccountAction struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportAccountAction"`

	Type_ string `xml:"type,omitempty"`
}

type ReportAccountActionResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportAccountActionResponse"`
}

type GetAppLink struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getAppLink"`

	HouseholdId *Id `xml:"householdId,omitempty"`

	Hardware string `xml:"hardware,omitempty"`

	OsVersion string `xml:"osVersion,omitempty"`

	SonosAppName string `xml:"sonosAppName,omitempty"`

	CallbackPath string `xml:"callbackPath,omitempty"`
}

type GetAppLinkResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getAppLinkResponse"`

	GetAppLinkResult *AppLinkResult `xml:"getAppLinkResult,omitempty"`
}

type GetDeviceLinkCode struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getDeviceLinkCode"`

	HouseholdId *Id `xml:"householdId,omitempty"`
}

type GetDeviceLinkCodeResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getDeviceLinkCodeResponse"`

	GetDeviceLinkCodeResult *DeviceLinkCodeResult `xml:"getDeviceLinkCodeResult,omitempty"`
}

type GetDeviceAuthToken struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getDeviceAuthToken"`

	HouseholdId *Id `xml:"householdId,omitempty"`

	LinkCode string `xml:"linkCode,omitempty"`

	LinkDeviceId string `xml:"linkDeviceId,omitempty"`

	CallbackPath string `xml:"callbackPath,omitempty"`
}

type GetDeviceAuthTokenResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getDeviceAuthTokenResponse"`

	GetDeviceAuthTokenResult *DeviceAuthTokenResult `xml:"getDeviceAuthTokenResult,omitempty"`
}

type RefreshAuthToken struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 refreshAuthToken"`
}

type RefreshAuthTokenResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 refreshAuthTokenResponse"`

	RefreshAuthTokenResult *DeviceAuthTokenResult `xml:"refreshAuthTokenResult,omitempty"`
}

type GetStreamingMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getStreamingMetadata"`

	Id *Id `xml:"id,omitempty"`

	StartTime time.Time `xml:"startTime,omitempty"`

	Duration int32 `xml:"duration,omitempty"`
}

type GetStreamingMetadataResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getStreamingMetadataResponse"`

	GetStreamingMetadataResult *SegmentMetadataList `xml:"getStreamingMetadataResult,omitempty"`
}

type GetContentKey struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getContentKey"`

	Id *Id `xml:"id,omitempty"`

	Uri *AnyURI `xml:"uri,omitempty"`

	DeviceSessionToken *DeviceSessionToken `xml:"deviceSessionToken,omitempty"`
}

type GetContentKeyResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 getContentKeyResponse"`

	ContentKey *ContentKey `xml:"contentKey,omitempty"`
}

type CreateContainer struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 createContainer"`

	ContainerType string `xml:"containerType,omitempty"`

	Title string `xml:"title,omitempty"`

	ParentId *Id `xml:"parentId,omitempty"`

	SeedId *Id `xml:"seedId,omitempty"`
}

type CreateContainerResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 createContainerResponse"`

	CreateContainerResult *CreateContainerResult `xml:"createContainerResult,omitempty"`
}

type AddToContainer struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 addToContainer"`

	Id *Id `xml:"id,omitempty"`

	ParentId *Id `xml:"parentId,omitempty"`

	Index int32 `xml:"index,omitempty"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type AddToContainerResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 addToContainerResponse"`

	AddToContainerResult *AddToContainerResult `xml:"addToContainerResult,omitempty"`
}

type RenameContainer struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 renameContainer"`

	Id *Id `xml:"id,omitempty"`

	Title string `xml:"title,omitempty"`
}

type RenameContainerResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 renameContainerResponse"`

	RenameContainerResult *RenameContainerResult `xml:"renameContainerResult,omitempty"`
}

type DeleteContainer struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deleteContainer"`

	Id *Id `xml:"id,omitempty"`
}

type DeleteContainerResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deleteContainerResponse"`

	DeleteContainerResult *DeleteContainerResult `xml:"deleteContainerResult,omitempty"`
}

type RemoveFromContainer struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 removeFromContainer"`

	Id *Id `xml:"id,omitempty"`

	Indices string `xml:"indices,omitempty"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type RemoveFromContainerResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 removeFromContainerResponse"`

	RemoveFromContainerResult *RemoveFromContainerResult `xml:"removeFromContainerResult,omitempty"`
}

type ReorderContainer struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reorderContainer"`

	Id *Id `xml:"id,omitempty"`

	From string `xml:"from,omitempty"`

	To int32 `xml:"to,omitempty"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type ReorderContainerResponse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reorderContainerResponse"`

	ReorderContainerResult *ReorderContainerResult `xml:"reorderContainerResult,omitempty"`
}

type CustomFault struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 customFault"`

	RefreshAuthTokenResult *DeviceAuthTokenResult `xml:"refreshAuthTokenResult,omitempty"`
}

type EncryptionContext struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 encryptionContext"`

	Value string

	Type *EncryptionType `xml:"type,attr,omitempty"`
}

type AbstractMedia struct {
	Id *Id `xml:"id,omitempty"`

	ItemType *ItemType `xml:"itemType,omitempty"`

	DisplayType string `xml:"displayType,omitempty"`

	Title string `xml:"title,omitempty"`

	Summary string `xml:"summary,omitempty"`

	IsFavorite bool `xml:"isFavorite,omitempty"`

	Tags *TagsData `xml:"tags,omitempty"`

	IsExplicit bool `xml:"isExplicit,omitempty"`

	Language string `xml:"language,omitempty"`

	Country string `xml:"country,omitempty"`

	GenreId string `xml:"genreId,omitempty"`

	Genre string `xml:"genre,omitempty"`

	TwitterId string `xml:"twitterId,omitempty"`

	LiveNow bool `xml:"liveNow,omitempty"`

	OnDemand bool `xml:"onDemand,omitempty"`
}

type AppLinkInfo struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 appLinkInfo"`

	AppUrl *SonosUri `xml:"appUrl,omitempty"`

	AppUrlStringId string `xml:"appUrlStringId,omitempty"`

	DeviceLink *DeviceLinkCodeResult `xml:"deviceLink,omitempty"`

	FailureStringId string `xml:"failureStringId,omitempty"`

	FailureUrl *SonosUri `xml:"failureUrl,omitempty"`

	FailureUrlStringId string `xml:"failureUrlStringId,omitempty"`
}

type CallToActionInfo struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 callToActionInfo"`

	MessageStringId string `xml:"messageStringId,omitempty"`

	Url *SonosUri `xml:"url,omitempty"`

	UrlStringId string `xml:"urlStringId,omitempty"`
}

type AppLinkResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 appLinkResult"`

	CallToAction *CallToActionInfo `xml:"callToAction,omitempty"`
}

type DeviceLinkCodeResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deviceLinkCodeResult"`

	RegUrl string `xml:"regUrl,omitempty"`

	LinkCode string `xml:"linkCode,omitempty"`

	ShowLinkCode bool `xml:"showLinkCode,omitempty"`

	LinkDeviceId string `xml:"linkDeviceId,omitempty"`
}

type DeviceAuthTokenResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deviceAuthTokenResult"`

	AuthToken string `xml:"authToken,omitempty"`

	PrivateKey string `xml:"privateKey,omitempty"`

	UserInfo *UserInfo `xml:"userInfo,omitempty"`
}

type UserInfo struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 userInfo"`

	UserIdHashCode string `xml:"userIdHashCode,omitempty"`

	AccountType *UserAccountType `xml:"accountType,omitempty"`

	AccountStatus *UserAccountStatus `xml:"accountStatus,omitempty"`

	Nickname *Nickname `xml:"nickname,omitempty"`

	ProfileUrl *SonosUri `xml:"profileUrl,omitempty"`

	PictureUrl *SonosUri `xml:"pictureUrl,omitempty"`
}

type ReportPlaySecondsResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reportPlaySecondsResult"`

	Interval int32 `xml:"interval,omitempty"`
}

type AlbumArtUrl struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 albumArtUrl"`

	Value *AnyURI

	RequiresAuthentication bool `xml:"requiresAuthentication,attr,omitempty"`
}

type PositionInformation struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 positionInformation"`

	Id *Id `xml:"id,omitempty"`

	Index int32 `xml:"index,omitempty"`

	OffsetMillis int32 `xml:"offsetMillis,omitempty"`
}

type MediaCollection struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 mediaCollection"`

	*AbstractMedia

	CanScroll bool `xml:"canScroll,omitempty"`

	CanPlay bool `xml:"canPlay,omitempty"`

	CanEnumerate bool `xml:"canEnumerate,omitempty"`

	CanAddToFavorites bool `xml:"canAddToFavorites,omitempty"`

	ContainsFavorite bool `xml:"containsFavorite,omitempty"`

	CanCache bool `xml:"canCache,omitempty"`

	CanSkip bool `xml:"canSkip,omitempty"`

	AlbumArtURI *AlbumArtUrl `xml:"albumArtURI,omitempty"`

	CanResume bool `xml:"canResume,omitempty"`

	AuthRequired bool `xml:"authRequired,omitempty"`

	Homogeneous bool `xml:"homogeneous,omitempty"`

	CanAddToFavorite bool `xml:"canAddToFavorite,omitempty"`

	ReadOnly bool `xml:"readOnly,attr,omitempty"`

	CanReorderItems bool `xml:"canReorderItems,attr,omitempty"`

	CanDeleteItems bool `xml:"canDeleteItems,attr,omitempty"`

	Renameable bool `xml:"renameable,attr,omitempty"`

	UserContent bool `xml:"userContent,attr,omitempty"`
}

type TrackMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 trackMetadata"`

	GenreId *Id `xml:"genreId,omitempty"`

	Genre string `xml:"genre,omitempty"`

	Duration int32 `xml:"duration,omitempty"`

	Rating int32 `xml:"rating,omitempty"`

	AlbumArtURI *AlbumArtUrl `xml:"albumArtURI,omitempty"`

	TrackNumber int32 `xml:"trackNumber,omitempty"`

	CanPlay bool `xml:"canPlay,omitempty"`

	CanSkip bool `xml:"canSkip,omitempty"`

	CanAddToFavorites bool `xml:"canAddToFavorites,omitempty"`

	CanResume bool `xml:"canResume,omitempty"`

	CanSeek bool `xml:"canSeek,omitempty"`

	HasOutOfBandMetadata bool `xml:"hasOutOfBandMetadata,omitempty"`
}

type StreamMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 streamMetadata"`

	CurrentHost string `xml:"currentHost,omitempty"`

	CurrentShowId *Id `xml:"currentShowId,omitempty"`

	CurrentShow string `xml:"currentShow,omitempty"`

	SecondsRemaining int32 `xml:"secondsRemaining,omitempty"`

	SecondsToNextShow int32 `xml:"secondsToNextShow,omitempty"`

	Bitrate int32 `xml:"bitrate,omitempty"`

	Logo *AlbumArtUrl `xml:"logo,omitempty"`

	Description string `xml:"description,omitempty"`

	IsEphemeral bool `xml:"isEphemeral,omitempty"`

	Reliability *AnyURI `xml:"reliability,omitempty"`

	Title *AnyURI `xml:"title,omitempty"`

	Subtitle *AnyURI `xml:"subtitle,omitempty"`

	NextShowSeconds *AnyURI `xml:"nextShowSeconds,omitempty"`

	HasOutOfBandMetadata bool `xml:"hasOutOfBandMetadata,omitempty"`
}

type Property struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 property"`

	Name string `xml:"name,omitempty"`

	Value string `xml:"value,omitempty"`
}

type DynamicData struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 dynamicData"`

	Property []*Property `xml:"property,omitempty"`
}

type BehaviorsData struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 behaviorsData"`

	SupportsQuickSkip bool `xml:"supportsQuickSkip,omitempty"`
}

type TagsData struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 tagsData"`

	Explicit int32 `xml:"explicit,omitempty"`

	Premium int32 `xml:"premium,omitempty"`
}

type MediaMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 mediaMetadata"`

	*AbstractMedia

	MimeType string `xml:"mimeType,omitempty"`

	Dynamic *DynamicData `xml:"dynamic,omitempty"`

	Behaviors *BehaviorsData `xml:"behaviors,omitempty"`
}

type SegmentMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 segmentMetadata"`

	Id *Id `xml:"id,omitempty"`

	TrackId *Id `xml:"trackId,omitempty"`

	Track string `xml:"track,omitempty"`

	ArtistId *Id `xml:"artistId,omitempty"`

	Artist string `xml:"artist,omitempty"`

	ComposerId *Id `xml:"composerId,omitempty"`

	Composer string `xml:"composer,omitempty"`

	AlbumId *Id `xml:"albumId,omitempty"`

	Album string `xml:"album,omitempty"`

	AlbumArtistId *Id `xml:"albumArtistId,omitempty"`

	AlbumArtist string `xml:"albumArtist,omitempty"`

	GenreId *Id `xml:"genreId,omitempty"`

	Genre string `xml:"genre,omitempty"`

	ShowId *Id `xml:"showId,omitempty"`

	Show string `xml:"show,omitempty"`

	EpisodeId *Id `xml:"episodeId,omitempty"`

	Episode string `xml:"episode,omitempty"`

	Host string `xml:"host,omitempty"`

	Topic string `xml:"topic,omitempty"`

	Rating int32 `xml:"rating,omitempty"`

	AlbumArtURI *AnyURI `xml:"albumArtURI,omitempty"`

	// Specifies the inclusive start time of the period to which this metadata
	// applies.
	//
	StartTime time.Time `xml:"startTime,omitempty"`

	// Specifies the length of the period in milliseconds.
	Duration int32 `xml:"duration,omitempty"`
}

type MediaList struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 mediaList"`

	Index int32 `xml:"index,omitempty"`

	Count int32 `xml:"count,omitempty"`

	Total int32 `xml:"total,omitempty"`

	PositionInformation *PositionInformation `xml:"positionInformation,omitempty"`

	MediaCollection *MediaCollection `xml:"mediaCollection,omitempty"`

	MediaMetadata *MediaMetadata `xml:"mediaMetadata,omitempty"`
}

type RadioTrackList struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 radioTrackList"`

	Count int32 `xml:"count,omitempty"`

	Id string `xml:"id,omitempty"`

	Name string `xml:"name,omitempty"`

	MediaMetadata *MediaMetadata `xml:"mediaMetadata,omitempty"`
}

type SegmentMetadataList struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 segmentMetadataList"`

	// Specifies the inclusive start time of the period for this list. If
	// omitted, defaults the startTime of the first temporalMediaMetadata element.
	//
	StartTime time.Time `xml:"startTime,omitempty"`

	// Specifies the length of the period of this list in milliseconds. If
	// omitted, defaults the duration between startTime and the last elment's end time.
	//
	Duration int32 `xml:"duration,omitempty"`

	// A chronologically ordered list of segmentMetadata elements
	//
	SegmentMetadata []*SegmentMetadata `xml:"segmentMetadata,omitempty"`
}

type LastUpdate struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 lastUpdate"`

	Catalog string `xml:"catalog,omitempty"`

	Favorites string `xml:"favorites,omitempty"`

	PollInterval int32 `xml:"pollInterval,omitempty"`

	AutoRefreshEnabled bool `xml:"autoRefreshEnabled,omitempty"`
}

type RelatedBrowse struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 relatedBrowse"`

	Id *Id `xml:"id,omitempty"`

	Type_ string `xml:"type,omitempty"`
}

type RelatedText struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 relatedText"`

	Id *Id `xml:"id,omitempty"`

	Type_ string `xml:"type,omitempty"`
}

type RelatedPlay struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 relatedPlay"`

	Id *Id `xml:"id,omitempty"`

	ItemType *ItemType `xml:"itemType,omitempty"`

	Title string `xml:"title,omitempty"`

	CanPlay bool `xml:"canPlay,omitempty"`
}

type RelatedActions struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 relatedActions"`

	Action []*GenericAction `xml:"action,omitempty"`
}

type ExtendedMetadata struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 extendedMetadata"`

	RelatedBrowse []*RelatedBrowse `xml:"relatedBrowse,omitempty"`

	RelatedText []*RelatedText `xml:"relatedText,omitempty"`

	RelatedPlay *RelatedPlay `xml:"relatedPlay,omitempty"`

	RelatedActions *RelatedActions `xml:"relatedActions,omitempty"`

	MediaCollection *MediaCollection `xml:"mediaCollection,omitempty"`

	MediaMetadata *MediaMetadata `xml:"mediaMetadata,omitempty"`
}

type GenericAction struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 genericAction"`

	Id *Id `xml:"id,omitempty"`

	Title string `xml:"title,omitempty"`

	ActionType *ActionType `xml:"actionType,omitempty"`

	ShowInBrowse bool `xml:"showInBrowse,omitempty"`

	SuccessMessageStringId string `xml:"successMessageStringId,omitempty"`

	FailureMessageStringId string `xml:"failureMessageStringId,omitempty"`

	OpenUrlAction *OpenUrlAction `xml:"openUrlAction,omitempty"`

	SimpleHttpRequestAction *SimpleHttpRequestAction `xml:"simpleHttpRequestAction,omitempty"`

	RateItemAction *RateItemAction `xml:"rateItemAction,omitempty"`
}

type OpenUrlAction struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 openUrlAction"`

	Url string `xml:"url,omitempty"`
}

type SimpleHttpRequestAction struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 simpleHttpRequestAction"`

	Url string `xml:"url,omitempty"`

	Method string `xml:"method,omitempty"`

	HttpHeaders *HttpHeaders `xml:"httpHeaders,omitempty"`

	RefreshOnSuccess bool `xml:"refreshOnSuccess,omitempty"`
}

type RateItemAction struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 rateItemAction"`

	RateItem *RateItem `xml:"rateItem,omitempty"`

	ShouldSkip bool `xml:"shouldSkip,omitempty"`
}

type ItemRating struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 itemRating"`

	ShouldSkip bool `xml:"shouldSkip,omitempty"`

	MessageStringId string `xml:"messageStringId,omitempty"`
}

type HttpHeader struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 httpHeader"`

	Header string `xml:"header,omitempty"`

	Value string `xml:"value,omitempty"`
}

type HttpHeaders struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 httpHeaders"`

	HttpHeader []*HttpHeader `xml:"httpHeader,omitempty"`
}

type ContentKey struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 contentKey"`

	Uri *AnyURI `xml:"uri,omitempty"`

	DeviceSessionToken *DeviceSessionToken `xml:"deviceSessionToken,omitempty"`

	DeviceSessionKey *EncryptionContext `xml:"deviceSessionKey,omitempty"`

	ContentKey *EncryptionContext `xml:"contentKey,omitempty"`
}

type CreateContainerResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 createContainerResult"`

	Id *Id `xml:"id,omitempty"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type AddToContainerResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 addToContainerResult"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type RenameContainerResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 renameContainerResult"`
}

type DeleteContainerResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 deleteContainerResult"`
}

type RemoveFromContainerResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 removeFromContainerResult"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type ReorderContainerResult struct {
	XMLName xml.Name `xml:"http://www.sonos.com/Services/1.1 reorderContainerResult"`

	UpdateId *Id `xml:"updateId,omitempty"`
}

type SonosSoap interface {

	// Error can be either of the following types:
	//
	//   - customFault

	GetSessionId(request *GetSessionId) (*GetSessionIdResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetMetadata(request *GetMetadata) (*GetMetadataResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetExtendedMetadata(request *GetExtendedMetadata) (*GetExtendedMetadataResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetExtendedMetadataText(request *GetExtendedMetadataText) (*GetExtendedMetadataTextResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetUserInfo(request *GetUserInfo) (*GetUserInfoResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	RateItem(request *RateItem) (*RateItemResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	Search(request *Search) (*SearchResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetMediaMetadata(request *GetMediaMetadata) (*GetMediaMetadataResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetMediaURI(request *GetMediaURI) (*GetMediaURIResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	CreateItem(request *CreateItem) (*CreateItemResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	DeleteItem(request *DeleteItem) (*DeleteItemResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetScrollIndices(request *GetScrollIndices) (*GetScrollIndicesResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetLastUpdate(request *GetLastUpdate) (*GetLastUpdateResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	ReportStatus(request *ReportStatus) (*ReportStatusResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	SetPlayedSeconds(request *SetPlayedSeconds) (*SetPlayedSecondsResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	ReportPlaySeconds(request *ReportPlaySeconds) (*ReportPlaySecondsResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	ReportPlayStatus(request *ReportPlayStatus) (*ReportPlayStatusResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	ReportAccountAction(request *ReportAccountAction) (*ReportAccountActionResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetAppLink(request *GetAppLink) (*GetAppLinkResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetDeviceLinkCode(request *GetDeviceLinkCode) (*GetDeviceLinkCodeResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetDeviceAuthToken(request *GetDeviceAuthToken) (*GetDeviceAuthTokenResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	RefreshAuthToken(request *RefreshAuthToken) (*RefreshAuthTokenResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetStreamingMetadata(request *GetStreamingMetadata) (*GetStreamingMetadataResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	GetContentKey(request *GetContentKey) (*GetContentKeyResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	CreateContainer(request *CreateContainer) (*CreateContainerResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	AddToContainer(request *AddToContainer) (*AddToContainerResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	RenameContainer(request *RenameContainer) (*RenameContainerResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	DeleteContainer(request *DeleteContainer) (*DeleteContainerResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	RemoveFromContainer(request *RemoveFromContainer) (*RemoveFromContainerResponse, error)

	// Error can be either of the following types:
	//
	//   - customFault

	ReorderContainer(request *ReorderContainer) (*ReorderContainerResponse, error)
}

type sonosSoap struct {
	client *soap.Client
}

func NewSonosSoap(client *soap.Client) SonosSoap {
	return &sonosSoap{
		client: client,
	}
}

func (service *sonosSoap) GetSessionId(request *GetSessionId) (*GetSessionIdResponse, error) {
	response := new(GetSessionIdResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getSessionId", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetMetadata(request *GetMetadata) (*GetMetadataResponse, error) {
	response := new(GetMetadataResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getMetadata", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetExtendedMetadata(request *GetExtendedMetadata) (*GetExtendedMetadataResponse, error) {
	response := new(GetExtendedMetadataResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getExtendedMetadata", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetExtendedMetadataText(request *GetExtendedMetadataText) (*GetExtendedMetadataTextResponse, error) {
	response := new(GetExtendedMetadataTextResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getExtendedMetadataText", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetUserInfo(request *GetUserInfo) (*GetUserInfoResponse, error) {
	response := new(GetUserInfoResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getUserInfo", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) RateItem(request *RateItem) (*RateItemResponse, error) {
	response := new(RateItemResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#rateItem", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) Search(request *Search) (*SearchResponse, error) {
	response := new(SearchResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#search", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetMediaMetadata(request *GetMediaMetadata) (*GetMediaMetadataResponse, error) {
	response := new(GetMediaMetadataResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getMediaMetadata", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetMediaURI(request *GetMediaURI) (*GetMediaURIResponse, error) {
	response := new(GetMediaURIResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getMediaURI", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) CreateItem(request *CreateItem) (*CreateItemResponse, error) {
	response := new(CreateItemResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#createItem", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) DeleteItem(request *DeleteItem) (*DeleteItemResponse, error) {
	response := new(DeleteItemResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#deleteItem", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetScrollIndices(request *GetScrollIndices) (*GetScrollIndicesResponse, error) {
	response := new(GetScrollIndicesResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getScrollIndices", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetLastUpdate(request *GetLastUpdate) (*GetLastUpdateResponse, error) {
	response := new(GetLastUpdateResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getLastUpdate", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) ReportStatus(request *ReportStatus) (*ReportStatusResponse, error) {
	response := new(ReportStatusResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#reportStatus", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) SetPlayedSeconds(request *SetPlayedSeconds) (*SetPlayedSecondsResponse, error) {
	response := new(SetPlayedSecondsResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#setPlayedSeconds", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) ReportPlaySeconds(request *ReportPlaySeconds) (*ReportPlaySecondsResponse, error) {
	response := new(ReportPlaySecondsResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#reportPlaySeconds", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) ReportPlayStatus(request *ReportPlayStatus) (*ReportPlayStatusResponse, error) {
	response := new(ReportPlayStatusResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#reportPlayStatus", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) ReportAccountAction(request *ReportAccountAction) (*ReportAccountActionResponse, error) {
	response := new(ReportAccountActionResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#reportAccountAction", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetAppLink(request *GetAppLink) (*GetAppLinkResponse, error) {
	response := new(GetAppLinkResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getAppLink", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetDeviceLinkCode(request *GetDeviceLinkCode) (*GetDeviceLinkCodeResponse, error) {
	response := new(GetDeviceLinkCodeResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getDeviceLinkCode", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetDeviceAuthToken(request *GetDeviceAuthToken) (*GetDeviceAuthTokenResponse, error) {
	response := new(GetDeviceAuthTokenResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getDeviceAuthToken", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) RefreshAuthToken(request *RefreshAuthToken) (*RefreshAuthTokenResponse, error) {
	response := new(RefreshAuthTokenResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#refreshAuthToken", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetStreamingMetadata(request *GetStreamingMetadata) (*GetStreamingMetadataResponse, error) {
	response := new(GetStreamingMetadataResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getStreamingMetadata", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) GetContentKey(request *GetContentKey) (*GetContentKeyResponse, error) {
	response := new(GetContentKeyResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#getContentKey", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) CreateContainer(request *CreateContainer) (*CreateContainerResponse, error) {
	response := new(CreateContainerResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#createContainer", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) AddToContainer(request *AddToContainer) (*AddToContainerResponse, error) {
	response := new(AddToContainerResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#addToContainer", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) RenameContainer(request *RenameContainer) (*RenameContainerResponse, error) {
	response := new(RenameContainerResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#renameContainer", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) DeleteContainer(request *DeleteContainer) (*DeleteContainerResponse, error) {
	response := new(DeleteContainerResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#deleteContainer", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) RemoveFromContainer(request *RemoveFromContainer) (*RemoveFromContainerResponse, error) {
	response := new(RemoveFromContainerResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#removeFromContainer", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (service *sonosSoap) ReorderContainer(request *ReorderContainer) (*ReorderContainerResponse, error) {
	response := new(ReorderContainerResponse)
	err := service.client.Call("http://www.sonos.com/Services/1.1#reorderContainer", request, response)
	if err != nil {
		return nil, err
	}

	return response, nil
}
