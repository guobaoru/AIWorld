const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const highScoreElement = document.getElementById('highScore');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const COLORS = [
    null,
    '#00f5ff',
    '#0000ff',
    '#ffa500',
    '#ffff00',
    '#00ff00',
    '#800080',
    '#ff0000'
];

const SHAPES = [
    null,
    [[1, 1, 1, 1]],
    [[2, 0, 0], [2, 2, 2]],
    [[0, 0, 3], [3, 3, 3]],
    [[4, 4], [4, 4]],
    [[0, 5, 5], [5, 5, 0]],
    [[0, 6, 0], [6, 6, 6]],
    [[7, 7, 0], [0, 7, 7]]
];

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let highScore = localStorage.getItem('tetrisHighScore') || 0;
let gameLoop = null;
let isGameRunning = false;
let isPaused = false;

highScoreElement.textContent = highScore;

function initBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece(type) {
    const shape = SHAPES[type];
    return {
        shape: shape,
        type: type,
        x: Math.floor((COLS - shape[0].length) / 2),
        y: 0
    };
}

function newPiece() {
    currentPiece = nextPiece || createPiece(Math.floor(Math.random() * 7) + 1);
    nextPiece = createPiece(Math.floor(Math.random() * 7) + 1);
    drawNextPiece();
    
    if (checkCollision(currentPiece, currentPiece.x, currentPiece.y)) {
        gameOver();
    }
}

function drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
    const gradient = ctx.createLinearGradient(x * size, y * size, (x + 1) * size, (y + 1) * size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, shadeColor(color, -30));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    
    ctx.strokeStyle = shadeColor(color, -50);
    ctx.lineWidth = 2;
    ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

function drawBoard() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let j = 0; j <= COLS; j++) {
        ctx.beginPath();
        ctx.moveTo(j * BLOCK_SIZE, 0);
        ctx.lineTo(j * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, COLORS[board[y][x]]);
            }
        }
    }
}

function drawPiece() {
    if (!currentPiece) return;
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, COLORS[currentPiece.shape[y][x]]);
            }
        }
    }
}

function drawNextPiece() {
    nextPieceCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (!nextPiece) return;
    
    const size = 30;
    const offsetX = (nextPieceCanvas.width - nextPiece.shape[0].length * size) / 2;
    const offsetY = (nextPieceCanvas.height - nextPiece.shape.length * size) / 2;
    
    nextPieceCtx.save();
    nextPieceCtx.translate(offsetX, offsetY);
    
    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            if (nextPiece.shape[y][x]) {
                const gradient = nextPieceCtx.createLinearGradient(x * size, y * size, (x + 1) * size, (y + 1) * size);
                gradient.addColorStop(0, COLORS[nextPiece.shape[y][x]]);
                gradient.addColorStop(1, shadeColor(COLORS[nextPiece.shape[y][x]], -30));
                
                nextPieceCtx.fillStyle = gradient;
                nextPieceCtx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
                
                nextPieceCtx.strokeStyle = shadeColor(COLORS[nextPiece.shape[y][x]], -50);
                nextPieceCtx.lineWidth = 2;
                nextPieceCtx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
            }
        }
    }
    
    nextPieceCtx.restore();
}

function checkCollision(piece, newX, newY) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = newX + x;
                const boardY = newY + y;
                
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }
                
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function rotatePiece() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const originalShape = currentPiece.shape;
    currentPiece.shape = rotated;
    
    if (checkCollision(currentPiece, currentPiece.x, currentPiece.y)) {
        currentPiece.shape = originalShape;
    }
}

function movePiece(dx, dy) {
    if (!checkCollision(currentPiece, currentPiece.x + dx, currentPiece.y + dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

function lockPiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                if (currentPiece.y + y < 0) {
                    gameOver();
                    return;
                }
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.shape[y][x];
            }
        }
    }
    
    clearLines();
    newPiece();
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
        
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('tetrisHighScore', highScore);
        }
        
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, Math.max(100, 500 - (level - 1) * 50));
    }
}

function hardDrop() {
    while (movePiece(0, 1)) {}
    lockPiece();
}

function gameStep() {
    if (!movePiece(0, 1)) {
        lockPiece();
    }
    draw();
}

function draw() {
    drawBoard();
    drawPiece();
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    overlayTitle.textContent = '游戏结束！';
    overlayMessage.textContent = `最终得分：${score}`;
    startBtn.textContent = '重新开始';
    gameOverlay.style.display = 'flex';
    
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
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    isGameRunning = true;
    isPaused = false;
    gameOverlay.style.display = 'none';
    
    newPiece();
    draw();
    gameLoop = setInterval(gameStep, 500);
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        overlayTitle.textContent = '暂停';
        overlayMessage.textContent = '按 P 继续游戏';
        startBtn.textContent = '继续';
        gameOverlay.style.display = 'flex';
    } else {
        gameOverlay.style.display = 'none';
        gameLoop = setInterval(gameStep, Math.max(100, 500 - (level - 1) * 50));
    }
}

document.addEventListener('keydown', (e) => {
    if (!isGameRunning && e.key === ' ') {
        startGame();
        return;
    }
    
    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }
    
    if (!isGameRunning || isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            hardDrop();
            break;
    }
    
    e.preventDefault();
    draw();
});

startBtn.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

initBoard();
drawBoard();
drawNextPiece();

const leaderboardModal = document.getElementById('leaderboardModal');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const closeModalBtn = document.querySelector('.close-modal');
const leaderboardList = document.getElementById('leaderboardList');
const submitScoreSection = document.getElementById('submitScoreSection');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const playerNameInput = document.getElementById('playerName');

async function fetchLeaderboard() {
    try {
        const response = await fetch('/api/tetris/leaderboard');
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

        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = item.name || 'Anonymous';

        li.innerHTML = `
            <div class="rank-name">
                ${rankDisplay}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
                <span class="player-score">${item.score}</span>
                <span style="font-size: 0.75rem; color: #666;">Lv.${item.level || 1} · ${item.lines || 0}行</span>
            </div>
        `;
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

        const response = await fetch('/api/tetris/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                score: score,
                level: level,
                lines: lines
            })
        });

        if (!response.ok) throw new Error('Failed to submit score');
        
        const result = await response.json();
        
        await fetchLeaderboard();
        
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

viewLeaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.add('show');
    submitScoreSection.style.display = 'none';
    fetchLeaderboard();
});

closeModalBtn.addEventListener('click', () => {
    leaderboardModal.classList.remove('show');
});

leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
        leaderboardModal.classList.remove('show');
    }
});

submitScoreBtn.addEventListener('click', submitScore);

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitScore();
    }
});
