package snake

import (
	"aiworld/backend/pkg/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// SnakeScore represents a player's score record in the leaderboard.
// It includes the player's name, their score, and the date achieved.
type SnakeScore struct {
	Name  string `json:"name" binding:"required"`  // Player's display name
	Score int    `json:"score" binding:"required"` // The score achieved
	Date  string `json:"date"`                     // Timestamp of the record
}

var (
	scores     []SnakeScore
	scoresLock sync.RWMutex
)

// LoadScores reads the leaderboard data from the JSON file into memory.
// If the file doesn't exist, it initializes an empty leaderboard.
func LoadScores() error {
	scoresLock.Lock()
	defer scoresLock.Unlock()

	filePath := utils.GetDataFilePath("snake_scores.json")
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			scores = []SnakeScore{}
			return nil
		}
		return fmt.Errorf("failed to read scores file: %w", err)
	}

	if len(data) == 0 {
		scores = []SnakeScore{}
		return nil
	}

	if err := json.Unmarshal(data, &scores); err != nil {
		// If JSON is corrupted, start fresh but log the error
		fmt.Printf("Warning: failed to parse snake scores: %v. Starting with empty leaderboard.\n", err)
		scores = []SnakeScore{}
		return nil
	}

	return nil
}

// saveScores writes the current in-memory leaderboard to the JSON file.
// It should be called whenever the scores are modified.
func saveScores() error {
	// Note: Caller must hold the lock
	data, err := json.MarshalIndent(scores, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal scores: %w", err)
	}

	filePath := utils.GetDataFilePath("snake_scores.json")
	return os.WriteFile(filePath, data, 0644)
}

// GetLeaderboard handles the GET request to retrieve top scores.
// It returns the top 10 scores sorted by highest score first.
func GetLeaderboard(c *gin.Context) {
	scoresLock.RLock()
	defer scoresLock.RUnlock()

	// Return top 10 or all if less than 10
	limit := 10
	if len(scores) < limit {
		limit = len(scores)
	}

	c.JSON(http.StatusOK, scores[:limit])
}

// SubmitScore handles the POST request to add a new score.
// It adds the score, re-sorts the leaderboard, and persists the data.
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

	scoresLock.Lock()
	defer scoresLock.Unlock()

	scores = append(scores, newScore)

	// Sort by score in descending order
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	// Keep only top 50 to prevent file from growing too large
	if len(scores) > 50 {
		scores = scores[:50]
	}

	if err := saveScores(); err != nil {
		fmt.Printf("Error saving snake scores: %v\n", err)
		// We still return success to the client as the memory state is updated
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Score submitted successfully",
		"rank":    findRank(newScore.Score),
	})
}

// findRank calculates the rank of a given score in the current leaderboard.
// Note: This function assumes the caller holds the lock and scores are sorted.
func findRank(score int) int {
	for i, s := range scores {
		if s.Score == score {
			return i + 1
		}
	}
	return -1
}

// RegisterRoutes sets up the API endpoints for the Snake game service.
func RegisterRoutes(r *gin.Engine) {
	snakeGroup := r.Group("/api/snake")
	{
		snakeGroup.GET("/leaderboard", GetLeaderboard)
		snakeGroup.POST("/score", SubmitScore)
	}
}
