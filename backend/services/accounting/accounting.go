package accounting

import (
	"aiworld/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AccountingRecord represents a single transaction entry in the accounting system.
// It uses GORM model for database mapping.
type AccountingRecord struct {
	gorm.Model
	Type        string  `json:"type"`        // "income" or "expense"
	Amount      float64 `json:"amount"`      // The monetary value
	Category    string  `json:"category"`    // e.g., "Food", "Salary"
	Description string  `json:"description"` // Optional note
	Date        string  `json:"date"`        // YYYY-MM-DD format
}

// Init initializes the accounting module, including database migration.
func Init() {
	database.GetDB().AutoMigrate(&AccountingRecord{})
}

// GetAccountingRecords handles GET requests to retrieve all transaction records.
func GetAccountingRecords(c *gin.Context) {
	var records []AccountingRecord
	// Order by date descending by default
	if err := database.GetDB().Order("date desc").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch records"})
		return
	}
	c.JSON(http.StatusOK, records)
}

// AddAccountingRecord handles POST requests to create a new transaction record.
func AddAccountingRecord(c *gin.Context) {
	var record AccountingRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.GetDB().Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save record"})
		return
	}

	c.JSON(http.StatusCreated, record)
}

// DeleteAccountingRecord handles DELETE requests to remove a record by ID.
func DeleteAccountingRecord(c *gin.Context) {
	id := c.Param("id")
	// Unscoped() allows permanent deletion, or remove it for soft delete
	if err := database.GetDB().Delete(&AccountingRecord{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "record deleted"})
}

// RegisterRoutes sets up the API endpoints for the accounting service.
func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/accounting/records", GetAccountingRecords)
	r.POST("/api/accounting/records", AddAccountingRecord)
	r.DELETE("/api/accounting/records/:id", DeleteAccountingRecord)
}
