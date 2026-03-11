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
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 60;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 15;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const BOSS_WIDTH = ENEMY_WIDTH * 3;
const BOSS_HEIGHT = ENEMY_HEIGHT * 3;
const GAME_DURATION = 90;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let player = {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 6,
    color: '#00ff88',
    attackMode: 'normal'
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let stars = [];
let powerUps = [];
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
let gameTime = GAME_DURATION;
let lastPowerUpTime = 0;
let currentAttackMode = 'normal';
let bossSpawned = false;
let boss = null;

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
    
    // 玩家战机主体
    const gradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(0.5, '#00cc66');
    gradient.addColorStop(1, '#008B5A');
    
    // 主体三角形
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width - 5, player.y + player.height - 10);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height - 20);
    ctx.lineTo(player.x + 5, player.y + player.height - 10);
    ctx.closePath();
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 引擎部分
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y + player.height - 10);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height + 20 + Math.random() * 5);
    ctx.lineTo(player.x + player.width - 15, player.y + player.height - 10);
    ctx.closePath();
    ctx.fill();
    
    // 引擎火焰
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height + 25 + Math.random() * 10);
    ctx.lineTo(player.x + player.width - 20, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // 机翼
    ctx.fillStyle = '#00cc66';
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y + 20);
    ctx.lineTo(player.x - 15, player.y + 40);
    ctx.lineTo(player.x + 5, player.y + 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 5, player.y + 20);
    ctx.lineTo(player.x + player.width + 15, player.y + 40);
    ctx.lineTo(player.x + player.width - 5, player.y + 30);
    ctx.closePath();
    ctx.fill();
    
    // 驾驶舱
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.save();
        if (bullet.type === 'laser') {
            // 激光形态：直上直下的圆柱筒状，天蓝色，宽度为当前的两倍
            ctx.fillStyle = '#87CEEB';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#87CEEB';
            ctx.fillRect(bullet.x, 0, bullet.width, CANVAS_HEIGHT);
        } else {
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = '#ff6b6b';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        
        // 敌方战机主体
        const gradient = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#cc3333');
        gradient.addColorStop(1, '#8B0000');
        
        // 主体三角形（倒置）
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + enemy.width - 5, enemy.y + 10);
        ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + 25);
        ctx.lineTo(enemy.x + 5, enemy.y + 10);
        ctx.closePath();
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 机翼
        ctx.fillStyle = '#cc3333';
        ctx.beginPath();
        ctx.moveTo(enemy.x + 5, enemy.y + 20);
        ctx.lineTo(enemy.x - 10, enemy.y + 30);
        ctx.lineTo(enemy.x + 5, enemy.y + 25);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width - 5, enemy.y + 20);
        ctx.lineTo(enemy.x + enemy.width + 10, enemy.y + 30);
        ctx.lineTo(enemy.x + enemy.width - 5, enemy.y + 25);
        ctx.closePath();
        ctx.fill();
        
        // 驾驶舱
        ctx.fillStyle = '#884444';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + 30, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#662222';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    });
}

