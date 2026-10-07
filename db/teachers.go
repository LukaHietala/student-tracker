package db

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/go-chi/jwtauth/v5"
	"github.com/lestrrat-go/jwx/v3/jwt"
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
		SET name = ?,
			password_hash = ?
		WHERE id = ?
    `

	var hash string
	var err error
	if teacher.PasswordPlain == "" {
		hash = teacher.PasswordHash
	} else {
		hash, err = hashPassword(teacher.PasswordPlain)
	}
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx, query, teacher.Name, hash, id)

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

func (s *Store) TeacherCount() (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM teachers").Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (s *Store) VerifyTeacher(name, password string) (int, error) {
	teacher := new(Teacher)
	row := s.db.QueryRow("SELECT id, name, password_hash FROM teachers WHERE name = ?", name)
	err := row.Scan(&teacher.ID, &teacher.Name, &teacher.PasswordHash)

	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("no user found with the name of: %s", name)
		}
		return 0, err
	}

	if verifyHash(password, teacher.PasswordHash) {
		return teacher.ID, nil
	} else {
		return 0, fmt.Errorf("wrong password")
	}
}

func (s *Store) GetSelf(ctx context.Context) (*Teacher, error) {
	token, claims, _ := jwtauth.FromContext(ctx)

	if token == nil || jwt.Validate(token) != nil {
		return nil, fmt.Errorf("unable to validate teacher token")
	}
	teacherIDFloat, ok := claims["teacher_id"].(float64)
	if !ok {
		return nil, fmt.Errorf("unable to convert teacher_id to float")
	}

	query := `
		SELECT id, name
		FROM teachers
		WHERE id = ?
		LIMIT 1
	`

	t := new(Teacher)
	err := s.db.QueryRowContext(ctx, query, int(teacherIDFloat)).Scan(&t.ID, &t.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return t, nil
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func verifyHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
