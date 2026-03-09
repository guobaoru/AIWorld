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
let isAIMode = false;

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

    // Auto show leaderboard if score > 0
    if (score > 0) {
        setTimeout(() => {
            leaderboardModal.classList.add('show');
            submitScoreSection.style.display = 'block';
            playerNameInput.focus();
            fetchLeaderboard();
        }, 500);
    }
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

// --- Leaderboard Logic ---
const leaderboardModal = document.getElementById('leaderboardModal');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const closeModalBtn = document.querySelector('.close-modal');
const leaderboardList = document.getElementById('leaderboardList');
const submitScoreSection = document.getElementById('submitScoreSection');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const playerNameInput = document.getElementById('playerName');

async function fetchLeaderboard() {
    try {
        const response = await fetch('/api/snake/leaderboard');
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        renderLeaderboard(data);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        leaderboardList.innerHTML = '<li style="text-align:center; padding: 20px; color: #ff4444;">无法加载排行榜</li>';
    }
}

function renderLeaderboard(scores) {
    leaderboardList.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        leaderboardList.innerHTML = '<li style="text-align:center; padding: 20px; color: #888;">暂无记录，快来抢占第一名！</li>';
        return;
    }

    scores.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        
        let rankDisplay = '<span class="rank">' + (index + 1) + '.</span>';
        if (index === 0) rankDisplay = '<span class="rank" style="font-size: 1.2em;">👑</span>';
        else if (index === 1) rankDisplay = '<span class="rank" style="font-size: 1.1em;">🥈</span>';
        else if (index === 2) rankDisplay = '<span class="rank" style="font-size: 1.1em;">🥉</span>';

        // Safe HTML insertion
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = item.name || 'Anonymous';

        li.innerHTML = `
            <div class="rank-name">
                ${rankDisplay}
            </div>
            <span class="player-score">${item.score}</span>
        `;
        // Insert name safely
        li.querySelector('.rank-name').appendChild(nameSpan);
        
        leaderboardList.appendChild(li);
    });
}

async function submitScore() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('请输入你的名字！');
        return;
    }
    
    if (score <= 0) {
        alert('得分为 0 不能提交哦！');
        return;
    }

    try {
        submitScoreBtn.disabled = true;
        submitScoreBtn.textContent = '提交中...';

        const response = await fetch('/api/snake/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                score: score
            })
        });

        if (!response.ok) throw new Error('Failed to submit score');
        
        const result = await response.json();
        
        // Refresh leaderboard
        await fetchLeaderboard();
        
        // Hide input section
        submitScoreSection.style.display = 'none';
        
        alert('提交成功！你目前的排名是：第 ' + result.rank + ' 名');
        
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('提交失败，请检查网络连接');
    } finally {
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = '提交';
    }
}

// Event Listeners for Leaderboard
viewLeaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.add('show');
    submitScoreSection.style.display = 'none'; // Viewing mode
    fetchLeaderboard();
});

closeModalBtn.addEventListener('click', () => {
    leaderboardModal.classList.remove('show');
});

// Close modal when clicking outside
leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
        leaderboardModal.classList.remove('show');
    }
});

submitScoreBtn.addEventListener('click', submitScore);

// Allow Enter key to submit
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitScore();
    }
});

// --- AI Logic ---
const aiDemoBtn = document.getElementById('aiDemoBtn');

aiDemoBtn.addEventListener('click', () => {
    if (isGameRunning) {
        isAIMode = false;
        return;
    }
    startGame();
    isAIMode = true;
    // AI plays slightly faster
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        if (isGameRunning) {
            makeAIDecision();
            moveSnake();
        }
    }, 80);
});

function makeAIDecision() {
    const head = snake[0];
    const possibleMoves = [
        { dir: { x: 0, y: -1 }, oppDir: { x: 0, y: 1 } }, // up
        { dir: { x: 0, y: 1 }, oppDir: { x: 0, y: -1 } }, // down
        { dir: { x: -1, y: 0 }, oppDir: { x: 1, y: 0 } }, // left
        { dir: { x: 1, y: 0 }, oppDir: { x: -1, y: 0 } }  // right
    ];

    let bestMove = null;
    let bestScore = -Infinity;

    // Don't reverse direction immediately
    const safeMoves = possibleMoves.filter(m => !(m.dir.x === -direction.x && m.dir.y === -direction.y));

    for (const move of safeMoves) {
        const nextHead = { x: head.x + move.dir.x, y: head.y + move.dir.y };
        
        if (isSafe(nextHead)) {
            const score = evaluateMove(nextHead);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move.dir;
            }
        }
    }

    if (bestMove) {
        nextDirection = bestMove;
    }
}

function isSafe(pos) {
    // Check walls
    if (pos.x < 0 || pos.x >= tileCount || pos.y < 0 || pos.y >= tileCount) {
        return false;
    }
    // Check self collision
    for (const segment of snake) {
        if (pos.x === segment.x && pos.y === segment.y) {
            return false;
        }
    }
    return true;
}

function evaluateMove(nextHead) {
    let score = 0;
    
    // Distance to food (Manhattan)
    const dist = Math.abs(nextHead.x - food.x) + Math.abs(nextHead.y - food.y);
    score -= dist * 10; // Closer is better
    
    // Prefer spaces with more room (to avoid getting trapped)
    score += countEmptySpaces(nextHead) * 5;
    
    return score;
}

function countEmptySpaces(start) {
    // Simple BFS to count reachable empty spaces
    const visited = new Set();
    const queue = [start];
    let count = 0;

    while (queue.length > 0 && count < 50) {
        const pos = queue.shift();
        const key = `${pos.x},${pos.y}`;
        
        if (visited.has(key)) continue;
        if (pos.x < 0 || pos.x >= tileCount || pos.y < 0 || pos.y >= tileCount) continue;
        
        // Check if collides with snake (except tail which moves)
        let collision = false;
        for (let i = 0; i < snake.length - 1; i++) {
            if (pos.x === snake[i].x && pos.y === snake[i].y) {
                collision = true;
                break;
            }
        }
        if (collision) continue;

        visited.add(key);
        count++;

        queue.push({ x: pos.x + 1, y: pos.y });
        queue.push({ x: pos.x - 1, y: pos.y });
        queue.push({ x: pos.x, y: pos.y + 1 });
        queue.push({ x: pos.x, y: pos.y - 1 });
    }
    return count;
}
