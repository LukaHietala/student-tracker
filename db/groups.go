package db

import (
	"context"
	"database/sql"
	"fmt"
)

func (s *Store) AddGroup(ctx context.Context, group *Group) error {
	query := `
        INSERT INTO groups (name)
        VALUES (?)
    `
	res, err := s.db.ExecContext(ctx, query, group.Name)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	group.ID = int(id)

	return nil
}

func (s *Store) ListGroups(ctx context.Context, archived bool) ([]*Group, error) {
	query := `
		SELECT id, name, is_archived, created_at 
		FROM groups
	`

	if !archived {
		query += `WHERE is_archived = FALSE`
	} else {
		query += `WHERE is_archived = TRUE`
	}

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groups := make([]*Group, 0)
	for rows.Next() {
		g := &Group{}
		err := rows.Scan(
			&g.ID, &g.Name, &g.IsArchived, &g.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		groups = append(groups, g)
	}

	return groups, rows.Err()
}

func (s *Store) FindGroupByID(ctx context.Context, id int) (*Group, error) {
	query := `
		SELECT id, name, is_archived, created_at
		FROM groups
		WHERE id = ? LIMIT 1
	`

	var group Group
	err := s.db.QueryRowContext(ctx, query, id).Scan(&group.ID, &group.Name, &group.IsArchived, &group.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no group found based on id: %d", id)
		}
		return nil, err
	}

	return &group, nil
}

func (s *Store) UpdateGroup(ctx context.Context, id int, group *Group) error {
	query := `
		UPDATE groups
		SET name = ?
		WHERE id = ?
    `
	_, err := s.db.ExecContext(ctx, query, group.Name, id)

	if err != nil {
		return err
	}

	group.ID = id

	return nil
}

func (s *Store) ArchiveGroupByID(ctx context.Context, id int) error {
	query := `
		UPDATE groups
		SET is_archived = TRUE
		WHERE id = ?
	`

	_, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	return nil
}

func (s *Store) UnarchiveGroupByID(ctx context.Context, id int) error {
	query := `
		UPDATE groups
		SET is_archived = FALSE
		WHERE id = ?
	`

	_, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	return nil
}

// Should be avoided, deletes all student associated with the group
func (s *Store) DeleteGroupByID(ctx context.Context, id int) error {
	query := `
		DELETE FROM groups
		WHERE id = ?
	`

	_, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	return nil
}

func (s *Store) ListGroupStudents(ctx context.Context, archived bool, groupID int) ([]*Student, error) {
	query := `
		SELECT id, uid, name, status, start_date, end_date, schedule, done_seconds, excluded_days, break_time, is_archived, group_id, created_at 
		FROM students
	`

	if !archived {
		query += `WHERE is_archived = FALSE AND group_id = ?`
	} else {
		query += `WHERE is_archived = TRUE AND group_id = ?`
	}

	rows, err := s.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	students := make([]*Student, 0)
	for rows.Next() {
		st := &Student{}
		err := rows.Scan(
			&st.ID, &st.UID, &st.Name, &st.Status, &st.StartDate,
			&st.EndDate, &st.Schedule, &st.DoneSeconds,
			&st.ExcludedDays, &st.BreakTime, &st.IsArchived, &st.GroupID, &st.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		students = append(students, st)
	}

	for _, s := range students {
		remaining, err := calculateRemainingSeconds(*s)
		if err != nil {
			return nil, err
		}
		s.Remaining = remaining
	}

	return students, rows.Err()
}
