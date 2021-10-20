package musicdb

import (
	"database/sql"
	//"encoding/json"
	"fmt"
	"log"
	"os/user"
	"strings"
	//"time"

	"github.com/pkg/errors"
	"github.com/rclancey/authenticator"
	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/itunes/persistentId"
)

type User struct {
	PersistentID  pid.PersistentID `json:"persistent_id,omitempty" db:"id"`
	Username      string       `json:"username" db:"username"`
	HomeDirectory *string      `json:"home_directory,omitempty" db:"homedir"`
	LibraryID     *pid.PersistentID `json:"-" db:"library_id"`
	FirstName     *string      `json:"first_name,omitempty" db:"first_name"`
	LastName      *string      `json:"last_name,omitempty" db:"last_name"`
	Email         *string      `json:"email,omitempty" db:"email"`
	Phone         *string      `json:"phone,omitempty" db:"phone"`
	Avatar        *string      `json:"avatar_url,omitempty" db:"avatar"`
	AppleID       *string      `json:"apple_id,omitempty" db:"apple_id"`
	GitHubID      *string      `json:"github_id,omitempty" db:"github_id"`
	GoogleID      *string      `json:"google_id,omitempty" db:"google_id"`
	AmazonID      *string      `json:"amazon_id,omitempty" db:"amazon_id"`
	FacebookID    *string      `json:"facebook_id,omitempty" db:"facebook_id"`
	TwitterID     *string      `json:"twitter_id,omitempty" db:"twitter_id"`
	LinkedInID    *string      `json:"linkedin_id,omitempty" db:"linkedin_id"`
	SlackID       *string      `json:"slack_id,omitempty" db:"slack_id"`
	BitBucketID   *string      `json:"bitbucket_id,omitempty" db:"bitbucket_id"`
	DateAdded     *Time        `json:"date_added,omitempty" db:"date_added"`
	DateModified  *Time        `json:"date_modified,omitempty" db:"date_modified"`
	Active        bool         `json:"active,omitempty" db:"active"`
	Password      *authenticator.PasswordAuthenticator  `json:"password_auth,omitempty" db:"password_auth"`
	TwoFactor     *authenticator.TwoFactorAuthenticator `json:"twofactor_auth,omitempty" db:"twofactor_auth"`
	TmpTwoFactor  *authenticator.TwoFactorAuthenticator `json:"tmp_twofactor_auth,omitempty" db:"tmp_twofactor_auth"`
	IsAdmin       bool         `json:"admin,omitempty" db:"admin"`
	LastLibraryUpdate *Time `json:"last_library_update" db:"last_library_update"`
	db *DB
}

func NewUser(db *DB, username string) *User {
	now := Now()
	u := &User{
		PersistentID: pid.NewPersistentID(),
		Username: username,
		DateAdded: &now,
		DateModified: &now,
		Active: true,
		db: db,
	}
	ou, err := user.Lookup(username)
	if err == nil {
		u.HomeDirectory = stringp(ou.HomeDir)
		name := strings.Fields(strings.TrimSpace(ou.Name))
		if len(name) > 1 {
			u.FirstName = stringp(strings.Join(name[:len(name) - 1], " "))
			u.LastName = stringp(name[len(name) - 1])
		} else if name[0] != "" {
			u.FirstName = stringp(name[0])
		}
	}
	return u
}

func (u *User) PasswordStrengthInputs() []string {
	sps := []*string{
		&u.Username,
		u.Email,
		u.FirstName,
		u.LastName,
		u.Phone,
		u.AppleID,
		u.GitHubID,
		u.GoogleID,
		u.AmazonID,
		u.FacebookID,
		u.TwitterID,
		u.LinkedInID,
		u.SlackID,
		u.BitBucketID,
	}
	inputs := []string{}
	for _, sp := range sps {
		if sp != nil && *sp != "" {
			inputs = append(inputs, *sp)
		}
	}
	return inputs
}

