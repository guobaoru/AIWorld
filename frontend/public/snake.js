const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

const gridSize = 20;
const tileCount = 20;

canvas.width = gridSize * tileCount;
canvas.height = gridSize * tileCount;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = 150;
let isGameRunning = false;

highScoreElement.textContent = highScore;

function drawGame() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
            segment.x * gridSize + gridSize / 2,
            segment.y * gridSize + gridSize / 2,
            0,
            segment.x * gridSize + gridSize / 2,
            segment.y * gridSize + gridSize / 2,
            gridSize / 2
        );
        
        if (index === 0) {
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#008B5A');
        } else {
            const alpha = 1 - (index / snake.length) * 0.5;
            gradient.addColorStop(0, `rgba(0, 200, 100, ${alpha})`);
            gradient.addColorStop(1, `rgba(0, 100, 60, ${alpha})`);
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2,
            4
        );
        ctx.fill();

        if (index === 0) {
            ctx.fillStyle = '#000';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            let eye1X, eye1Y, eye2X, eye2Y;
            if (direction.x === 1) {
                eye1X = segment.x * gridSize + gridSize - eyeOffset;
                eye1Y = segment.y * gridSize + eyeOffset;
                eye2X = segment.x * gridSize + gridSize - eyeOffset;
                eye2Y = segment.y * gridSize + gridSize - eyeOffset;
            } else if (direction.x === -1) {
                eye1X = segment.x * gridSize + eyeOffset;
                eye1Y = segment.y * gridSize + eyeOffset;
                eye2X = segment.x * gridSize + eyeOffset;
                eye2Y = segment.y * gridSize + gridSize - eyeOffset;
            } else if (direction.y === 1) {
                eye1X = segment.x * gridSize + eyeOffset;
                eye1Y = segment.y * gridSize + gridSize - eyeOffset;
                eye2X = segment.x * gridSize + gridSize - eyeOffset;
                eye2Y = segment.y * gridSize + gridSize - eyeOffset;
            } else {
                eye1X = segment.x * gridSize + eyeOffset;
                eye1Y = segment.y * gridSize + eyeOffset;
                eye2X = segment.x * gridSize + gridSize - eyeOffset;
                eye2Y = segment.y * gridSize + eyeOffset;
            }
            
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    const foodGradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        0,
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2
    );
    foodGradient.addColorStop(0, '#ff6b6b');
    foodGradient.addColorStop(1, '#8B0000');
    
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = '#3d9970';
    ctx.fillRect(food.x * gridSize + gridSize / 2 - 1, food.y * gridSize + 2, 2, 4);
}

function moveSnake() {
    direction = { ...nextDirection };
    
    if (direction.x === 0 && direction.y === 0) {
        drawGame();
        return;
    }

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        if (gameSpeed > 50) {
            gameSpeed -= 2;
        }

        placeFood();
    } else {
        snake.pop();
    }

    drawGame();
}

function placeFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    overlayTitle.textContent = '游戏结束！';
    overlayMessage.textContent = `最终得分：${score}`;
    startBtn.textContent = '重新开始';
    gameOverlay.style.display = 'flex';
}

function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    nextDirection = { x: 0, y: 0 };
    score = 0;
    gameSpeed = 150;
    scoreElement.textContent = score;
    placeFood();
    gameOverlay.style.display = 'none';
    isGameRunning = true;
    
    gameLoop = setInterval(() => {
        moveSnake();
    }, gameSpeed);
}

document.addEventListener('keydown', (e) => {
    if (!isGameRunning && e.key === ' ') {
        startGame();
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y !== 1) {
                nextDirection = { x: 0, y: -1 };
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y !== -1) {
                nextDirection = { x: 0, y: 1 };
            }
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x !== 1) {
                nextDirection = { x: -1, y: 0 };
            }
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x !== -1) {
                nextDirection = { x: 1, y: 0 };
            }
            e.preventDefault();
            break;
    }
});

document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isGameRunning) {
            startGame();
            return;
        }

        const dir = btn.dataset.direction;
        switch (dir) {
            case 'up':
                if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
                break;
            case 'down':
                if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
                break;
            case 'left':
                if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
                break;
            case 'right':
                if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
                break;
        }
    });
});

startBtn.addEventListener('click', startGame);

drawGame();
