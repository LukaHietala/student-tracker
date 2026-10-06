package services

import (
	"log"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type Config struct {
	JWTSecret string `env:"JWT_SECRET"`
}

func LoadEnv() (Config, error) {
	cfg := Config{}
	err := godotenv.Load()
	if err != nil {
		return Config{}, err
	}

	if err := env.Parse(&cfg); err != nil {
		return Config{}, err
	}

	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET must be set in .env")
	}

	return cfg, nil
}
