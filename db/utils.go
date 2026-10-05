package db

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

func RandomGarbageUID(n int) (string, error) {
	if n != 7 && n != 4 {
		return "", fmt.Errorf("uid len can be either 4 or 7, not %d", n)
	}
	buf := make([]byte, n)
	_, err := rand.Read(buf)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
