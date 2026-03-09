package database

import (
	"aiworld/backend/pkg/utils"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB initializes the SQLite database connection
func InitDB() {
	var err error
	dbPath := utils.GetDataFilePath("aiworld.db")

	// Ensure the directory exists (though it should be root)
	log.Printf("Connecting to database at: %s", dbPath)

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connection established")
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
