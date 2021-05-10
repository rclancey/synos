package musicdb

import (
	"database/sql"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
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
	if err == nil || err == sql.ErrNoRows {
		return err
	}
	f := "can't scan into ("
	args := make([]string, len(dest))
	for i := range dest {
		args[i] = "%T"
	}
	f += strings.Join(args, ", ") + ")"
	return errors.Wrapf(err, f, dest...)
}

func (r *Row) StructScan(dest interface{}) error {
	err := r.row.StructScan(dest)
	if err == nil || err == sql.ErrNoRows {
		return err
	}
	return errors.Wrapf(err, "can't scan into %T struct", dest)
}

type Stmt struct {
	qs string
	stmt *sqlx.Stmt
}

func (s *Stmt) Query(args ...interface{}) (*sqlx.Rows, error) {
	rows, err := s.stmt.Queryx(args...)
	return rows, errors.Wrap(err, "can't stmt query " + s.qs)
}

func (s *Stmt) QueryRow(args ...interface{}) *Row {
	return &Row{
		qs: s.qs,
		row: s.stmt.QueryRowx(args...),
	}
}

func (s *Stmt) Exec(args ...interface{}) (sql.Result, error) {
	res, err := s.stmt.Exec(args...)
	return res, errors.Wrap(err, "can't stmt exec " + s.qs)
}

type Tx struct {
	tx *sqlx.Tx
}

func (tx *Tx) Query(qs string, args ...interface{}) (*sqlx.Rows, error) {
	qs = queryfix(qs)
	rows, err := tx.tx.Queryx(qs, args...)
	return rows, errors.Wrap(err, "can't tx query " + qs)
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
		return nil, errors.Wrap(err, "can't tx prepare " + qs)
	}
	return &Stmt{qs: qs, stmt: st}, nil
}

func (tx *Tx) Exec(qs string, args ...interface{}) (sql.Result, error) {
	qs = queryfix(qs)
	res, err := tx.tx.Exec(qs, args...)
	return res, errors.Wrap(err, "can't tx exec query " + qs)
}

func (tx *Tx) Commit() error {
	return errors.Wrap(tx.tx.Commit(), "can't commit transaction")
}

func (tx *Tx) Rollback() error {
	return errors.Wrap(tx.tx.Rollback(), "can't roll back transaction")
}

func (db *DB) Begin() (*Tx, error) {
	tx, err := db.conn.Beginx()
	if err != nil {
		return nil, errors.Wrap(err, "can't create transaction")
	}
	return &Tx{tx: tx}, nil
}

func (db *DB) Prepare(qs string) (*Stmt, error) {
	qs = queryfix(qs)
	st, err := db.conn.Preparex(qs)
	if err != nil {
		return nil, errors.Wrap(err, "can't db prepare " + qs)
	}
	return &Stmt{qs: qs, stmt: st}, nil
}

func (db *DB) Query(qs string, args ...interface{}) (*sqlx.Rows, error) {
	qs = queryfix(qs)
	rows, err := db.conn.Queryx(qs, args...)
	return rows, errors.Wrap(err, "can't db query " + qs)
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
	return res, errors.Wrap(err, "can't exec db query " + qs)
}