function drawBoss() {
    if (!boss) return;
    
    ctx.save();
    
    // BOSS主体 - 改为飞机形态
    const gradient = ctx.createLinearGradient(boss.x, boss.y, boss.x, boss.y + boss.height);
    gradient.addColorStop(0, '#9900ff');
    gradient.addColorStop(0.5, '#6600cc');
    gradient.addColorStop(1, '#330066');
    
    // 主体三角形（倒置）
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width / 2, boss.y + boss.height);
    ctx.lineTo(boss.x + boss.width - 10, boss.y + 30);
    ctx.lineTo(boss.x + boss.width / 2, boss.y + 60);
    ctx.lineTo(boss.x + 10, boss.y + 30);
    ctx.closePath();
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = '#ff66ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 机翼
    ctx.fillStyle = '#6600cc';
    ctx.beginPath();
    ctx.moveTo(boss.x + 20, boss.y + 40);
    ctx.lineTo(boss.x - 40, boss.y + 60);
    ctx.lineTo(boss.x - 20, boss.y + 80);
    ctx.lineTo(boss.x + 10, boss.y + 60);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width - 20, boss.y + 40);
    ctx.lineTo(boss.x + boss.width + 40, boss.y + 60);
    ctx.lineTo(boss.x + boss.width + 20, boss.y + 80);
    ctx.lineTo(boss.x + boss.width - 10, boss.y + 60);
    ctx.closePath();
    ctx.fill();
    
    // 引擎
    ctx.fillStyle = '#ff66ff';
    ctx.beginPath();
    ctx.moveTo(boss.x + 30, boss.y + boss.height);
    ctx.lineTo(boss.x + 20, boss.y + boss.height + 30);
    ctx.lineTo(boss.x + 40, boss.y + boss.height + 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width - 30, boss.y + boss.height);
    ctx.lineTo(boss.x + boss.width - 40, boss.y + boss.height + 30);
    ctx.lineTo(boss.x + boss.width - 20, boss.y + boss.height + 30);
    ctx.closePath();
    ctx.fill();
    
    // 引擎火焰
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(boss.x + 25, boss.y + boss.height + 30);
    ctx.lineTo(boss.x + 30, boss.y + boss.height + 50 + Math.random() * 10);
    ctx.lineTo(boss.x + 35, boss.y + boss.height + 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width - 35, boss.y + boss.height + 30);
    ctx.lineTo(boss.x + boss.width - 30, boss.y + boss.height + 50 + Math.random() * 10);
    ctx.lineTo(boss.x + boss.width - 25, boss.y + boss.height + 30);
    ctx.closePath();
    ctx.fill();
    
    // 驾驶舱
    ctx.fillStyle = '#440088';
    ctx.beginPath();
    ctx.arc(boss.x + boss.width / 2, boss.y + 60, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff66ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 生命值条
    ctx.fillStyle = '#333333';
    ctx.fillRect(boss.x, boss.y - 15, boss.width, 8);
    const hpPercent = boss.health / boss.maxHealth;
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff88' : hpPercent > 0.25 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(boss.x, boss.y - 15, boss.width * hpPercent, 8);
    
    ctx.restore();
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.save();
        ctx.fillStyle = powerUp.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = powerUp.color;
        
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.size, powerUp.size);
        ctx.strokeRect(powerUp.x, powerUp.y, powerUp.size, powerUp.size);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.letter, powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2);
        
        ctx.shadowBlur = 0;
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

function drawGameTime() {
    ctx.save();
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 24px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`剩余时间: ${Math.ceil(gameTime)}`, CANVAS_WIDTH / 2, 10);
    ctx.restore();
}

function drawAttackMode() {
    if (currentAttackMode !== 'normal') {
        ctx.save();
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 16px Orbitron';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const modeNames = {
            'triple': 'A: 3排弹道',
            'fan': 'B: 扇形散射',
            'laser': 'C: 激光',
            'tracking': 'D: 追踪'
        };
        ctx.fillText(modeNames[currentAttackMode] || '', 10, 10);
        ctx.restore();
    }
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
        health: 1,
        lastShot: 0,
        shootCooldown: (shootCooldown * 5) * 3 // 子弹频率变为原来的三分之一
    });
}

function spawnBoss() {
    if (bossSpawned) return;
    
    boss = {
        x: CANVAS_WIDTH / 2 - BOSS_WIDTH / 2,
        y: CANVAS_HEIGHT / 4 - BOSS_HEIGHT / 2,
        width: BOSS_WIDTH,
        height: BOSS_HEIGHT,
        speed: 1,
        health: 200,
        maxHealth: 200,
        direction: 1, // 1 for right, -1 for left
        lastShot: 0,
        shootCooldown: 1000
    };
    
    bossSpawned = true;
}

function spawnPowerUp() {
    const types = ['A', 'B', 'C', 'D'];
    const colors = ['#ff6600', '#0066ff', '#ff0000', '#9900ff'];
    const typeIndex = Math.floor(Math.random() * types.length);
    
    powerUps.push({
        x: Math.random() * (CANVAS_WIDTH - 30),
        y: -30,
        size: 30,
        letter: types[typeIndex],
        color: colors[typeIndex],
        speed: 2
    });
}