func (u *User) Create() error {
	if u.db == nil {
		return errors.New("no db handle")
	}
	tx, err := u.db.Begin()
	if err != nil {
		return err
	}
	err = u.db.insertStruct(tx, u)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (u *User) Update() error {
	if u.db == nil {
		return errors.New("no db handle")
	}
	tx, err := u.db.Begin()
	if err != nil {
		return err
	}
	err = u.db.updateStruct(tx, u)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (u *User) SharedFolder() *Playlist {
	var name string
	if u.FirstName != nil && u.LastName != nil && *u.FirstName != "" && *u.LastName != "" {
		name = *u.FirstName + " " + *u.LastName
	} else if u.FirstName != nil && *u.FirstName != "" {
		name = *u.FirstName
	} else {
		name = u.Username
	}
	now := Now()
	return &Playlist{
		PersistentID: u.PersistentID,
		OwnerID: u.PersistentID,
		Shared: true,
		Kind: FolderPlaylist,
		Folder: true,
		Name: fmt.Sprintf("%s's Shared Playlists", name),
		DateAdded: u.DateAdded,
		DateModified: &now,
	}
}

func (u *User) GetUsername() string {
	return u.Username
}

func (u *User) GetUserID() int64 {
	return u.PersistentID.Int64()
}

func (u *User) GetFirstName() string {
	if u.FirstName == nil {
		return ""
	}
	return *u.FirstName
}

func (u *User) GetLastName() string {
	if u.LastName == nil {
		return ""
	}
	return *u.LastName
}

func (u *User) GetEmailAddress() string {
	if u.Email == nil {
		return ""
	}
	return *u.Email
}

func (u *User) GetPhoneNumber() string {
	if u.Phone == nil {
		return ""
	}
	return *u.Phone
}

func (u *User) GetAvatar() string {
	if u.Avatar == nil {
		return ""
	}
	return *u.Avatar
}

func (u *User) GetAuth() (authenticator.Authenticator, error) {
	return u.Password, nil
}

func (u *User) SetAuth(auth authenticator.Authenticator) error {
	if u.db == nil {
		return errors.New("no database handle")
	}
	pwauth, isa := auth.(*authenticator.PasswordAuthenticator)
	if !isa {
		return errors.New("invalid authentication mechanism")
	}
	query := `UPDATE xuser SET password_auth = ? WHERE username = ?`
	_, err := u.db.Exec(query, pwauth, u.Username)
	if err != nil {
		return err
	}
	u.Password = pwauth
	return nil
}

func (u *User) GetTwoFactorAuth() (authenticator.Authenticator, error) {
	return u.TwoFactor, nil
}

func (u *User) SetTwoFactorAuth(auth authenticator.Authenticator) error {
	if u.db == nil {
		return errors.New("no database handle")
	}
	tfa, isa := auth.(*authenticator.TwoFactorAuthenticator)
	if !isa {
		return errors.New("invalid authentication mechanism")
	}
	query := `UPDATE xuser SET twofactor_auth = ? WHERE username = ?`
	_, err := u.db.Exec(query, tfa, u.Username)
	if err != nil {
		return err
	}
	u.TwoFactor = tfa
	return nil
}

func (u *User) InitTwoFactorAuth() (authenticator.Authenticator, error) {
	if u.db == nil {
		return nil, errors.New("no database handle")
	}
	tfa, err := authenticator.NewTwoFactorAuthenticator(u.Username, "")
	if err != nil {
		return nil, err
	}
	query := `UPDATE xuser SET tmp_twofactor_auth = ? WHERE username = ?`
	_, err = u.db.Exec(query, tfa, u.Username)
	if err != nil {
		return nil, err
	}
	u.TmpTwoFactor = tfa
	return tfa, nil
}

func (u *User) CompleteTwoFactorAuth(code string) error {
	if u.db == nil {
		return errors.New("no database handle")
	}
	tfa := u.TmpTwoFactor
	if tfa == nil {
		return errors.New("no authenticator configured")
	}
	err := tfa.Authenticate(code)
	if err != nil {
		return err
	}
	query := `UPDATE xuser SET twofactor_auth = ?, tmp_twofactor_auth = NULL WHERE username = ?`
	_, err = u.db.Exec(query, tfa, u.Username)
	if err != nil {
		return err
	}
	u.TwoFactor = tfa
	u.TmpTwoFactor = nil
	return nil
}

func (u *User) SetSocialID(driver, id string) error {
	if u.db == nil {
		return errors.New("no database handle")
	}
	key, err := u.db.getColumnNameForDriver(driver)
	if err != nil {
		return err
	}
	query := fmt.Sprintf(`UPDATE xuser SET %s = ? WHERE username = ?`, key)
	_, err = u.db.Exec(query, id, u.Username)
	if err != nil {
		return err
	}
	u.Reload(u.db)
	return nil
}

func (u *User) Clean() *User {
	clone := *u
	clone.AppleID = nil
	clone.GitHubID = nil
	clone.GoogleID = nil
	clone.AmazonID = nil
	clone.FacebookID = nil
	clone.TwitterID = nil
	clone.LinkedInID = nil
	clone.SlackID = nil
	clone.BitBucketID = nil
	clone.HomeDirectory = nil
	clone.Password = nil
	clone.TwoFactor = nil
	clone.TmpTwoFactor = nil
	return &clone
}

/*
func (u *User) MarshalJSON() ([]byte, error) {
	clone := *u
	clone.Auth = nil
	return json.Marshal(clone)
}
*/

func (u *User) ID() pid.PersistentID {
	return u.PersistentID
}

func (u *User) SetID(p pid.PersistentID) {
	u.PersistentID = p
}

func (u *User) String() string {
	return u.Username
}

func (u *User) Reload(db *DB) error {
	u.db = db
	query := `SELECT * FROM xuser WHERE `
	if u.PersistentID != pid.PersistentID(0) {
		query += `id = :id`
	} else if u.Username != "" {
		query += `username = :username`
	} else {
		return errors.WithStack(auth.ErrUnknownUser)
	}
	stmt, err := u.db.conn.PrepareNamed(query)
	if err != nil {
		return errors.WithStack(err)
	}
	row := stmt.QueryRow(u)
	err = row.StructScan(u)
	if errors.Is(err, sql.ErrNoRows) {
		return errors.WithStack(auth.ErrUnknownUser)
	}
	return errors.WithStack(err)
}

func (u *User) UpdateLibrary(db *DB) error {
	query := `UPDATE xuser SET last_library_update = ? WHERE id = ?`
	now := Now()
	_, err := u.db.Exec(query, now, u.PersistentID)
	if err != nil {
		log.Println("error updating user:", err)
		return err
	}
	u.LastLibraryUpdate = &now
	return nil
}
