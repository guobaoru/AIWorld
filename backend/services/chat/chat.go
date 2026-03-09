package chat

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity
	},
}

var globalHub *Hub

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func Init() {
	globalHub = NewHub()
	go globalHub.Run()
}

func RegisterRoutes(r *gin.Engine) {
	r.GET("/api/chat/ws", func(c *gin.Context) {
		ServeWs(globalHub, c)
	})
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			msgStr := string(message)

			// Broadcast user message first
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}

			// Trigger AI if mentioned
			if strings.Contains(strings.ToLower(msgStr), "@ai") {
				// Strip @ai from message for better processing
				cleanMsg := strings.TrimSpace(strings.ReplaceAll(strings.ToLower(msgStr), "@ai", ""))
				go h.handleAIMessage(cleanMsg)
			}
		}
	}
}

func (h *Hub) handleAIMessage(msg string) {
	apiKey := os.Getenv("AI_API_KEY")

	// If API Key exists, try to call Gemini (default) or OpenAI
	if apiKey != "" {
		response, err := callGeminiAPI(msg, apiKey)
		if err == nil {
			h.broadcastAIResponse(response)
			return
		}
		log.Printf("LLM API Error: %v, falling back to rule engine", err)
	}

	// Fallback to rule engine
	time.Sleep(1 * time.Second) // Simulate thinking
	response := generateRuleResponse(msg)
	h.broadcastAIResponse(response)
}

func (h *Hub) broadcastAIResponse(text string) {
	formattedMsg := []byte("🤖 AI: " + text)
	for client := range h.clients {
		select {
		case client.send <- formattedMsg:
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}

// Enhanced Rule Engine
func generateRuleResponse(msg string) string {
	msg = strings.ToLower(msg)

	if strings.Contains(msg, "hello") || strings.Contains(msg, "你好") || strings.Contains(msg, "hi") {
		responses := []string{
			"你好呀！我是 AI World 的守护者。",
			"嗨！今天过得怎么样？",
			"你好！有什么我可以帮你的吗？",
		}
		return responses[rand.Intn(len(responses))]
	}

	if strings.Contains(msg, "钱") || strings.Contains(msg, "记账") || strings.Contains(msg, "money") {
		return "谈钱伤感情，但不记账伤钱包哦！去左边的记账应用看看吧。"
	}

	if strings.Contains(msg, "snake") || strings.Contains(msg, "贪吃蛇") || strings.Contains(msg, "game") {
		return "贪吃蛇可是个技术活。听说现在的最高分是人类创造的，你要不要去打破它？"
	}

	if strings.Contains(msg, "who are you") || strings.Contains(msg, "你是谁") {
		return "我是这个 AI World 的数字原住民。虽然我现在还很简单，但我正在进化中！"
	}

	defaultResponses := []string{
		"这个问题有点深奥，我还在学习中...",
		"嗯... 有趣的观点。",
		"你可以试试问我关于记账或者贪吃蛇的问题。",
		"我在听，请继续。",
	}
	return defaultResponses[rand.Intn(len(defaultResponses))]
}

// Call Google Gemini API (Free Tier available)
func callGeminiAPI(prompt, apiKey string) (string, error) {
	url := "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
	}

	jsonBody, _ := json.Marshal(requestBody)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("API returned status: %d, body: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if len(result.Candidates) > 0 && len(result.Candidates[0].Content.Parts) > 0 {
		return result.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("no response text found")
}

// ... Boilerplate WebSocket Code (Client, Pump) ...

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

var newline = []byte{'\n'}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		c.hub.broadcast <- message
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}