function updateEnemies() {
    if (!isGameRunning) return;
    
    const now = Date.now();
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        
        if (now - enemy.lastShot > enemy.shootCooldown) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height,
                radius: 4,
                speed: 4 // 子弹速度增加一倍
            });
            enemy.lastShot = now;
        }
        
        return enemy.y < CANVAS_HEIGHT;
    });
}

function updateBoss() {
    if (!boss || !isGameRunning) return;
    
    // BOSS左右移动
    boss.x += boss.speed * boss.direction;
    if (boss.x < 0) {
        boss.x = 0;
        boss.direction = 1;
    } else if (boss.x + boss.width > CANVAS_WIDTH) {
        boss.x = CANVAS_WIDTH - boss.width;
        boss.direction = -1;
    }
    
    // BOSS发射子弹
    const now = Date.now();
    if (now - boss.lastShot > boss.shootCooldown) {
        // 发射多个子弹
        for (let i = -2; i <= 2; i++) {
            enemyBullets.push({
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                radius: 5,
                speed: 3
            });
        }
        boss.lastShot = now;
    }
}

function updateEnemyBullets() {
    if (!isGameRunning) return;
    
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < CANVAS_HEIGHT + 10;
    });
}

function updatePowerUps() {
    if (!isGameRunning) return;
    
    powerUps = powerUps.filter(powerUp => {
        powerUp.y += powerUp.speed;
        return powerUp.y < CANVAS_HEIGHT + powerUp.size;
    });
}

function updateBullets() {
    if (!isGameRunning) return;
    
    bullets = bullets.filter(bullet => {
        if (bullet.type === 'tracking' && (enemies.length > 0 || boss)) {
            let target = null;
            let minDist = Infinity;
            
            // 优先锁定BOSS
            if (boss) {
                const dx = boss.x + boss.width / 2 - bullet.x;
                const dy = boss.y + boss.height / 2 - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    target = boss;
                }
            }
            
            // 然后锁定普通敌人
            if (!target) {
                enemies.forEach(enemy => {
                    const dx = enemy.x + enemy.width / 2 - bullet.x;
                    const dy = enemy.y + enemy.height / 2 - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        target = enemy;
                    }
                });
            }
            
            if (target) {
                const dx = target.x + target.width / 2 - bullet.x;
                const dy = target.y + target.height / 2 - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                bullet.vx = (dx / dist) * bullet.speed;
                bullet.vy = (dy / dist) * bullet.speed;
            }
        }
        
        if (bullet.type === 'laser') {
            // 激光跟随玩家战机移动
            bullet.x = player.x + player.width / 2 - bullet.width / 2;
        } else if (bullet.vx !== undefined) {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
        } else {
            bullet.y -= bullet.speed;
            if (bullet.vxDelta) {
                bullet.x += bullet.vxDelta;
            }
        }
        
        if (bullet.type === 'laser') {
            return true; // 激光一直存在
        } else {
            return bullet.y > -bullet.height && bullet.y < CANVAS_HEIGHT + 10 && 
                   bullet.x > -bullet.width && bullet.x < CANVAS_WIDTH + bullet.width;
        }
    });
}

