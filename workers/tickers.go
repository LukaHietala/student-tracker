package workers

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net"
	"time"

	"github.com/lukahietala/rfid/db"
	"github.com/lukahietala/rfid/websockets"
)

const (
	ackPing = 0xAA
	ackPong = 0xBB
)

func StartDoneTicker(ctx context.Context, store *db.Store, hub *websockets.Hub, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Only increments if status is IN and end_date has not passed
			if err := store.IncrementDoneSeconds(ctx, int(interval.Seconds())); err != nil {
				log.Println("failed to increment done_seconds:", err)
				continue
			}

			students, err := store.ListStudents(ctx, false)
			if err != nil {
				log.Println("error listing students:", err)
				continue
			}

			bytes, err := json.Marshal(students)
			if err != nil {
				log.Println("error marshaling students:", err)
				continue
			}

			hub.Broadcast(websockets.Event{
				Event:   "students:update",
				Payload: bytes,
			})
		}
	}
}

func StartDevicePingTicker(ctx context.Context, store *db.Store, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			devices, err := store.ListDevices(ctx)
			if err != nil {
				log.Println("error listing devices:", err)
				return
			}

			for _, dev := range devices {
				addr := dev.IPv4Addr + ":8080"
				conn, err := net.DialTimeout("tcp", addr, 2*time.Second)

				if err == nil {
					conn.Write([]byte{ackPing})

					var ack [1]byte
					if _, err := io.ReadFull(conn, ack[:]); err != nil {
						dev.Online = false
						log.Println("error reading device ping response:", err)
					}

					if ack[0] == ackPong {
						dev.Online = true
					} else {
						dev.Online = false
					}
				} else {
					dev.Online = false
				}

				if err := dev.Validate(); err != nil {
					log.Println("error on device ping validation:", err)
					continue
				}

				if err := store.UpdateDevice(ctx, dev.ID, *dev); err != nil {
					log.Println("error on device ping update:", err)
					continue
				}
			}

			// TODO: maybe ws event
		}
	}
}
