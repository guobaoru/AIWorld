package notes

import (
	"aiworld/backend/pkg/database"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Note struct {
	gorm.Model
	Title       string `json:"title"`
	Content     string `json:"content"`
	IsCompleted bool   `json:"is_completed"`
	Priority    int    `json:"priority"` // 0: low, 1: medium, 2: high
	Tags        string `json:"tags"`
	DueDate     string `json:"due_date"`
}

func Init() {
	database.GetDB().AutoMigrate(&Note{})
}

func GetNotes(c *gin.Context) {
	var notes []Note
	if err := database.GetDB().Order("created_at desc").Find(&notes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notes"})
		return
	}
	c.JSON(http.StatusOK, notes)
}

func AddNote(c *gin.Context) {
	var note Note
	if err := c.ShouldBindJSON(&note); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.GetDB().Create(&note).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save note"})
		return
	}

	c.JSON(http.StatusCreated, note)
}

func UpdateNote(c *gin.Context) {
	id := c.Param("id")
	var note Note

	if err := database.GetDB().First(&note, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.GetDB().Model(&note).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update note"})
		return
	}

	c.JSON(http.StatusOK, note)
}

func DeleteNote(c *gin.Context) {
	id := c.Param("id")
	if err := database.GetDB().Delete(&Note{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted"})
}

func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/notes", GetNotes)
	r.POST("/api/notes", AddNote)
	r.PUT("/api/notes/:id", UpdateNote)
	r.DELETE("/api/notes/:id", DeleteNote)
}
