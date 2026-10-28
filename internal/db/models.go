package db

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

// Holds json string arrays
type JSONStringSlice []string

func (j *JSONStringSlice) Scan(value any) error {
	if value == nil {
		*j = JSONStringSlice{}
		return nil
	}

	var b []byte
	switch v := value.(type) {
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return fmt.Errorf("cannot scan %T into JSONStringSlice", value)
	}

	return json.Unmarshal(b, j)
}

func (j JSONStringSlice) Value() (driver.Value, error) {
	if j == nil {
		return "[]", nil
	}
	b, err := json.Marshal(j)
	return string(b), err
}

type TimeRange struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

type Schedule [7]*TimeRange

func (s *Schedule) Scan(value any) error {
	if value == nil {
		*s = Schedule{}
		return nil
	}

	var b []byte
	switch v := value.(type) {
	case []byte:
		b = v
	case string:
		b = []byte(v)
	default:
		return fmt.Errorf("cannot scan %T into Schedule", value)
	}

	return json.Unmarshal(b, s)
}

func (s Schedule) Value() (driver.Value, error) {
	b, err := json.Marshal(s)
	return string(b), err
}

type Device struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	SecretKey string `json:"secretKey"`
}

type Scan struct {
	ID        int    `json:"id"`
	UID       string `json:"uid"` // card uid
	NewStatus string `json:"newStatus"`
	Timestamp string `json:"timestamp"`
	StudentID int    `json:"studentId"`
	GroupID   int    `json:"groupId"`
}

type Student struct {
	ID           int             `json:"id"`
	UID          string          `json:"uid"` // card uid
	Name         string          `json:"name"`
	Status       string          `json:"status"`
	StartDate    string          `json:"startDate"` // time.DateOnly
	EndDate      string          `json:"endDate"`
	Schedule     Schedule        `json:"schedule"`
	DoneSeconds  int             `json:"doneSeconds"`
	ExcludedDays JSONStringSlice `json:"excludedDays"`
	BreakTime    int             `json:"breakTime"` // in seconds
	Remaining    int             `json:"remaining"` // in seconds, dynamically calculated
	IsArchived   bool            `json:"isArchived"`
	GroupID      int             `json:"groupId"`
	CreatedAt    string          `json:"createdAt"`
}

type Group struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type Teacher struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	PasswordPlain string `json:"passwordPlain,omitempty"`
	PasswordHash  string `json:"passwordHash,omitempty"`
}
