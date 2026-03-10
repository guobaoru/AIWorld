const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const highScoreElement = document.getElementById('highScore');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 15;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let player = {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 6,
    color: '#00ff88'
};

let bullets = [];
let enemies = [];
let particles = [];
let stars = [];
let score = 0;
let level = 1;
let lives = 3;
let highScore = localStorage.getItem('shooterHighScore') || 0;
let gameLoop = null;
let isGameRunning = false;
let isPaused = false;
let keys = {};
let lastShot = 0;
let shootCooldown = 150;
let enemySpawnTimer = 0;
let enemySpawnRate = 60;

highScoreElement.textContent = highScore;

function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 1
        });
    }
}

function drawPlayer() {
    ctx.save();
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height - 15);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(1, '#008B5A');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(player.x + 10, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height + 15 + Math.random() * 10);
    ctx.lineTo(player.x + player.width - 10, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        
        const gradient = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#8B0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + enemy.width, enemy.y);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + 15);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
        }
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        return particle.life > 0;
    });
}

function spawnEnemy() {
    enemies.push({
        x: Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH),
        y: -ENEMY_HEIGHT,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        speed: 2 + level * 0.5,
        health: 1
    });
}

function updateEnemies() {
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        return enemy.y < CANVAS_HEIGHT;
    });
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
}

function checkCollisions() {
    bullets = bullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                hit = true;
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6b6b');
                score += 100;
                scoreElement.textContent = score;
                
                if (score > highScore) {
                    highScore = score;
                    highScoreElement.textContent = highScore;
                    localStorage.setItem('shooterHighScore', highScore);
                }
                
                if (score % 1000 === 0) {
                    level++;
                    levelElement.textContent = level;
                    if (enemySpawnRate > 20) {
                        enemySpawnRate -= 5;
                    }
                }
                
                return false;
            }
            return true;
        });
        return !hit;
    });
    
    enemies.forEach(enemy => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ff88');
            lives--;
            livesElement.textContent = lives;
            player.x = CANVAS_WIDTH / 2 - player.width / 2;
            player.y = CANVAS_HEIGHT - player.height - 20;
            enemies = enemies.filter(e => e !== enemy);
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
}

function handleInput() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed);
    }
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.y = Math.min(CANVAS_HEIGHT - player.height, player.y + player.speed);
    }
    if (keys[' ']) {
        const now = Date.now();
        if (now - lastShot > shootCooldown) {
            bullets.push({
                x: player.x + player.width / 2 - BULLET_WIDTH / 2,
                y: player.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                speed: 10
            });
            lastShot = now;
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawStars();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
}

function gameStep() {
    updateStars();
    handleInput();
    updateBullets();
    
    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
    
    updateEnemies();
    updateParticles();
    checkCollisions();
    draw();
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
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    level = 1;
    lives = 3;
    enemySpawnTimer = 0;
    enemySpawnRate = 60;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;
    
    player.x = CANVAS_WIDTH / 2 - player.width / 2;
    player.y = CANVAS_HEIGHT - player.height - 20;
    
    isGameRunning = true;
    isPaused = false;
    gameOverlay.style.display = 'none';
    
    initStars();
    gameLoop = setInterval(gameStep, 1000 / 60);
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
        gameLoop = setInterval(gameStep, 1000 / 60);
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (!isGameRunning && e.key === ' ') {
        startGame();
        return;
    }
    
    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }
    
    e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startBtn.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

initStars();
draw();

const leaderboardModal = document.getElementById('leaderboardModal');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const closeModalBtn = document.querySelector('.close-modal');
const leaderboardList = document.getElementById('leaderboardList');
const submitScoreSection = document.getElementById('submitScoreSection');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const playerNameInput = document.getElementById('playerName');

async function fetchLeaderboard() {
    try {
        const response = await fetch('/api/shooter/leaderboard');
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
                <span style="font-size: 0.75rem; color: #666;">Lv.${item.level || 1}</span>
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

        const response = await fetch('/api/shooter/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                score: score,
                level: level
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
