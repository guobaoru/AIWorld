package accounting

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/gin-gonic/gin"
)

type AccountingRecord struct {
	ID          int64   `json:"id"`
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Date        string  `json:"date"`
}

var (
	records     []AccountingRecord
	recordsLock sync.Mutex
	nextID      int64 = 1
)

func getProjectRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(filename), "../../..")
}

func getDataFilePath() string {
	return filepath.Join(getProjectRoot(), "accounting_data.json")
}

func LoadRecords() error {
	recordsLock.Lock()
	defer recordsLock.Unlock()

	data, err := os.ReadFile(getDataFilePath())
	if err != nil {
		if os.IsNotExist(err) {
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

	return os.WriteFile(getDataFilePath(), data, 0644)
}

func GetAccountingRecords(c *gin.Context) {
	recordsLock.Lock()
	defer recordsLock.Unlock()
	c.JSON(http.StatusOK, records)
}

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

func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/accounting/records", GetAccountingRecords)
	r.POST("/api/accounting/records", AddAccountingRecord)
	r.DELETE("/api/accounting/records/:id", DeleteAccountingRecord)
}
