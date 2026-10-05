package db

import (
	"context"
)

func (s *Store) NewScan(ctx context.Context, scan *Scan) error {
	query := `INSERT INTO scans (uid, new_status, timestamp, student_id, group_id) VALUES (?,?,?,?,?)`

	res, err := s.db.ExecContext(ctx, query, scan.UID, scan.NewStatus, scan.Timestamp, scan.StudentID, scan.GroupID)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	scan.ID = int(id)
	return nil
}

func (s *Store) ListScans(ctx context.Context) ([]*Scan, error) {
	query := `SELECT id, uid, new_status, timestamp, student_id, group_id FROM scans`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	scans := make([]*Scan, 0)
	for rows.Next() {
		sc := &Scan{}
		err := rows.Scan(&sc.ID, &sc.UID, &sc.NewStatus, &sc.Timestamp, &sc.StudentID, &sc.GroupID)
		if err != nil {
			return nil, err
		}
		scans = append(scans, sc)
	}

	return scans, rows.Err()
}

func (s *Store) ListScansByStudentID(ctx context.Context, id int) ([]*Scan, error) {
	query := `
		SELECT id, uid, new_status, timestamp, student_id, group_id
		FROM scans
		WHERE student_id = ?
	`

	rows, err := s.db.QueryContext(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	scans := make([]*Scan, 0)
	for rows.Next() {
		sc := &Scan{}
		err := rows.Scan(&sc.ID, &sc.UID, &sc.NewStatus, &sc.Timestamp, &sc.StudentID, &sc.GroupID)
		if err != nil {
			return nil, err
		}
		scans = append(scans, sc)
	}

	return scans, rows.Err()
}
