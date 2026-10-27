package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/lukahietala/rfid/internal/api"
	"github.com/lukahietala/rfid/internal/auth"
	"github.com/lukahietala/rfid/internal/db"
	"github.com/lukahietala/rfid/internal/services"
	"github.com/lukahietala/rfid/internal/websockets"
	"github.com/lukahietala/rfid/internal/workers"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	conn, err := db.Connect("student_tracker.db?_journal_mode=WAL&_foreign_keys=on&_busy_timeout=5000")
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer conn.Close()

	store := db.NewStore(conn)
	hub := websockets.NewHub()

	go hub.Run()

	go workers.StartDoneTicker(ctx, store, hub, 10*time.Second)

	cfg, err := services.LoadEnv()
	if err != nil {
		log.Fatal(err)
	}

	authService := auth.New(cfg.JWTSecret, store)
	handler := api.NewHandler(store, authService, hub)

	httpServer := &http.Server{
		Addr:    ":3000",
		Handler: handler,
	}

	go func() {
		log.Printf("listening on %s", httpServer.Addr)
		err := httpServer.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Println(err)
	}
}
