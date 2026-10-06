package db

import (
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

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
	MacAddr   string `json:"mac_addr"`
	SecretKey string `json:"secret_key"`
	IPv4Addr  string `json:"ipv4_addr"`
	Online    bool   `json:"online"`
}

type Scan struct {
	ID        int    `json:"id"`
	UID       string `json:"uid"` // card uid
	NewStatus string `json:"new_status"`
	Timestamp string `json:"timestamp"`
	StudentID int    `json:"student_id"`
	GroupID   int    `json:"group_id"`
}

type Student struct {
	ID           int             `json:"id"`
	UID          string          `json:"uid"` // card uid
	Name         string          `json:"name"`
	Status       string          `json:"status"`
	StartDate    string          `json:"start_date"` // time.DateOnly
	EndDate      string          `json:"end_date"`
	Schedule     Schedule        `json:"schedule"`
	DoneSeconds  int             `json:"done_seconds"`
	ExcludedDays JSONStringSlice `json:"excluded_days"`
	BreakTime    int             `json:"break_time"` // in seconds
	Remaining    int             `json:"remaining"`  // in seconds, dynamically calculated
	IsArchived   bool            `json:"is_archived"`
	GroupID      int             `json:"group_id"`
	CreatedAt    string          `json:"created_at"`
}

type Group struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	IsArchived bool   `json:"is_archived"`
	CreatedAt  string `json:"created_at"`
}

type Teacher struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	PasswordPlain string `json:"password_plain"`
	PasswordHash  string `json:"password_hash,omitempty"`
}

// Validators for api

func (t *Teacher) Validate() error {
	if t == nil {
		return errors.New("invalid teacher")
	}

	if t.Name == "" {
		return errors.New("missing teacher name")
	}

	if len(t.Name) < 1 || len(t.Name) > 255 {
		return errors.New("invalid teacher name length, valid range is 1-255")
	}

	return nil
}

func (g *Group) Validate() error {
	if g == nil {
		return errors.New("invalid group")
	}

	if g.Name == "" {
		return errors.New("missing group name")
	}

	if len(g.Name) < 1 || len(g.Name) > 255 {
		return errors.New("invalid group name length, valid range is 1-255")
	}

	return nil
}

func (d *Device) Validate() error {
	if d == nil {
		return errors.New("invalid device")
	}

	if d.Name == "" {
		return errors.New("missing device name")
	}

	if len(d.Name) < 1 || len(d.Name) > 255 {
		return errors.New("invalid device name length, valid range is 1-255")
	}

	if d.MacAddr == "" {
		return errors.New("missing device mac address")
	}

	if d.IPv4Addr == "" {
		return errors.New("missing device ipv4 address")
	}

	return nil
}

func (s *Student) Validate() error {
	if s == nil {
		return errors.New("invalid student")
	}

	decoded, err := hex.DecodeString(s.UID)
	if err != nil {
		return errors.New("invalid uid format")
	}

	if len(decoded) != 4 && len(decoded) != 7 {
		return errors.New("rfid uid length must be either 4 or 7")
	}

	if len(s.Name) < 1 || len(s.Name) > 255 {
		return errors.New("invalid student name length, valid range is 1-255")
	}

	if s.Status != "IN" && s.Status != "OUT" {
		return errors.New("status must be either IN or OUT")
	}

	start, err := time.Parse(time.DateOnly, s.StartDate)
	if err != nil {
		return errors.New("start day is in invalid format")
	}

	end, err := time.Parse(time.DateOnly, s.EndDate)
	if err != nil {
		return errors.New("end date is in invalid format")
	}

	if !end.After(start) {
		return errors.New("end date must be after start date")
	}

	for weekday, day := range s.Schedule {
		if day == nil {
			continue
		}
		dayStarts, err := time.Parse(time.TimeOnly, day.Start)
		if err != nil {
			return fmt.Errorf("start time is in invalid format at weekday %d", weekday)
		}
		dayEnds, err := time.Parse(time.TimeOnly, day.End)
		if err != nil {
			return fmt.Errorf("end time is in invalid format at weekday %d", weekday)
		}

		if !dayEnds.After(dayStarts) {
			return errors.New("end time must be after start time")
		}
	}

	for _, excluded := range s.ExcludedDays {
		if _, err := time.Parse(time.DateOnly, excluded); err != nil {
			return fmt.Errorf("excluded day: %s is in invalid format", excluded)
		}
	}

	return nil
}
