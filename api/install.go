package api

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os/user"
	"regexp"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	"github.com/rclancey/authenticator"
)

type SynosInstaller struct {
	owner *user.User
	config *SynosConfig
	version string
	lastMigrationId int
	db *sqlx.DB
}

type Migration interface {
	Migrate(tx *sqlx.Tx) error
}

type SimpleMigration []string

func (mig SimpleMigration) Migrate(tx *sqlx.Tx) error {
	for _, query := range mig {
		_, err := tx.Exec(query)
		if err != nil {
			return err
		}
	}
	return nil
}

type ComplexMigration func(tx *sqlx.Tx) error

func (mig ComplexMigration) Migrate(tx *sqlx.Tx) error {
	return mig(tx)
}

func NewSynosInstaller(config *SynosConfig) (*SynosInstaller, error) {
	u, err := user.Current()
	if err != nil {
		return nil, err
	}
	return &SynosInstaller{
		owner: u,
		config: config,
		version: "",
		lastMigrationId: -1,
		db: nil,
	}, nil
}

func (si *SynosInstaller) GetVersion() string {
	return si.version
}

func (si *SynosInstaller) GetLastMigrationID() int {
	return si.lastMigrationId
}

func (si *SynosInstaller) createDB() error {
	tmpcfg := si.config.Database.Clone()
	name := tmpcfg.Name
	if name == "" {
		return errors.New("missing database name")
	}
	re := regexp.MustCompile("^[A-Za-z0-9_]+$")
	if !re.MatchString(name) {
		return errors.New("invalid database name")
	}
	conn, err := sqlx.Connect("postgres", tmpcfg.DSN())
	if err == nil {
		log.Println("database exists")
		conn.Close()
		return nil
	}
	log.Println("creating database")
	tmpcfg.Name = "template1"
	conn, err = sqlx.Connect("postgres", tmpcfg.DSN())
	if err != nil {
		return err
	}
	query := fmt.Sprintf(`CREATE DATABASE %s`, name)
	_, err = conn.Exec(query)
	conn.Close()
	if err != nil {
		return err
	}
	tmpcfg.Name = name
	conn, err = sqlx.Connect("postgres", tmpcfg.DSN())
	if err != nil {
		return err
	}
	defer conn.Close()
	query = `CREATE TABLE version (
		version_id integer NOT NULL PRIMARY KEY,
		install_date timestamp with time zone NOT NULL,
		update_date timestamp with time zone NOT NULL,
		owner character varying(255) NOT NULL,
		version character varying(255) NOT NULL,
		migration_id integer NOT NULL
	)`
	_, err = conn.Exec(query)
	if err != nil {
		return err
	}
	query = `INSERT INTO version (
		version_id, install_date, update_date, owner, version, migration_id
	) VALUES (
		1, NOW(), NOW(), ?, ?, ?
	)`
	args := []interface{}{
		si.owner.Username,
		si.version,
		si.lastMigrationId,
	}
	_, err = conn.Exec(conn.Rebind(query), args...)
	if err != nil {
		return err
	}
	return nil
}

func (si *SynosInstaller) Connect() error {
	if si.db != nil {
		return nil
	}
	si.version = "v0.0.0"
	si.lastMigrationId = -1
	err := si.createDB()
	if err != nil {
		return err
	}
	dsn := si.config.Database.DSN()
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return err
	}
	query := `SELECT owner, version, migration_id FROM version WHERE version_id = 1`
	row := db.QueryRowx(query)
	var owner, version string
	var migrationId int
	err = row.Scan(&owner, &version, &migrationId)
	if err != nil {
		db.Close()
		return err
	}
	if owner != si.owner.Username {
		db.Close()
		return errors.New("database owned by a different user")
	}
	si.version = version
	si.lastMigrationId = migrationId
	si.db = db
	log.Printf("database version = %s", version)
	return nil
}

func (si *SynosInstaller) Close() error {
	db := si.db
	si.db = nil
	if db != nil {
		db.Close()
	}
	return nil
}

func (si *SynosInstaller) UpdateDB() error {
	log.Printf("updating database from version (%s) to (%s)", si.version, SynosVersion)
	migs := si.getMigrations()
	tx, err := si.db.Beginx()
	if err != nil {
		return err
	}
	for id, mig := range migs {
		if id <= si.lastMigrationId {
			continue
		}
		err := si.applyMigration(tx, id, mig)
		if err != nil {
			tx.Rollback()
			return err
		}
		si.lastMigrationId = id
	}
	if si.version != SynosVersion {
		query := `UPDATE version SET version = ?, update_date = NOW() WHERE version_id = 1`
		_, err = tx.Exec(tx.Rebind(query), SynosVersion)
		if err != nil {
			tx.Rollback()
			return err
		}
		si.version = SynosVersion
	}
	err = tx.Commit()
	if err != nil {
		return err
	}
	return nil
}

