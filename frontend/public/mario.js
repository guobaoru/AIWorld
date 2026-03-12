const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const coinsElement = document.getElementById('coins');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const timeElement = document.getElementById('time');
const highScoreElement = document.getElementById('highScore');
const gameOverlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startBtn = document.getElementById('startBtn');

const CANVAS_WIDTH = 768;
const CANVAS_HEIGHT = 416;
const TILE_SIZE = 32;
const GRAVITY = 0.5;
const MAX_VELOCITY = 12;
const MARIO_BASE_WIDTH = 28;
const MARIO_BASE_HEIGHT = 32;
const MARIO_SMALL_SCALE = 2 / 3;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameState = {
    running: false,
    paused: false,
    score: 0,
    coins: 0,
    lives: 3,
    time: 400,
    highScore: localStorage.getItem('marioHighScore') || 0,
    cameraX: 0
};

let mario = {
    x: 50,
    y: 352,
    width: MARIO_BASE_WIDTH,
    height: MARIO_BASE_HEIGHT,
    vx: 0,
    vy: 0,
    speed: 3,
    jumpForce: -12,
    onGround: false,
    facingRight: true,
    isBig: false,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 2
};

function setMarioScale(scale) {
    const bottom = mario.y + mario.height;
    mario.width = Math.max(1, Math.round(MARIO_BASE_WIDTH * scale));
    mario.height = Math.max(1, Math.round(MARIO_BASE_HEIGHT * scale));
    mario.y = bottom - mario.height;
    mario.isBig = scale === 1;
}

setMarioScale(MARIO_SMALL_SCALE);

let keys = {
    left: false,
    right: false,
    up: false,
    space: false,
    shift: false
};

const LEVEL_MAP = [
    '                                                                                                    ',
    '                                                                                                    ',
    '                                                                                                    ',
    '                                                                                                    ',
    '                                                                                                    ',
    '                                                                                                    ',
    '                                                                                                    ',
    '                    ?                                                        B                      ',
    '                                      BBB                                      BB                     ',
    '          ?B?B?                    B                                        BBB                    ',
    '                                      B                                       BBBB                   ',
    '                  E                   B    E                  E               BBBBB                  ',
    'GGGGGGGGGGGGGGGGGGGGGGGGGGGG    GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGBBBBBBBBBBGGGGGGGGGG'
];

let entities = [];
let particles = [];
let floatingTexts = [];
let mushrooms = [];
let flagState = {
    x: 0,
    y: 0,
    falling: false,
    reachedBottom: false
};

highScoreElement.textContent = gameState.highScore;

function parseLevel() {
    entities = [];
    mushrooms = [];
    flagState = { x: 0, y: 0, falling: false, reachedBottom: false };
    
    for (let y = 0; y < LEVEL_MAP.length; y++) {
        for (let x = 0; x < LEVEL_MAP[y].length; x++) {
            const char = LEVEL_MAP[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            switch (char) {
                case 'G':
                    entities.push({ type: 'ground', x: px, y: py, width: TILE_SIZE, height: TILE_SIZE });
                    break;
                case 'B':
                    entities.push({ type: 'brick', x: px, y: py, width: TILE_SIZE, height: TILE_SIZE, hit: false, broken: false });
                    break;
                case '?':
                    entities.push({ type: 'question', x: px, y: py, width: TILE_SIZE, height: TILE_SIZE, hit: false, coin: true });
                    break;
                case 'P':
                    entities.push({ type: 'pipe', x: px, y: py, width: TILE_SIZE * 2, height: TILE_SIZE * 2 });
                    break;
                case 'E':
                    entities.push({ type: 'enemy', x: px, y: py, width: 28, height: 28, vx: -1, alive: true });
                    break;
            }
        }
    }
    
    const staircaseStartX = 70;
    const staircasePattern = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10];
    const groundY = (LEVEL_MAP.length - 1) * TILE_SIZE;
    
    for (let i = 0; i < staircasePattern.length; i++) {
        const brickCount = staircasePattern[i];
        for (let j = 0; j < brickCount; j++) {
            entities.push({
                type: 'brick',
                x: (staircaseStartX + i) * TILE_SIZE,
                y: groundY - (j + 1) * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                hit: false,
                broken: false
            });
        }
    }
    
    const flagpoleX = (staircaseStartX + staircasePattern.length + 10) * TILE_SIZE;
    const flagpoleY = groundY - 10 * TILE_SIZE;
    flagState.x = flagpoleX;
    flagState.y = flagpoleY;
    entities.push({ type: 'flagpole', x: flagpoleX, y: flagpoleY, width: TILE_SIZE, height: 10 * TILE_SIZE });
    
    const wallX = flagpoleX + 15 * TILE_SIZE;
    const wallY = groundY - 8 * TILE_SIZE;
    entities.push({ type: 'archway', x: wallX, y: wallY, width: TILE_SIZE * 5, height: TILE_SIZE * 8 });

    let firstQuestion = null;
    for (const e of entities) {
        if (e.type !== 'question') continue;
        if (!firstQuestion || e.x < firstQuestion.x) firstQuestion = e;
    }
    if (firstQuestion) firstQuestion.isMushroomBlock = true;
}

