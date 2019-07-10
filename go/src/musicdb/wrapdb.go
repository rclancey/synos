package musicdb

import (
	"database/sql"
	"log"

	"github.com/jmoiron/sqlx"
)

var bindType = sqlx.BindType("postgres")

func queryfix(qs string) string {
	return sqlx.Rebind(bindType, qs)
}

type Row struct {
	qs string
	row *sqlx.Row
}

func (r *Row) Scan(dest ...interface{}) error {
	err := r.row.Scan(dest...)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("error %s scanning %s", err.Error(), r.qs)
	}
	return err
}

func (r *Row) StructScan(dest interface{}) error {
	err := r.row.StructScan(dest)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("error % scanning struct %s", err.Error(), r.qs)
	}
	return err
}

type Stmt struct {
	qs string
	stmt *sqlx.Stmt
}

func (s *Stmt) Query(args ...interface{}) (*sqlx.Rows, error) {
	rows, err := s.stmt.Queryx(args...)
	if err != nil {
		log.Printf("error %s in stmt query %s", err.Error(), s.qs)
	}
	return rows, err
}

func (s *Stmt) QueryRow(args ...interface{}) *Row {
	return &Row{
		qs: s.qs,
		row: s.stmt.QueryRowx(args...),
	}
}

func (s *Stmt) Exec(args ...interface{}) (sql.Result, error) {
	res, err := s.stmt.Exec(args...)
	if err != nil {
		log.Printf("error %s in stmt exec %s", err.Error, s.qs)
	}
	return res, err
}

type Tx struct {
	tx *sqlx.Tx
}

func (tx *Tx) Query(qs string, args ...interface{}) (*sqlx.Rows, error) {
	qs = queryfix(qs)
	rows, err := tx.tx.Queryx(qs, args...)
	if err != nil {
		log.Printf("error %s in tx query %s", err.Error(), qs)
	}
	return rows, err
}

func (tx *Tx) QueryRow(qs string, args ...interface{}) *Row {
	qs = queryfix(qs)
	return &Row{
		qs: qs,
		row: tx.tx.QueryRowx(qs, args...),
	}
}

func (tx *Tx) Prepare(qs string) (*Stmt, error) {
	qs = queryfix(qs)
	st, err := tx.tx.Preparex(qs)
	if err != nil {
		log.Printf("error %s in tx prepare %s", err.Error(), qs)
		return nil, err
	}
	return &Stmt{qs: qs, stmt: st}, nil
}

func (tx *Tx) Exec(qs string, args ...interface{}) (sql.Result, error) {
	qs = queryfix(qs)
	res, err := tx.tx.Exec(qs, args...)
	if err != nil {
		log.Printf("error %s in tx exec %s", err.Error(), qs)
	}
	return res, err
}

func (tx *Tx) Commit() error {
	return tx.tx.Commit()
}

func (tx *Tx) Rollback() error {
	return tx.tx.Rollback()
}

func (db *DB) Begin() (*Tx, error) {
	tx, err := db.conn.Beginx()
	if err != nil {
		return nil, err
	}
	return &Tx{tx: tx}, nil
}

func (db *DB) Prepare(qs string) (*Stmt, error) {
	qs = queryfix(qs)
	st, err := db.conn.Preparex(qs)
	if err != nil {
		log.Printf("error %s in db prepare %s", err.Error(), qs)
		return nil, err
	}
	return &Stmt{qs: qs, stmt: st}, nil
}

func (db *DB) Query(qs string, args ...interface{}) (*sqlx.Rows, error) {
	qs = queryfix(qs)
	rows, err := db.conn.Queryx(qs, args...)
	if err != nil {
		log.Printf("error %s in db query %s", err.Error(), qs)
	}
	return rows, err
}

func (db *DB) QueryRow(qs string, args ...interface{}) *Row {
	qs = queryfix(qs)
	return &Row{
		qs: qs,
		row: db.conn.QueryRowx(qs, args...),
	}
}

func (db *DB) Exec(qs string, args...interface{}) (sql.Result, error) {
	qs = queryfix(qs)
	res, err := db.conn.Exec(qs, args...)
	if err != nil {
		log.Printf("error %s in db exec %s", err.Error(), qs)
	}
	return res, err
}