func (si *SynosInstaller) applyMigration(tx *sqlx.Tx, id int, mig Migration) error {
	log.Printf("applying migration %d", id)
	err := mig.Migrate(tx)
	if err != nil {
		return err
	}
	query := `UPDATE version SET migration_id = ? WHERE version_id = 1`
	_, err = tx.Exec(tx.Rebind(query), id)
	if err != nil {
		return err
	}
	return nil
}

func (si *SynosInstaller) getMigrations() []Migration {
	return []Migration{
		// 0: initial table setup
		installMigration,

		// 1: create an admin user
		ComplexMigration(func(tx *sqlx.Tx) error {
			id := rand.Int63()
			names := strings.Fields(si.owner.Name)
			n := len(names) - 1
			lastName := names[n]
			firstName := strings.Join(names[:n], " ")
			re := regexp.MustCompile(`^.*<(.*?)>.*$`)
			email := re.ReplaceAllString(si.config.Auth.EmailSender, "$1")
			query := `INSERT INTO xuser (
				id, username, first_name, last_name, email,
				date_added, date_modified, homedir
			) VALUES(?, ?, ?, ?, ?, NOW(), NOW(), ?)`
			args := []interface{}{
				id,
				si.owner.Username,
				firstName,
				lastName,
				email,
				si.owner.HomeDir,
			}
			_, err := tx.Exec(tx.Rebind(query), args...)
			return err
		}),

		// 2: add some metadata about users
		SimpleMigration{
			`ALTER TABLE xuser ADD COLUMN admin boolean DEFAULT false NOT NULL`,
			`ALTER TABLE xuser ADD COLUMN library_id bigint`,
			`ALTER TABLE xuser ADD COLUMN last_library_update timestamp with time zone`,
		},

		// 3: set an admin user
		ComplexMigration(func(tx *sqlx.Tx) error {
			query := `UPDATE xuser SET admin = ? WHERE username = ?`
			_, err := tx.Exec(tx.Rebind(query), true, si.owner.Username)
			return err
		}),

		// 4: setup fuzzy string matching extension
		SimpleMigration{
			`CREATE EXTENSION pg_trgm`,
		},

		// 5: new auth config
		ComplexMigration(func(tx *sqlx.Tx) error {
			query := `ALTER TABLE xuser ADD COLUMN password_auth TEXT`
			_, err := tx.Exec(query)
			if err != nil {
				log.Println("mig5.1", err)
				return err
			}
			query = `ALTER TABLE xuser ADD COLUMN twofactor_auth TEXT`
			_, err = tx.Exec(query)
			if err != nil {
				log.Println("mig5.2", err)
				return err
			}
			query = `ALTER TABLE xuser ADD COLUMN tmp_twofactor_auth TEXT`
			_, err = tx.Exec(query)
			if err != nil {
				log.Println("mig5.3", err)
				return err
			}

			type OldAuth struct {
				Password *string `json:"password"`
				ResetCode *string `json:"reset_code"`
				ResetCodeExpires *time.Time `json:"reset_code_expires"`
				TwoFactor *authenticator.TwoFactorAuthenticator `json:"two_factor"`
				TmpTwoFactor *authenticator.TwoFactorAuthenticator `json:"init_two_factor"`
			}
			auths := map[int64]*OldAuth{}
			query = `SELECT id, auth FROM xuser WHERE auth IS NOT NULL AND auth != ''`
			rows, err := tx.Queryx(query)
			if err != nil {
				log.Println("mig5.4", err)
				return err
			}
			for rows.Next() {
				var id int64
				var auth string
				err = rows.Scan(&id, &auth)
				if err != nil {
					rows.Close()
					return err
				}
				cfg := &OldAuth{}
				err = json.Unmarshal([]byte(auth), cfg)
				if err != nil {
					rows.Close()
					return err
				}
				auths[id] = cfg
			}
			for id, cfg := range auths {
				var pw *authenticator.PasswordAuthenticator
				if cfg.Password != nil {
					pw = &authenticator.PasswordAuthenticator{
						Hasher: "",
						HashedPassword: *cfg.Password,
						ResetCode: cfg.ResetCode,
						ResetCodeExpires: cfg.ResetCodeExpires,
					}
				}
				query := `UPDATE xuser SET password_auth = ?, twofactor_auth = ?, tmp_twofactor_auth = ? WHERE id = ?`
				_, err = tx.Exec(tx.Rebind(query), pw, cfg.TwoFactor, cfg.TmpTwoFactor, id)
				if err != nil {
					log.Println("mig5.5", id, err)
					pwval, _ := pw.Value()
					tfval, _ := cfg.TwoFactor.Value()
					ttfval, _ := cfg.TmpTwoFactor.Value()
					log.Println(query, pwval, tfval, ttfval, id)
					return err
				}
			}
			query = `ALTER TABLE xuser DROP COLUMN auth`
			_, err = tx.Exec(query)
			if err != nil {
				log.Println("mig5.6", err)
				return err
			}
			return nil
		}),
	}
}

