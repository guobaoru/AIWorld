package snake

import (
	"aiworld/backend/pkg/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SnakeScore represents a player's score record in the leaderboard.
type SnakeScore struct {
	gorm.Model
	Name  string `json:"name" binding:"required"`  // Player's display name
	Score int    `json:"score" binding:"required"` // The score achieved
	Date  string `json:"date"`                     // Timestamp of the record
}

// Init initializes the snake module, including database migration.
func Init() {
	database.GetDB().AutoMigrate(&SnakeScore{})
}

// GetLeaderboard handles the GET request to retrieve top scores.
func GetLeaderboard(c *gin.Context) {
	var scores []SnakeScore
	// Get top 10 scores, ordered by score descending
	if err := database.GetDB().Order("score desc").Limit(10).Find(&scores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}
	c.JSON(http.StatusOK, scores)
}

// SubmitScore handles the POST request to add a new score.
func SubmitScore(c *gin.Context) {
	var newScore SnakeScore
	if err := c.ShouldBindJSON(&newScore); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set the current date if not provided
	if newScore.Date == "" {
		newScore.Date = time.Now().Format("2006-01-02 15:04:05")
	}

	if err := database.GetDB().Create(&newScore).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save score"})
		return
	}

	// Calculate rank
	var rank int64
	database.GetDB().Model(&SnakeScore{}).Where("score > ?", newScore.Score).Count(&rank)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Score submitted successfully",
		"rank":    rank + 1,
	})
}

// RegisterRoutes sets up the API endpoints for the Snake game service.
func RegisterRoutes(r *gin.Engine) {
	snakeGroup := r.Group("/api/snake")
	{
		snakeGroup.GET("/leaderboard", GetLeaderboard)
		snakeGroup.POST("/score", SubmitScore)
	}
}