function drawMario() {
    ctx.save();
    
    const screenX = mario.x - gameState.cameraX;
    const scale = mario.height / MARIO_BASE_HEIGHT;
    
    ctx.translate(screenX, mario.y);
    ctx.scale(scale, scale);
    
    if (!mario.facingRight) {
        ctx.translate(MARIO_BASE_WIDTH, 0);
        ctx.scale(-1, 1);
    }

    const hatPrimary = '#E50000';
    const hatSecondary = '#CC0000';
    const skinPrimary = '#FFD1AA';
    const skinSecondary = '#FFC090';
    const shirtPrimary = '#E50000';
    const overallPrimary = '#0066CC';
    const overallSecondary = '#004C99';
    const shoePrimary = '#8B4513';
    const shoeSecondary = '#5C3317';
    const glovePrimary = '#FFFFFF';
    const gloveSecondary = '#E0E0E0';
    
    if (keys.space && !mario.onGround) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.moveTo(14, -18);
        ctx.quadraticCurveTo(-8, -5, -8, 8);
        ctx.lineTo(36, 8);
        ctx.quadraticCurveTo(36, -5, 14, -18);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.beginPath();
        ctx.moveTo(14, -18);
        ctx.quadraticCurveTo(0, -8, 3, 5);
        ctx.lineTo(25, 5);
        ctx.quadraticCurveTo(28, -8, 14, -18);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(14, -18);
        ctx.lineTo(14, 4);
        ctx.stroke();
    }
    
    ctx.fillStyle = hatPrimary;
    ctx.beginPath();
    ctx.ellipse(14, 5, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = hatSecondary;
    ctx.beginPath();
    ctx.ellipse(14, 3, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = skinPrimary;
    ctx.beginPath();
    ctx.roundRect(5, 7, 18, 11, 3);
    ctx.fill();
    
    ctx.fillStyle = skinSecondary;
    ctx.beginPath();
    ctx.roundRect(6, 8, 16, 4, 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(17, 11, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(17.5, 10.5, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#6B3A10';
    ctx.beginPath();
    ctx.roundRect(13, 15, 7, 3, 1);
    ctx.fill();
    
    ctx.fillStyle = shirtPrimary;
    ctx.beginPath();
    ctx.roundRect(3, 17, 22, 11, 3);
    ctx.fill();
    
    ctx.fillStyle = overallPrimary;
    ctx.beginPath();
    ctx.roundRect(5, 21, 18, 13, 2);
    ctx.fill();
    
    ctx.fillStyle = overallSecondary;
    ctx.beginPath();
    ctx.roundRect(6, 22, 16, 4, 1);
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(10, 25, 2.5, 0, Math.PI * 2);
    ctx.arc(18, 25, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(10, 24.5, 1.5, 0, Math.PI * 2);
    ctx.arc(18, 24.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = overallPrimary;
    ctx.beginPath();
    ctx.roundRect(1, 31, 11, 5, 2);
    ctx.roundRect(16, 31, 11, 5, 2);
    ctx.fill();
    
    ctx.fillStyle = shoePrimary;
    ctx.beginPath();
    ctx.roundRect(-1, 33, 14, 6, 3);
    ctx.roundRect(15, 33, 14, 6, 3);
    ctx.fill();
    
    ctx.fillStyle = shoeSecondary;
    ctx.beginPath();
    ctx.roundRect(-1, 35, 14, 4, 2);
    ctx.roundRect(15, 35, 14, 4, 2);
    ctx.fill();
    
    ctx.fillStyle = glovePrimary;
    ctx.beginPath();
    ctx.roundRect(-2, 19, 6, 7, 2);
    ctx.roundRect(24, 19, 6, 7, 2);
    ctx.fill();
    
    ctx.fillStyle = gloveSecondary;
    ctx.beginPath();
    ctx.roundRect(-1, 19, 4, 3, 1);
    ctx.roundRect(25, 19, 4, 3, 1);
    ctx.fill();
    
    ctx.restore();
}

function drawGround(x, y, width, height) {
    const screenX = x - gameState.cameraX;
    
    const groundGradient = ctx.createLinearGradient(screenX, y, screenX, y + height);
    groundGradient.addColorStop(0, '#C84C0C');
    groundGradient.addColorStop(0.3, '#C84C0C');
    groundGradient.addColorStop(0.3, '#E09050');
    groundGradient.addColorStop(1, '#E09050');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(screenX, y, width, height);
    
    ctx.strokeStyle = '#8B3A00';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX, y, width, height);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.moveTo(screenX, y + height * 0.3);
    ctx.lineTo(screenX + width, y + height * 0.3);
    ctx.stroke();
    
    ctx.fillStyle = '#00A800';
    ctx.fillRect(screenX, y, width, 6);
}

function drawBrick(x, y, width, height, hit, broken) {
    if (broken) return;
    
    const screenX = x - gameState.cameraX;
    
    ctx.fillStyle = hit ? '#8B8B8B' : '#C84C0C';
    ctx.fillRect(screenX, y, width, height);
    
    if (!hit) {
        ctx.strokeStyle = '#8B3A00';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, y, width, height);
        
        ctx.beginPath();
        ctx.moveTo(screenX + width / 2, y);
        ctx.lineTo(screenX + width / 2, y + height);
        ctx.moveTo(screenX, y + height / 2);
        ctx.lineTo(screenX + width, y + height / 2);
        ctx.stroke();
    }
}

function drawQuestionBlock(x, y, width, height, hit) {
    const screenX = x - gameState.cameraX;
    
    if (hit) {
        ctx.fillStyle = '#8B8B8B';
        ctx.fillRect(screenX, y, width, height);
    } else {
        const gradient = ctx.createLinearGradient(screenX, y, screenX, y + height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, y, width, height);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', screenX + width / 2, y + height / 2 + 7);
    }
    
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, y, width, height);
}

function drawPipe(x, y, width, height) {
    const screenX = x - gameState.cameraX;
    
    const pipeGradient = ctx.createLinearGradient(screenX, y, screenX + width, y);
    pipeGradient.addColorStop(0, '#00A800');
    pipeGradient.addColorStop(0.5, '#00D800');
    pipeGradient.addColorStop(1, '#00A800');
    
    ctx.fillStyle = pipeGradient;
    ctx.fillRect(screenX - 4, y, width + 8, 16);
    
    ctx.fillStyle = pipeGradient;
    ctx.fillRect(screenX, y + 16, width, height - 16);
    
    ctx.strokeStyle = '#006800';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX - 4, y, width + 8, 16);
    ctx.strokeRect(screenX, y + 16, width, height - 16);
}

function drawEnemy(x, y, width, height, vx) {
    const screenX = x - gameState.cameraX;
    
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(screenX + width / 2, y + height / 2, width / 2, height / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(screenX + width / 3, y + height / 3, 5, 0, Math.PI * 2);
    ctx.arc(screenX + width * 2 / 3, y + height / 3, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(screenX + width / 3 + (vx > 0 ? 2 : -2), y + height / 3, 2, 0, Math.PI * 2);
    ctx.arc(screenX + width * 2 / 3 + (vx > 0 ? 2 : -2), y + height / 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + 4, y + height / 4);
    ctx.lineTo(screenX + width / 3 - 2, y + height / 4 + 4);
    ctx.moveTo(screenX + width - 4, y + height / 4);
    ctx.lineTo(screenX + width * 2 / 3 + 2, y + height / 4 + 4);
    ctx.stroke();
    
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(screenX + width / 4, y + height - 3, 5, 0, Math.PI * 2);
    ctx.arc(screenX + width * 3 / 4, y + height - 3, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawMushrooms() {
    mushrooms.forEach(m => {
        const screenX = m.x - gameState.cameraX;
        ctx.fillStyle = '#00A800';
        ctx.beginPath();
        ctx.ellipse(screenX + m.width / 2, m.y + m.height / 2, m.width / 2, m.height / 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(screenX + m.width * 0.35, m.y + m.height * 0.4, 4, 0, Math.PI * 2);
        ctx.arc(screenX + m.width * 0.65, m.y + m.height * 0.45, 4, 0, Math.PI * 2);
        ctx.arc(screenX + m.width * 0.5, m.y + m.height * 0.25, 3.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFlagpole(x, y, width, height) {
    const screenX = x - gameState.cameraX;
    
    ctx.fillStyle = '#00A800';
    ctx.fillRect(screenX + width / 2 - 3, y, 6, height);
    
    let flagY = y + 10;
    if (flagState.falling) {
        flagY = y + 10 + flagState.y;
        if (flagY > y + height - 40) {
            flagY = y + height - 40;
        }
    }
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(screenX + width / 2 + 3, flagY);
    ctx.lineTo(screenX + width / 2 + 40, flagY + 15);
    ctx.lineTo(screenX + width / 2 + 3, flagY + 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(screenX + width / 2, y + 5, 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawArchway(x, y, width, height) {
    const screenX = x - gameState.cameraX;
    
    const brickColor1 = '#C84C0C';
    const brickColor2 = '#A03800';
    const brickColor3 = '#8B3A00';
    const mortarColor = '#D4A574';
    
    for (let row = 0; row < Math.floor(height / 16); row++) {
        const isEvenRow = row % 2 === 0;
        for (let col = 0; col < Math.floor(width / 32); col++) {
            const bx = screenX + col * 32 + (isEvenRow ? 0 : 16);
            const by = y + row * 16;
            
            if (bx > screenX + width - 32) continue;
            
            ctx.fillStyle = (row + col) % 2 === 0 ? brickColor1 : brickColor2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 32, by);
            ctx.lineTo(bx + 40, by + 8);
            ctx.lineTo(bx + 8, by + 8);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = (row + col) % 2 === 0 ? brickColor2 : brickColor3;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 8, by + 8);
            ctx.lineTo(bx + 8, by + 24);
            ctx.lineTo(bx, by + 16);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = (row + col) % 2 === 0 ? brickColor3 : brickColor2;
            ctx.beginPath();
            ctx.moveTo(bx + 8, by + 8);
            ctx.lineTo(bx + 40, by + 8);
            ctx.lineTo(bx + 40, by + 24);
            ctx.lineTo(bx + 8, by + 24);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = mortarColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 32, by);
            ctx.lineTo(bx + 40, by + 8);
            ctx.lineTo(bx + 8, by + 8);
            ctx.closePath();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 8, by + 8);
            ctx.lineTo(bx + 8, by + 24);
            ctx.lineTo(bx, by + 16);
            ctx.closePath();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(bx + 8, by + 8);
            ctx.lineTo(bx + 40, by + 8);
            ctx.lineTo(bx + 40, by + 24);
            ctx.lineTo(bx + 8, by + 24);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    const doorX = screenX + width / 2 - 24;
    const doorY = y + height - 80;
    
    ctx.fillStyle = '#5C3317';
    ctx.beginPath();
    ctx.moveTo(doorX, doorY);
    ctx.lineTo(doorX + 48, doorY);
    ctx.lineTo(doorX + 56, doorY + 8);
    ctx.lineTo(doorX + 8, doorY + 8);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#4A2810';
    ctx.beginPath();
    ctx.moveTo(doorX, doorY);
    ctx.lineTo(doorX + 8, doorY + 8);
    ctx.lineTo(doorX + 8, doorY + 72);
    ctx.lineTo(doorX, doorY + 64);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3A1F0D';
    ctx.beginPath();
    ctx.moveTo(doorX + 8, doorY + 8);
    ctx.lineTo(doorX + 56, doorY + 8);
    ctx.lineTo(doorX + 56, doorY + 72);
    ctx.lineTo(doorX + 8, doorY + 72);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(doorX + 44, doorY + 40, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, doorY, 48, 64);
}

function drawParticles() {
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(index, 1);
            return;
        }
        
        const screenX = p.x - gameState.cameraX;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(screenX, p.y, p.size, p.size);
        ctx.globalAlpha = 1;
    });
}

function drawFloatingTexts() {
    floatingTexts.forEach((ft, index) => {
        ft.y -= 1;
        ft.life--;
        
        if (ft.life <= 0) {
            floatingTexts.splice(index, 1);
            return;
        }
        
        const screenX = ft.x - gameState.cameraX;
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, screenX, ft.y);
        ctx.globalAlpha = 1;
    });
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            size: Math.random() * 4 + 2,
            color: color,
            life: 30,
            maxLife: 30
        });
    }
}

function createFloatingText(x, y, text) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        life: 60,
        maxLife: 60
    });
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function update() {
    if (!gameState.running || gameState.paused) return;

    if (keys.left) {
        mario.vx = -mario.speed;
        mario.facingRight = false;
    } else if (keys.right) {
        mario.vx = mario.speed;
        mario.facingRight = true;
    } else {
        mario.vx *= 0.8;
        if (Math.abs(mario.vx) < 0.1) mario.vx = 0;
    }

    if (keys.shift) {
        mario.vx *= 1.5;
    }

    if (keys.up) {
        if (mario.onGround) {
            mario.vy = mario.jumpForce;
            mario.onGround = false;
            mario.isJumping = true;
            mario.jumpCount = 1;
        } else if (mario.jumpCount < mario.maxJumps) {
            mario.vy = mario.jumpForce;
            mario.jumpCount++;
        }
        keys.up = false;
    }

    mario.vy += GRAVITY;
    
    if (keys.space && !mario.onGround && mario.vy > 0) {
        mario.vy = mario.vy / 3;
    }
    
    mario.vy = Math.min(mario.vy, MAX_VELOCITY);

    mario.x += mario.vx;
    mario.y += mario.vy;

    if (mario.x < 0) mario.x = 0;

    mario.onGround = false;
    
    entities.forEach(entity => {
        if (!entity.alive && entity.type === 'enemy') return;
        if (entity.broken) return;
        
        if (checkCollision(mario, entity)) {
            switch (entity.type) {
                case 'ground':
                case 'pipe':
                    handleSolidCollision(entity);
                    break;
                case 'brick':
                    handleBrickCollision(entity);
                    break;
                case 'question':
                    handleQuestionCollision(entity);
                    break;
                case 'enemy':
                    handleEnemyCollision(entity);
                    break;
                case 'flagpole':
                    handleFlagpoleCollision();
                    break;
            }
        }
    });

    entities.forEach(entity => {
        if (entity.type === 'enemy' && entity.alive) {
            entity.x += entity.vx;
            
            entities.forEach(other => {
                if (other !== entity && !other.broken && (other.type === 'ground' || other.type === 'pipe' || other.type === 'brick')) {
                    if (checkCollision(entity, other)) {
                        entity.vx *= -1;
                    }
                }
            });
        }
    });

    mushrooms.forEach((m, index) => {
        m.vy += GRAVITY;
        m.vy = Math.min(m.vy, MAX_VELOCITY);

        m.x += m.vx;
        m.y += m.vy;

        m.onGround = false;

        entities.forEach(entity => {
            if (entity.broken) return;
            if (entity.type !== 'ground' && entity.type !== 'pipe' && entity.type !== 'brick') return;
            if (!checkCollision(m, entity)) return;
            handleMushroomSolidCollision(m, entity);
        });

        if (checkCollision(mario, m)) {
            if (!mario.isBig) {
                setMarioScale(1);
            }
            mushrooms.splice(index, 1);
            createParticles(m.x + m.width / 2, m.y + m.height / 2, '#00A800', 12);
        }
    });
    
    if (flagState.falling && !flagState.reachedBottom) {
        flagState.y += 3;
        if (flagState.y >= (TILE_SIZE * 10) - 50) {
            flagState.reachedBottom = true;
            setTimeout(() => {
                finalizeWin();
            }, 500);
        }
    }

    if (mario.y > CANVAS_HEIGHT) {
        loseLife();
    }

    let wallX = 0;
    entities.forEach(entity => {
        if (entity.type === 'archway') {
            wallX = entity.x;
        }
    });
    
    const targetCameraX = mario.x - CANVAS_WIDTH / 3;
    const maxCameraX = wallX > 0 ? Math.max(0, wallX - CANVAS_WIDTH) : Infinity;
    gameState.cameraX = Math.max(0, Math.min(targetCameraX, maxCameraX));
    
    if (mario.x + mario.width > wallX && wallX > 0) {
        mario.x = wallX - mario.width;
        mario.vx = 0;
    }
}

function handleSolidCollision(entity) {
    const marioBottom = mario.y + mario.height;
    const marioTop = mario.y;
    const marioLeft = mario.x;
    const marioRight = mario.x + mario.width;
    const entityBottom = entity.y + entity.height;
    const entityTop = entity.y;
    const entityLeft = entity.x;
    const entityRight = entity.x + entity.width;

    const overlapBottom = marioBottom - entityTop;
    const overlapTop = entityBottom - marioTop;
    const overlapLeft = marioRight - entityLeft;
    const overlapRight = entityRight - marioLeft;

    const minOverlap = Math.min(overlapBottom, overlapTop, overlapLeft, overlapRight);

    if (minOverlap === overlapBottom && mario.vy >= 0) {
        mario.y = entityTop - mario.height;
        mario.vy = 0;
        mario.onGround = true;
        mario.isJumping = false;
        mario.jumpCount = 0;
    } else if (minOverlap === overlapTop && mario.vy < 0) {
        mario.y = entityBottom;
        mario.vy = 0;
    } else if (minOverlap === overlapLeft) {
        mario.x = entityLeft - mario.width;
        mario.vx = 0;
    } else if (minOverlap === overlapRight) {
        mario.x = entityRight;
        mario.vx = 0;
    }
}

function handleMushroomSolidCollision(m, entity) {
    const mBottom = m.y + m.height;
    const mTop = m.y;
    const mLeft = m.x;
    const mRight = m.x + m.width;
    const eBottom = entity.y + entity.height;
    const eTop = entity.y;
    const eLeft = entity.x;
    const eRight = entity.x + entity.width;

    const overlapBottom = mBottom - eTop;
    const overlapTop = eBottom - mTop;
    const overlapLeft = mRight - eLeft;
    const overlapRight = eRight - mLeft;

    const minOverlap = Math.min(overlapBottom, overlapTop, overlapLeft, overlapRight);

    if (minOverlap === overlapBottom && m.vy >= 0) {
        m.y = eTop - m.height;
        m.vy = 0;
        m.onGround = true;
    } else if (minOverlap === overlapTop && m.vy < 0) {
        m.y = eBottom;
        m.vy = 0;
    } else if (minOverlap === overlapLeft) {
        m.x = eLeft - m.width;
        m.vx *= -1;
    } else if (minOverlap === overlapRight) {
        m.x = eRight;
        m.vx *= -1;
    }
}

function handleBrickCollision(entity) {
    const marioBottom = mario.y + mario.height;
    const marioTop = mario.y;
    const entityTop = entity.y;
    const entityBottom = entity.y + entity.height;
    
    if (mario.vy < 0 && marioTop < entityBottom && marioBottom > entityBottom - 5) {
        mario.y = entityBottom;
        mario.vy = 0;
        
        if (!entity.hit) {
            entity.hit = true;
            entity.broken = true;
            createParticles(entity.x + TILE_SIZE / 2, entity.y + TILE_SIZE, '#C84C0C', 12);
            gameState.score += 50;
            scoreElement.textContent = gameState.score;
            createFloatingText(entity.x + TILE_SIZE / 2, entity.y, '+50');
        }
    } else if (!entity.broken) {
        handleSolidCollision(entity);
    }
}

function handleQuestionCollision(entity) {
    const marioBottom = mario.y + mario.height;
    const marioTop = mario.y;
    const entityTop = entity.y;
    const entityBottom = entity.y + entity.height;
    
    if (mario.vy < 0 && marioTop < entityBottom && marioBottom > entityBottom - 5) {
        mario.y = entityBottom;
        mario.vy = 0;
        
        if (!entity.hit) {
            entity.hit = true;
            if (entity.isMushroomBlock) {
                const enemySpeed = Math.abs(entities.find(e => e.type === 'enemy')?.vx || 1);
                const size = 28;
                mushrooms.push({
                    x: entity.x + (TILE_SIZE - size) / 2,
                    y: entity.y - size,
                    width: size,
                    height: size,
                    vx: mario.facingRight ? enemySpeed : -enemySpeed,
                    vy: 0,
                    onGround: false
                });
                createParticles(entity.x + TILE_SIZE / 2, entity.y, '#00A800', 10);
            } else {
                gameState.coins++;
                gameState.score += 200;
                
                if (gameState.coins % 10 === 0 && gameState.lives < 99) {
                    gameState.lives++;
                    livesElement.textContent = gameState.lives;
                    createFloatingText(entity.x + TILE_SIZE / 2, entity.y - 20, '1-UP!');
                }
                
                coinsElement.textContent = gameState.coins;
                scoreElement.textContent = gameState.score;
                createParticles(entity.x + TILE_SIZE / 2, entity.y + TILE_SIZE, '#FFD700', 8);
                createFloatingText(entity.x + TILE_SIZE / 2, entity.y, '+200');
            }
        }
    } else {
        handleSolidCollision(entity);
    }
}

function handleEnemyCollision(entity) {
    const marioBottom = mario.y + mario.height;
    const entityTop = entity.y;
    
    if (mario.vy > 0 && marioBottom < entityTop + 15 && mario.y < entityTop) {
        entity.alive = false;
        mario.vy = -8;
        gameState.score += 100;
        scoreElement.textContent = gameState.score;
        createParticles(entity.x + entity.width / 2, entity.y + entity.height / 2, '#8B4513', 10);
        createFloatingText(entity.x + entity.width / 2, entity.y, '+100');
    } else {
        loseLife();
    }
}

function handleFlagpoleCollision() {
    if (flagState.falling) return;
    
    flagState.falling = true;
    flagState.y = 0;
}

function finalizeWin() {
    gameState.score += gameState.time * 50;
    gameState.running = false;
    
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('marioHighScore', gameState.highScore);
        highScoreElement.textContent = gameState.highScore;
    }
    
    overlayTitle.textContent = '🎉 恭喜过关！';
    overlayMessage.textContent = `得分: ${gameState.score}`;
    startBtn.textContent = '再玩一次';
    gameOverlay.style.display = 'flex';
}

function loseLife() {
    gameState.lives--;
    livesElement.textContent = gameState.lives;
    
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        resetMario();
    }
}

function resetMario() {
    mario.x = 50;
    mario.y = 352;
    mario.width = MARIO_BASE_WIDTH;
    mario.height = MARIO_BASE_HEIGHT;
    setMarioScale(MARIO_SMALL_SCALE);
    mario.vx = 0;
    mario.vy = 0;
    gameState.cameraX = 0;
}

function gameOver() {
    gameState.running = false;
    
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('marioHighScore', gameState.highScore);
        highScoreElement.textContent = gameState.highScore;
    }
    
    overlayTitle.textContent = '💀 游戏结束';
    overlayMessage.textContent = `最终得分: ${gameState.score}`;
    startBtn.textContent = '重新开始';
    gameOverlay.style.display = 'flex';
}