var installMigration = SimpleMigration{
	`CREATE TABLE xuser (
		id bigint NOT NULL PRIMARY KEY,
		username character varying(255) NOT NULL UNIQUE,
		first_name character varying(255),
		last_name character varying(255),
		email character varying(255) UNIQUE,
		phone character varying(255) UNIQUE,
		avatar character varying(255),
		apple_id character varying(255) UNIQUE,
		github_id character varying(255) UNIQUE,
		google_id character varying(255) UNIQUE,
		amazon_id character varying(255) UNIQUE,
		facebook_id character varying(255) UNIQUE,
		twitter_id character varying(255) UNIQUE,
		linkedin_id character varying(255) UNIQUE,
		slack_id character varying(255) UNIQUE,
		bitbucket_id character varying(255) UNIQUE,
		date_added timestamp with time zone DEFAULT now() NOT NULL,
		date_modified timestamp with time zone DEFAULT now() NOT NULL,
		active boolean DEFAULT true NOT NULL,
		homedir character varying(255),
		auth text
	)`,
	`CREATE TABLE itunes_track (
		id character(16) NOT NULL PRIMARY KEY,
		data bytea,
		mod_date timestamp with time zone,
		owner_id bigint
	)`,
	`CREATE TABLE itunes_playlist (
		id character(16) NOT NULL PRIMARY KEY,
		data bytea,
		mod_date timestamp with time zone,
		owner_id bigint
	)`,
	`CREATE TABLE track (
		id bigint NOT NULL PRIMARY KEY,
    	album character varying(255),
    	album_artist character varying(255),
    	album_rating smallint,
    	artist character varying(255),
    	bitrate smallint,
    	bpm smallint,
    	comments text,
    	compilation boolean,
    	composer character varying(255),
    	date_added timestamp with time zone,
    	date_modified timestamp with time zone,
    	disc_count smallint,
    	disc_number smallint,
    	genre character varying(255),
    	grouping character varying(255),
    	kind character varying(255),
    	location character varying(4095),
    	loved boolean,
    	name character varying(255),
    	gapless boolean,
    	play_count integer,
    	play_date timestamp with time zone,
    	purchased boolean,
    	purchase_date timestamp with time zone,
    	rating smallint,
    	release_date timestamp with time zone,
    	sample_rate integer,
    	skip_count integer,
    	skip_date timestamp with time zone,
    	sort_album character varying(255),
    	sort_album_artist character varying(255),
    	sort_artist character varying(255),
    	sort_composer character varying(255),
    	sort_genre character varying(255),
    	sort_name character varying(255),
    	total_time integer,
    	track_count smallint,
    	track_number smallint,
    	volume_adjustment smallint,
    	work character varying(255),
    	media_kind integer,
    	file_type integer,
    	movement_count smallint,
    	movement_name character varying(255),
    	movement_number smallint,
    	size bigint,
    	jooki_id character varying(255),
    	spotify_album_artist_id character varying(255),
    	spotify_album_id character varying(255),
    	spotify_artist_id character varying(255),
    	spotify_track_id character varying(255),
    	owner_id bigint
	)`,
	`CREATE INDEX track_album_artist_idx ON track (sort_album_artist)`,
	`CREATE INDEX track_album_idx ON track (sort_album)`,
	`CREATE INDEX track_artist_idx ON track (sort_artist)`,
	`CREATE TABLE playlist (
		id bigint NOT NULL PRIMARY KEY,
    	parent_id bigint,
    	kind integer,
    	folder boolean,
    	name character varying(255),
    	smart bytea,
    	genius_track_id bigint,
    	sort_field character varying(126),
    	jooki_id character varying(255),
    	date_added timestamp with time zone,
    	date_modified timestamp with time zone,
    	owner_id bigint,
    	shared boolean
	)`,
	`CREATE TABLE playlist_track (
		playlist_id bigint NOT NULL,
    	track_id bigint NOT NULL,
    	"position" integer NOT NULL
	)`,
	`CREATE INDEX playlist_track_plidx ON playlist_track (playlist_id)`,
}
