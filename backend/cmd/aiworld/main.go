package main

import (
	"aiworld/backend/pkg/database"
	"aiworld/backend/services/accounting"
	"aiworld/backend/services/chat"
	"aiworld/backend/services/notes"
	"aiworld/backend/services/snake"
	"aiworld/backend/services/tetris"
	"aiworld/backend/services/shooter"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("🤖 AI World is starting...")

	database.InitDB()

	accounting.Init()
	snake.Init()
	chat.Init()
	notes.Init()
	tetris.Init()
	shooter.Init()

	r := gin.Default()

	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
			"status":  "ok",
		})
	})

	r.GET("/api/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Hello from AI World!",
			"version": "0.7.0",
		})
	})

	accounting.RegisterRoutes(r)
	snake.RegisterRoutes(r)
	chat.RegisterRoutes(r)
	notes.RegisterRoutes(r)
	tetris.RegisterRoutes(r)
	shooter.RegisterRoutes(r)

	frontendPath := getFrontendPath()
	log.Printf("Serving frontend from: %s", frontendPath)
	r.NoRoute(func(c *gin.Context) {
		http.FileServer(http.Dir(frontendPath)).ServeHTTP(c.Writer, c.Request)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 AI World server is running on http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func getFrontendPath() string {
	wd, err := os.Getwd()
	if err != nil {
		log.Println("Warning: Could not get working directory, using default frontend path")
		return "./frontend/public"
	}

	path := filepath.Join(wd, "frontend", "public")
	if _, err := os.Stat(path); err == nil {
		return path
	}

	path = filepath.Join(wd, "..", "..", "frontend", "public")
	if _, err := os.Stat(path); err == nil {
		return path
	}

	log.Println("Warning: Could not find frontend directory, using relative path")
	return "./frontend/public"
}