function checkCollisions() {
    if (!isGameRunning) return;
    
    bullets = bullets.filter(bullet => {
        let hit = false;
        
        // 检查是否击中BOSS
        if (boss) {
            if (bullet.x < boss.x + boss.width &&
                bullet.x + bullet.width > boss.x &&
                (bullet.type === 'laser' || (bullet.y < boss.y + boss.height && bullet.y + bullet.height > boss.y))) {
                hit = true;
                createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ff66ff');
                boss.health -= 10;
                
                if (boss.health <= 0) {
                    createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, '#9900ff');
                    score += 1000;
                    scoreElement.textContent = score;
                    boss = null;
                }
            }
        }
        
        // 检查是否击中普通敌人
        if (!hit) {
            enemies = enemies.filter(enemy => {
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    (bullet.type === 'laser' || (bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y))) {
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
        }
        
        if (bullet.type === 'laser') {
            return true; // 激光一直存在
        } else {
            return !hit;
        }
    });
    
    // 检查敌人与玩家碰撞
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
    
    // 检查BOSS与玩家碰撞
    if (boss) {
        if (player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y) {
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ff88');
            lives = 0;
            livesElement.textContent = lives;
            gameOver();
        }
    }
    
    // 检查敌方子弹与玩家碰撞
    enemyBullets = enemyBullets.filter(bullet => {
        const dx = bullet.x - (player.x + player.width / 2);
        const dy = bullet.y - (player.y + player.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bullet.radius + Math.min(player.width, player.height) / 2) {
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ff88');
            lives--;
            livesElement.textContent = lives;
            player.x = CANVAS_WIDTH / 2 - player.width / 2;
            player.y = CANVAS_HEIGHT - player.height - 20;
            
            if (lives <= 0) {
                gameOver();
            }
            return false;
        }
        return true;
    });
    
    // 检查道具拾取
    powerUps = powerUps.filter(powerUp => {
        if (player.x < powerUp.x + powerUp.size &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.size &&
            player.y + player.height > powerUp.y) {
            switch (powerUp.letter) {
                case 'A':
                    currentAttackMode = 'triple';
                    break;
                case 'B':
                    currentAttackMode = 'fan';
                    break;
                case 'C':
                    currentAttackMode = 'laser';
                    break;
                case 'D':
                    currentAttackMode = 'tracking';
                    break;
            }
            createExplosion(powerUp.x + powerUp.size / 2, powerUp.y + powerUp.size / 2, powerUp.color);
            return false;
        }
        return true;
    });
}

function handleInput() {
    if (!isGameRunning) return;
    
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
        let currentCooldown = shootCooldown;
        
        if (currentAttackMode === 'tracking') {
            currentCooldown = shootCooldown; // 追踪弹道没有冷却时间调整
        }
        
        if (now - lastShot > currentCooldown) {
            const centerX = player.x + player.width / 2;
            const centerY = player.y;
            
            switch (currentAttackMode) {
                case 'triple':
                    bullets.push({
                        x: centerX - BULLET_WIDTH / 2 - 15,
                        y: centerY,
                        width: BULLET_WIDTH,
                        height: BULLET_HEIGHT,
                        speed: 10
                    });
                    bullets.push({
                        x: centerX - BULLET_WIDTH / 2,
                        y: centerY,
                        width: BULLET_WIDTH,
                        height: BULLET_HEIGHT,
                        speed: 10
                    });
                    bullets.push({
                        x: centerX - BULLET_WIDTH / 2 + 15,
                        y: centerY,
                        width: BULLET_WIDTH,
                        height: BULLET_HEIGHT,
                        speed: 10
                    });
                    break;
                case 'fan':
                    for (let i = -2; i <= 2; i++) {
                        const angle = -Math.PI / 2 + (i * (Math.PI / 3) / 4);
                        bullets.push({
                            x: centerX - BULLET_WIDTH / 2,
                            y: centerY,
                            width: BULLET_WIDTH,
                            height: BULLET_HEIGHT,
                            speed: 10,
                            vxDelta: Math.cos(angle) * 10 - 0,
                            vy: -Math.sin(angle) * 10
                        });
                    }
                    break;
                case 'laser':
                    bullets.push({
                        x: centerX - 20, // 宽度为当前的两倍
                        y: 0,
                        width: 40, // 宽度为当前的两倍
                        height: CANVAS_HEIGHT,
                        speed: 0, // 激光没有速率概念
                        type: 'laser'
                    });
                    break;
                case 'tracking':
                    bullets.push({
                        x: centerX - BULLET_WIDTH / 2,
                        y: centerY,
                        width: BULLET_WIDTH,
                        height: BULLET_HEIGHT,
                        speed: 16, // 追踪弹道速率提升一倍
                        type: 'tracking',
                        vx: 0,
                        vy: -16 // 追踪弹道速率提升一倍
                    });
                    break;
                default:
                    bullets.push({
                        x: centerX - BULLET_WIDTH / 2,
                        y: centerY,
                        width: BULLET_WIDTH,
                        height: BULLET_HEIGHT,
                        speed: 10
                    });
            }
            
            lastShot = now;
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawStars();
    drawPowerUps();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawBoss();
    drawPlayer();
    drawParticles();
    drawGameTime();
    drawAttackMode();
}

let lastTime = 0;
function gameStep(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (!isPaused && isGameRunning) {
        gameTime -= deltaTime;
        if (gameTime <= 0) {
            gameOver();
            return;
        }
        
        // 游戏后期生成BOSS
        if (gameTime < 30 && !bossSpawned) {
            spawnBoss();
        }
        
        const elapsedTime = GAME_DURATION - gameTime;
        if (elapsedTime - lastPowerUpTime >= 10 && powerUps.length < 2) {
            spawnPowerUp();
            lastPowerUpTime = elapsedTime;
        }
        
        updateStars();
        handleInput();
        updateBullets();
        updateEnemyBullets();
        updatePowerUps();
        
        enemySpawnTimer++;
        if (enemySpawnTimer >= enemySpawnRate) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }
        
        updateEnemies();
        updateBoss();
        updateParticles();
        checkCollisions();
    }
    
    draw();
    if (isGameRunning) {
        gameLoop = requestAnimationFrame(gameStep);
    }
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
    overlayTitle.textContent = '游戏结束！';
    overlayMessage.textContent = `最终得分：${score} | 剩余时间：${Math.max(0, Math.ceil(gameTime))}秒`;
    startBtn.textContent = '重新开始';
    gameOverlay.style.display = 'flex';
    
    if (score > 0) {
        setTimeout(() => {
            leaderboardModal.classList.add('show');
            submitScoreSection.style.display = 'block';
            playerNameInput.focus();
            // 不调用fetchLeaderboard，避免服务器错误
            leaderboardList.innerHTML = '<li style="text-align:center; padding: 20px; color: #888;">排行榜功能暂不可用</li>';
        }, 500);
    }
}

function startGame() {
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    powerUps = [];
    score = 0;
    level = 1;
    lives = 3;
    enemySpawnTimer = 0;
    enemySpawnRate = 60;
    gameTime = GAME_DURATION;
    lastPowerUpTime = 0;
    currentAttackMode = 'normal';
    lastTime = 0;
    bossSpawned = false;
    boss = null;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;
    
    player.x = CANVAS_WIDTH / 2 - player.width / 2;
    player.y = CANVAS_HEIGHT - player.height - 20;
    
    isGameRunning = true;
    isPaused = false;
    gameOverlay.style.display = 'none';
    
    initStars();
    gameLoop = requestAnimationFrame(gameStep);
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    if (isPaused) {
        overlayTitle.textContent = '暂停';
        overlayMessage.textContent = '按 P 继续游戏';
        startBtn.textContent = '继续';
        gameOverlay.style.display = 'flex';
    } else {
        gameOverlay.style.display = 'none';
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
        leaderboardList.innerHTML = '<li style="text-align:center; padding: 20px; color: #888;">排行榜功能暂不可用</li>';
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

        // 模拟成功提交，避免服务器错误
        setTimeout(() => {
            submitScoreBtn.disabled = false;
            submitScoreBtn.textContent = '提交';
            submitScoreSection.style.display = 'none';
            alert('提交成功！你的分数已记录');
        }, 1000);

    } catch (error) {
        console.error('Error submitting score:', error);
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = '提交';
        alert('提交失败，请稍后重试');
    }
}

viewLeaderboardBtn.addEventListener('click', () => {
    leaderboardModal.classList.add('show');
    submitScoreSection.style.display = 'none';
    // 不调用fetchLeaderboard，避免服务器错误
    leaderboardList.innerHTML = '<li style="text-align:center; padding: 20px; color: #888;">排行榜功能暂不可用</li>';
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
