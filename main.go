package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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
	dataFile          = "accounting_data.json"
)

func loadRecords() error {
	recordsLock.Lock()
	defer recordsLock.Unlock()

	data, err := os.ReadFile(dataFile)
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

	return os.WriteFile(dataFile, data, 0644)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func Ping(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "pong",
	})
}

func HelloWorld(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		name = "世界"
	}
	c.JSON(200, gin.H{
		"message": "你好，" + name + "，我已连接",
	})
}

func getAccountingRecords(c *gin.Context) {
	recordsLock.Lock()
	defer recordsLock.Unlock()
	c.JSON(http.StatusOK, records)
}

func addAccountingRecord(c *gin.Context) {
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

func deleteAccountingRecord(c *gin.Context) {
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

func main() {
	if err := loadRecords(); err != nil {
		fmt.Printf("Error loading records: %v\n", err)
	}

	r := gin.Default()

	r.Use(corsMiddleware())

	r.GET("/ping", Ping)
	r.GET("/helloWorld", HelloWorld)

	r.GET("/api/accounting/records", getAccountingRecords)
	r.POST("/api/accounting/records", addAccountingRecord)
	r.DELETE("/api/accounting/records/:id", deleteAccountingRecord)

	r.NoRoute(func(c *gin.Context) {
		c.File("./frontend/public" + c.Request.URL.Path)
	})

	fmt.Println("Server starting on :8080")
	r.Run(":8080")
}
