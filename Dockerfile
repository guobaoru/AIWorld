# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o aiworld ./backend/cmd/aiworld

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/aiworld .

# Copy frontend assets
COPY --from=builder /app/frontend ./frontend

# Expose port
EXPOSE 8080

# Run
CMD ["./aiworld"]