function drawBackground() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#5C94FC');
    skyGradient.addColorStop(1, '#98D8FA');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 5; i++) {
        const cloudX = (i * 200 - gameState.cameraX * 0.3) % (CANVAS_WIDTH + 200) - 100;
        const cloudY = 50 + i * 30;
        drawCloud(cloudX, cloudY);
    }
    
    ctx.fillStyle = '#00A800';
    for (let i = 0; i < 8; i++) {
        const hillX = (i * 300 - gameState.cameraX * 0.5) % (CANVAS_WIDTH + 300) - 150;
        drawHill(hillX, CANVAS_HEIGHT, 150, 60);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y + 5, 22, 0, Math.PI * 2);
    ctx.fill();
}

function drawHill(x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.quadraticCurveTo(x, y - height, x + width / 2, y);
    ctx.fill();
}

function draw() {
    drawBackground();
    
    entities.forEach(entity => {
        const screenX = entity.x - gameState.cameraX;
        if (screenX < -TILE_SIZE * 2 || screenX > CANVAS_WIDTH + TILE_SIZE * 2) return;
        
        switch (entity.type) {
            case 'ground':
                drawGround(entity.x, entity.y, entity.width, entity.height);
                break;
            case 'brick':
                drawBrick(entity.x, entity.y, entity.width, entity.height, entity.hit, entity.broken);
                break;
            case 'question':
                drawQuestionBlock(entity.x, entity.y, entity.width, entity.height, entity.hit);
                break;
            case 'pipe':
                drawPipe(entity.x, entity.y, entity.width, entity.height);
                break;
            case 'enemy':
                if (entity.alive) {
                    drawEnemy(entity.x, entity.y, entity.width, entity.height, entity.vx);
                }
                break;
            case 'flagpole':
                drawFlagpole(entity.x, entity.y, entity.width, entity.height);
                break;
            case 'archway':
                drawArchway(entity.x, entity.y, entity.width, entity.height);
                break;
        }
    });
    
    drawMushrooms();
    drawParticles();
    drawFloatingTexts();
    drawMario();
}

let lastTime = 0;
let timeCounter = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update();
    draw();

    if (gameState.running) {
        timeCounter += deltaTime;
        if (timeCounter >= 1000) {
            gameState.time--;
            timeElement.textContent = gameState.time;
            timeCounter = 0;
            
            if (gameState.time <= 0) {
                loseLife();
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.lives = 3;
    gameState.time = 400;
    gameState.cameraX = 0;
    
    scoreElement.textContent = gameState.score;
    coinsElement.textContent = gameState.coins;
    livesElement.textContent = gameState.lives;
    timeElement.textContent = gameState.time;
    
    resetMario();
    parseLevel();
    
    gameOverlay.style.display = 'none';
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            e.preventDefault();
            break;
        case ' ':
            keys.space = true;
            e.preventDefault();
            break;
        case 'Shift':
            keys.shift = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case ' ':
            keys.space = false;
            break;
        case 'Shift':
            keys.shift = false;
            break;
    }
});

startBtn.addEventListener('click', startGame);

parseLevel();
requestAnimationFrame(gameLoop);
