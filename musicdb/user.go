package musicdb

import (
	"encoding/json"
	"fmt"
	"log"
	"os/user"
	"strings"
	//"time"

	"github.com/pkg/errors"
	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/twofactor"
)

type User struct {
	PersistentID  PersistentID `json:"persistent_id,omitempty" db:"id"`
	Username      string       `json:"username" db:"username"`
	HomeDirectory *string      `json:"home_directory,omitempty" db:"homedir"`
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
	Active        bool         `json:"active" db:"active"`
	Auth          *twofactor.Auth `json:"-" db:"auth"`
	db *DB
}

func NewUser(username string) *User {
	u := &User{
		PersistentID: NewPersistentID(),
		Username: username,
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
	return int64(u.PersistentID)
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

func (u *User) GetAuth() (*twofactor.Auth, error) {
	log.Printf("user auth data: %#v", u.Auth)
	return u.Auth, nil
}

func (u *User) SetAuth(auth *twofactor.Auth) error {
	if u.db == nil {
		return errors.New("no database handle")
	}
	query := `UPDATE xuser SET auth = ? WHERE username = ?`
	_, err := u.db.Exec(query, auth, u.Username)
	if err != nil {
		return err
	}
	u.Auth = auth
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
	clone.Auth = nil
	return &clone
}

func (u *User) MarshalJSON() ([]byte, error) {
	clone := *u
	clone.Auth = nil
	return json.Marshal(clone)
}

func (u *User) ID() PersistentID {
	return u.PersistentID
}

func (u *User) SetID(pid PersistentID) {
	u.PersistentID = pid
}

func (u *User) String() string {
	return u.Username
}

func (u *User) Reload(db *DB) error {
	u.db = db
	query := `SELECT * FROM xuser WHERE `
	if u.PersistentID != PersistentID(0) {
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
	return errors.WithStack(err)
}
