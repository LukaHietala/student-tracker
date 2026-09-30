package db

import (
	"context"
	"database/sql"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func (s *Store) AddTeacher(ctx context.Context, teacher *Teacher) error {
	query := `
        INSERT INTO teachers (name, password_hash)
        VALUES (?,?)
    `

	hash, err := hashPassword(teacher.PasswordPlain)
	if err != nil {
		return err
	}

	res, err := s.db.ExecContext(ctx, query, teacher.Name, hash)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	teacher.ID = int(id)

	return nil
}

func (s *Store) ListTeachers(ctx context.Context) ([]*Teacher, error) {
	query := `
		SELECT id, name
		FROM teachers
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	teachers := make([]*Teacher, 0)
	for rows.Next() {
		t := &Teacher{}
		err := rows.Scan(
			&t.ID, &t.Name,
		)
		if err != nil {
			return nil, err
		}

		teachers = append(teachers, t)
	}

	return teachers, rows.Err()
}

func (s *Store) FindTeacherByID(ctx context.Context, id int) (*Teacher, error) {
	query := `
		SELECT id, name
		FROM teachers
		WHERE id = ? LIMIT 1
	`

	var teacher Teacher
	err := s.db.QueryRowContext(ctx, query, id).Scan(&teacher.ID, &teacher.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no teacher found based on id: %d", id)
		}
		return nil, err
	}

	return &teacher, nil
}

func (s *Store) UpdateTeacher(ctx context.Context, id int, teacher *Teacher) error {
	query := `
		UPDATE teachers
		SET name = ?
		WHERE id = ?
    `
	_, err := s.db.ExecContext(ctx, query, teacher.Name, id)

	if err != nil {
		return err
	}

	teacher.ID = id

	return nil
}

func (s *Store) DeleteTeacherByID(ctx context.Context, id int) error {
	query := `
		DELETE FROM teachers
		WHERE id = ?
	`

	_, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	return nil
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

/*func verifyHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}*/
