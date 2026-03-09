package accounting

import (
	"aiworld/backend/pkg/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
)

// AccountingRecord represents a single transaction entry in the accounting system.
// It can be either an income or an expense.
type AccountingRecord struct {
	ID          int64   `json:"id"`
	Type        string  `json:"type"`        // "income" or "expense"
	Amount      float64 `json:"amount"`      // The monetary value
	Category    string  `json:"category"`    // e.g., "Food", "Salary"
	Description string  `json:"description"` // Optional note
	Date        string  `json:"date"`        // YYYY-MM-DD format
}

var (
	records     []AccountingRecord
	recordsLock sync.Mutex     // Protects concurrent access to records slice
	nextID      int64      = 1 // Auto-incrementing ID counter
)

// LoadRecords reads accounting data from the JSON file into memory.
// It is typically called when the application starts.
func LoadRecords() error {
	recordsLock.Lock()
	defer recordsLock.Unlock()

	data, err := os.ReadFile(utils.GetDataFilePath("accounting_data.json"))
	if err != nil {
		if os.IsNotExist(err) {
			// It's okay if file doesn't exist yet, we'll create it on save
			return nil
		}
		return err
	}

	var savedData struct {
		Records []AccountingRecord `json:"records"`
		NextID  int64              `json:"next_id"`
	}

	if err := json.Unmarshal(data, &savedData); err != nil {
		return err
	}

	records = savedData.Records
	nextID = savedData.NextID

	// Ensure nextID is valid if file was manually edited or corrupted
	if nextID == 0 {
		nextID = 1
		for _, r := range records {
			if r.ID >= nextID {
				nextID = r.ID + 1
			}
		}
	}

	return nil
}

// saveRecords writes the current in-memory records to the JSON file.
// It should be called whenever records are modified.
func saveRecords() error {
	recordsLock.Lock()
	defer recordsLock.Unlock()

	savedData := struct {
		Records []AccountingRecord `json:"records"`
		NextID  int64              `json:"next_id"`
	}{
		Records: records,
		NextID:  nextID,
	}

	data, err := json.MarshalIndent(savedData, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(utils.GetDataFilePath("accounting_data.json"), data, 0644)
}

// GetAccountingRecords handles GET requests to retrieve all transaction records.
func GetAccountingRecords(c *gin.Context) {
	recordsLock.Lock()
	defer recordsLock.Unlock()
	c.JSON(http.StatusOK, records)
}

// AddAccountingRecord handles POST requests to create a new transaction record.
func AddAccountingRecord(c *gin.Context) {
	var record AccountingRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	recordsLock.Lock()
	record.ID = nextID
	nextID++
	records = append(records, record)
	recordsLock.Unlock()

	if err := saveRecords(); err != nil {
		fmt.Printf("Error saving records: %v\n", err)
	}

	c.JSON(http.StatusCreated, record)
}

// DeleteAccountingRecord handles DELETE requests to remove a record by ID.
func DeleteAccountingRecord(c *gin.Context) {
	id := c.Param("id")
	var recordID int64
	_, err := fmt.Sscanf(id, "%d", &recordID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	recordsLock.Lock()
	found := false
	for i, r := range records {
		if r.ID == recordID {
			records = append(records[:i], records[i+1:]...)
			found = true
			break
		}
	}
	recordsLock.Unlock()

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}

	if err := saveRecords(); err != nil {
		fmt.Printf("Error saving records: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "record deleted"})
}

// RegisterRoutes sets up the API endpoints for the accounting service.
func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/accounting/records", GetAccountingRecords)
	r.POST("/api/accounting/records", AddAccountingRecord)
	r.DELETE("/api/accounting/records/:id", DeleteAccountingRecord)
}
