package tetris

import (
	"aiworld/backend/pkg/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TetrisScore struct {
	gorm.Model
	Name  string `json:"name" binding:"required"`
	Score int    `json:"score" binding:"required"`
	Level int    `json:"level"`
	Lines int    `json:"lines"`
	Date  string `json:"date"`
}

func Init() {
	database.GetDB().AutoMigrate(&TetrisScore{})
}

func GetLeaderboard(c *gin.Context) {
	var scores []TetrisScore
	if err := database.GetDB().Order("score desc").Limit(10).Find(&scores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}
	c.JSON(http.StatusOK, scores)
}

func SubmitScore(c *gin.Context) {
	var newScore TetrisScore
	if err := c.ShouldBindJSON(&newScore); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if newScore.Date == "" {
		newScore.Date = time.Now().Format("2006-01-02 15:04:05")
	}

	if err := database.GetDB().Create(&newScore).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save score"})
		return
	}

	var rank int64
	database.GetDB().Model(&TetrisScore{}).Where("score > ?", newScore.Score).Count(&rank)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Score submitted successfully",
		"rank":    rank + 1,
	})
}

func RegisterRoutes(r *gin.Engine) {
	tetrisGroup := r.Group("/api/tetris")
	{
		tetrisGroup.GET("/leaderboard", GetLeaderboard)
		tetrisGroup.POST("/score", SubmitScore)
	}
}
