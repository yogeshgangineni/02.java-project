// ============================================================
// CAR RACING GAME - COMPLETE GAME.JS
// Desktop + Mobile + Keyboard + Mouse + Touch
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Allow keyboard focus
canvas.tabIndex = 0;

let W = 900;
let H = 700;

// ============================================================
// GAME CONSTANTS
// ============================================================

const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 110;

const KEY_MOVE_SPEED = 8.5;
const KEY_VERTICAL_SPEED = 6.5;
const MOUSE_SMOOTHNESS = 0.15;

const MAX_NITRO = 100;
const NITRO_POWER = 11.5;
const NITRO_CONSUMPTION = 0.42;
const NITRO_RECHARGE = 0.13;

const ROAD_LEFT_RATIO = 0.211;
const ROAD_RIGHT_RATIO = 0.789;

// ============================================================
// GAME STATE
// ============================================================

let playerX = 0;
let playerY = 0;

let mouseX = 450;
let mouseY = 550;

let mouseControl = false;

let gameStarted = false;
let gameOver = false;
let paused = false;

let score = 0;
let highScore = Number(localStorage.getItem("carRacingHighScore") || 0);
let lives = 3;

let frame = 0;
let roadOffset = 0;

let nitro = MAX_NITRO;
let nitroActive = false;
let nitroEffectTimer = 0;

let nightMode = false;
let rainMode = false;

let invincibleTimer = 0;
let collisionFlash = 0;

// ============================================================
// KEYBOARD STATE
// ============================================================

let leftPressed = false;
let rightPressed = false;
let upPressed = false;
let downPressed = false;
let nitroPressed = false;

// ============================================================
// ARRAYS
// ============================================================

const enemies = [];
const trees = [];
const rainDrops = [];
const particles = [];


// ============================================================
// CANVAS RESIZE
// ============================================================

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!gameStarted && !gameOver) {
        playerX = W / 2 - PLAYER_WIDTH / 2;
        playerY = H - PLAYER_HEIGHT - 35;
    }
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


// ============================================================
// ROAD
// ============================================================

function roadLeft() {

    // Wider road on mobile
    if (W < 600) {
        return W * 0.05;
    }

    if (W < 900) {
        return W * 0.10;
    }

    return W * ROAD_LEFT_RATIO;
}


function roadRight() {

    // Wider road on mobile
    if (W < 600) {
        return W * 0.95;
    }

    if (W < 900) {
        return W * 0.90;
    }

    return W * ROAD_RIGHT_RATIO;
}


function roadWidth() {
    return roadRight() - roadLeft();
}


// ============================================================
// SPEED
// ============================================================

function getDisplaySpeed() {

    let speed = 80;

    speed += score * 1.4;

    if (speed > 220) {
        speed = 220;
    }

    if (nitroActive) {
        speed += 90;
        speed += nitro * 0.15;
    }

    return Math.floor(speed);
}


function getEnemySpeed() {

    let speed = 4;

    speed += score * 0.025;

    if (speed > 7) {
        speed = 7;
    }

    if (nitroActive) {
        speed += 3.5;
    }

    return speed;
}


// ============================================================
// START / RESTART
// ============================================================

function startGame() {

    gameStarted = true;
    gameOver = false;
    paused = false;

    score = 0;
    lives = 3;
    frame = 0;

    playerX = W / 2 - PLAYER_WIDTH / 2;
    playerY = H - PLAYER_HEIGHT - 35;

    mouseX = playerX + PLAYER_WIDTH / 2;
    mouseY = playerY + PLAYER_HEIGHT / 2;

    nitro = MAX_NITRO;
    nitroActive = false;

    invincibleTimer = 0;
    collisionFlash = 0;

    enemies.length = 0;
    particles.length = 0;

    canvas.focus();
}


function restartGame() {
    startGame();
}


function togglePause() {

    if (!gameStarted || gameOver) {
        return;
    }

    paused = !paused;

    clearKeys();
}


// ============================================================
// CLEAR KEY STATE
// ============================================================

function clearKeys() {

    leftPressed = false;
    rightPressed = false;
    upPressed = false;
    downPressed = false;
    nitroPressed = false;
}


// ============================================================
// KEYBOARD CONTROLS - FIXED
// ============================================================

window.addEventListener("keydown", function (e) {

    const key = e.key.toLowerCase();

    // Prevent browser scrolling
    if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.code === "Space"
    ) {
        e.preventDefault();
    }

    // LEFT
    if (e.key === "ArrowLeft" || key === "a") {
        leftPressed = true;
        mouseControl = false;
    }

    // RIGHT
    if (e.key === "ArrowRight" || key === "d") {
        rightPressed = true;
        mouseControl = false;
    }

    // UP
    if (e.key === "ArrowUp" || key === "w") {
        upPressed = true;
        mouseControl = false;
    }

    // DOWN
    if (e.key === "ArrowDown" || key === "s") {
        downPressed = true;
        mouseControl = false;
    }

    // NITRO
    if (e.code === "Space") {
        nitroPressed = true;
    }

    // PAUSE
    if (key === "p" && !e.repeat) {
        togglePause();
    }

    // NIGHT
    if (key === "n" && !e.repeat) {
        nightMode = !nightMode;
    }

    // RAIN
    if (key === "m" && !e.repeat) {
        rainMode = !rainMode;
    }

    // RESTART
    if (
        gameOver &&
        !e.repeat &&
        (key === "r" || e.key === "Enter")
    ) {
        startGame();
    }

}, { passive: false });


window.addEventListener("keyup", function (e) {

    const key = e.key.toLowerCase();

    if (e.key === "ArrowLeft" || key === "a") {
        leftPressed = false;
    }

    if (e.key === "ArrowRight" || key === "d") {
        rightPressed = false;
    }

    if (e.key === "ArrowUp" || key === "w") {
        upPressed = false;
    }

    if (e.key === "ArrowDown" || key === "s") {
        downPressed = false;
    }

    if (e.code === "Space") {
        nitroPressed = false;
    }

}, { passive: false });


// Prevent stuck keys when browser loses focus
window.addEventListener("blur", clearKeys);

document.addEventListener("visibilitychange", function () {

    if (document.hidden) {
        clearKeys();
    }

});


// ============================================================
// MOUSE CONTROL
// ============================================================

canvas.addEventListener("mousemove", function (e) {

    const rect = canvas.getBoundingClientRect();

    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    mouseControl = true;

});


canvas.addEventListener("mouseenter", function () {
    mouseControl = true;
});


canvas.addEventListener("mouseleave", function () {
    mouseControl = false;
});


// ============================================================
// TOUCH CONTROL
// ============================================================

canvas.addEventListener(
    "touchmove",
    function (e) {

        e.preventDefault();

        if (e.touches.length === 0) {
            return;
        }

        const rect = canvas.getBoundingClientRect();

        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;

        mouseControl = true;

    },
    { passive: false }
);


// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer() {

    let moveX = 0;
    let moveY = 0;

    // Keyboard movement
    if (leftPressed) {
        moveX -= KEY_MOVE_SPEED;
    }

    if (rightPressed) {
        moveX += KEY_MOVE_SPEED;
    }

    if (upPressed) {
        moveY -= KEY_VERTICAL_SPEED;
    }

    if (downPressed) {
        moveY += KEY_VERTICAL_SPEED;
    }

    playerX += moveX;
    playerY += moveY;


    // Mouse movement
    if (mouseControl) {

        const targetX = mouseX - PLAYER_WIDTH / 2;
        const targetY = mouseY - PLAYER_HEIGHT / 2;

        if (!leftPressed && !rightPressed) {
            playerX +=
                (targetX - playerX) *
                MOUSE_SMOOTHNESS;
        }

        if (!upPressed && !downPressed) {
            playerY +=
                (targetY - playerY) *
                MOUSE_SMOOTHNESS;
        }
    }


    // Nitro
    if (
        nitroPressed &&
        nitro > 0 &&
        !gameOver
    ) {

        nitroActive = true;

        playerY -= NITRO_POWER;

        nitro -= NITRO_CONSUMPTION;

        nitroEffectTimer = 12;

        if (nitro < 0) {
            nitro = 0;
        }

        createNitroParticles();

    } else {

        nitroActive = false;

        if (nitro < MAX_NITRO) {

            nitro += NITRO_RECHARGE;

            if (nitro > MAX_NITRO) {
                nitro = MAX_NITRO;
            }
        }
    }


    if (nitroEffectTimer > 0) {
        nitroEffectTimer--;
    }


    // Player boundaries
    const minX = roadLeft() + 10;
    const maxX =
        roadRight() -
        PLAYER_WIDTH -
        10;

    if (playerX < minX) {
        playerX = minX;
    }

    if (playerX > maxX) {
        playerX = maxX;
    }

    if (playerY < 90) {
        playerY = 90;
    }

    if (
        playerY >
        H - PLAYER_HEIGHT - 15
    ) {
        playerY =
            H - PLAYER_HEIGHT - 15;
    }
}


// ============================================================
// ENEMIES
// ============================================================

function createEnemy() {

    const laneCount = 4;
    const laneW = roadWidth() / laneCount;

    const lane =
        Math.floor(Math.random() * laneCount);

    const enemy = {

        x:
            roadLeft() +
            lane * laneW +
            laneW / 2 -
            27,

        y: -140,

        width: 54,
        height: 100,

        speed:
            getEnemySpeed() *
            (0.80 + Math.random() * 0.35),

        color: getRandomCarColor()

    };

    enemies.push(enemy);
}


function getRandomCarColor() {

    const colors = [
        "#e62828",
        "#2870f0",
        "#00be5a",
        "#ff9114",
        "#9632be",
        "#eeeeee",
        "#00b4c8"
    ];

    return colors[
        Math.floor(
            Math.random() * colors.length
        )
    ];
}


function updateEnemies() {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        enemy.y += enemy.speed;

        if (enemy.y > H + 150) {

            enemies.splice(i, 1);

            score++;

            if (score > highScore) {

                highScore = score;

                localStorage.setItem(
                    "carRacingHighScore",
                    highScore
                );
            }
        }
    }


    const spawnRate =
        Math.max(
            30,
            70 - Math.floor(score / 15)
        );

    if (
        frame % spawnRate === 0 &&
        enemies.length < 6
    ) {
        createEnemy();
    }
}


// ============================================================
// COLLISION
// ============================================================

function checkCollision() {

    if (invincibleTimer > 0) {
        return;
    }

    const playerRect = {

        x: playerX + 12,
        y: playerY + 12,

        width: PLAYER_WIDTH - 24,
        height: PLAYER_HEIGHT - 24

    };


    for (const enemy of enemies) {

        const enemyRect = {

            x: enemy.x + 12,
            y: enemy.y + 12,

            width: enemy.width - 24,
            height: enemy.height - 24

        };


        if (
            playerRect.x <
                enemyRect.x + enemyRect.width &&
            playerRect.x + playerRect.width >
                enemyRect.x &&
            playerRect.y <
                enemyRect.y + enemyRect.height &&
            playerRect.y + playerRect.height >
                enemyRect.y
        ) {

            hitPlayer();

            break;
        }
    }
}


function hitPlayer() {

    lives--;

    collisionFlash = 20;

    invincibleTimer = 120;

    nitro =
        Math.max(
            0,
            nitro - 20
        );

    createExplosion(
        playerX + PLAYER_WIDTH / 2,
        playerY + PLAYER_HEIGHT / 2
    );

    if (lives <= 0) {
        endGame();
    }
}


function endGame() {

    gameOver = true;
    gameStarted = false;
    nitroActive = false;

    clearKeys();

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "carRacingHighScore",
            highScore
        );
    }
}


// ============================================================
// TREES
// ============================================================

function createTrees() {

    trees.length = 0;

    for (let i = 0; i < 30; i++) {

        const leftSide =
            Math.random() < 0.5;

        trees.push({

            leftSide: leftSide,

            y:
                Math.random() * H,

            size:
                25 +
                Math.random() * 30,

            offset:
                Math.random() * 100

        });
    }
}


function updateTrees() {

    let speed =
        getEnemySpeed() * 0.65;

    if (nitroActive) {
        speed *= 1.3;
    }

    for (const tree of trees) {

        tree.y += speed;

        if (tree.y > H + 70) {

            tree.y = -70;

            tree.leftSide =
                Math.random() < 0.5;

            tree.offset =
                Math.random() * 100;
        }
    }
}


// ============================================================
// RAIN
// ============================================================

function createRain() {

    rainDrops.length = 0;

    for (let i = 0; i < 150; i++) {

        rainDrops.push({

            x:
                Math.random() * W,

            y:
                Math.random() * H,

            length:
                8 +
                Math.random() * 12,

            speed:
                5 +
                Math.random() * 5

        });
    }
}


function updateRain() {

    for (const drop of rainDrops) {

        drop.y += drop.speed;
        drop.x -= 1;

        if (drop.y > H) {

            drop.y = -20;

            drop.x =
                Math.random() * W;
        }
    }
}


// ============================================================
// ROAD UPDATE
// ============================================================

function updateRoad() {

    let speed = getEnemySpeed();

    if (nitroActive) {
        speed *= 1.35;
    }

    roadOffset += speed;

    if (roadOffset > 80) {
        roadOffset = 0;
    }
}


// ============================================================
// NITRO PARTICLES
// ============================================================

function createNitroParticles() {

    for (let i = 0; i < 3; i++) {

        particles.push({

            x:
                playerX +
                PLAYER_WIDTH / 2 +
                (Math.random() - 0.5) * 20,

            y:
                playerY +
                PLAYER_HEIGHT -

                Math.random() * 5,

            vx:
                (Math.random() - 0.5) * 2,

            vy:
                4 +
                Math.random() * 6,

            life: 20 +
                Math.random() * 15,

            size:
                3 +
                Math.random() * 6,

            type: "nitro"

        });
    }
}


// ============================================================
// EXPLOSION PARTICLES
// ============================================================

function createExplosion(x, y) {

    for (let i = 0; i < 20; i++) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            1 +
            Math.random() * 5;

        particles.push({

            x: x,
            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                25 +
                Math.random() * 20,

            size:
                3 +
                Math.random() * 6,

            type: "explosion"

        });
    }
}


function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === "nitro") {
            p.vy += 0.15;
        } else {
            p.vy += 0.08;
        }

        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


// ============================================================
// GAME UPDATE
// ============================================================

function updateGame() {

    if (
        !gameStarted ||
        gameOver ||
        paused
    ) {
        return;
    }

    frame++;

    updatePlayer();
    updateEnemies();
    checkCollision();
    updateTrees();
    updateRain();
    updateRoad();
    updateParticles();

    if (invincibleTimer > 0) {
        invincibleTimer--;
    }

    if (collisionFlash > 0) {
        collisionFlash--;
    }
}


// ============================================================
// DRAW BACKGROUND
// ============================================================

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    if (nightMode) {

        gradient.addColorStop(
            0,
            "#07111f"
        );

        gradient.addColorStop(
            1,
            "#142b35"
        );

    } else {

        gradient.addColorStop(
            0,
            "#62c95a"
        );

        gradient.addColorStop(
            1,
            "#2d8a3b"
        );
    }

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}


// ============================================================
// DRAW ROAD
// ============================================================

function drawRoad() {

    const left = roadLeft();
    const right = roadRight();

    // Road shadow
    ctx.fillStyle = "#111";

    ctx.fillRect(
        left - 7,
        0,
        right - left + 14,
        H
    );


    // Road
    const roadGradient =
        ctx.createLinearGradient(
            left,
            0,
            right,
            0
        );

    roadGradient.addColorStop(
        0,
        "#333"
    );

    roadGradient.addColorStop(
        0.5,
        "#444"
    );

    roadGradient.addColorStop(
        1,
        "#333"
    );

    ctx.fillStyle = roadGradient;

    ctx.fillRect(
        left,
        0,
        right - left,
        H
    );


    // Road edge lines
    ctx.fillStyle = "#f5f5f5";

    ctx.fillRect(
        left,
        0,
        5,
        H
    );

    ctx.fillRect(
        right - 5,
        0,
        5,
        H
    );


    // Lane lines
    const laneW =
        (right - left) / 4;

    ctx.fillStyle =
        "rgba(255,255,255,0.75)";

    for (let lane = 1; lane < 4; lane++) {

        const x =
            left +
            laneW * lane;

        for (
            let y = -80 + roadOffset;
            y < H + 80;
            y += 100
        ) {

            ctx.fillRect(
                x - 2,
                y,
                4,
                55
            );
        }
    }
}


// ============================================================
// DRAW TREES
// ============================================================

function drawTrees() {

    for (const tree of trees) {

        let x;

        if (tree.leftSide) {

            x =
                Math.max(
                    15,
                    roadLeft() -
                    45 -
                    tree.offset * 0.2
                );

        } else {

            x =
                Math.min(
                    W - 25,
                    roadRight() +
                    25 +
                    tree.offset * 0.2
                );
        }

        const y = tree.y;
        const s = tree.size;

        // Trunk
        ctx.fillStyle = "#6b4226";

        ctx.fillRect(
            x - 5,
            y + s * 0.35,
            10,
            s * 0.7
        );


        // Leaves
        ctx.beginPath();

        ctx.arc(
            x,
            y,
            s * 0.55,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            nightMode
                ? "#164d2b"
                : "#126b28";

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x - s * 0.35,
            y + s * 0.15,
            s * 0.4,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x + s * 0.35,
            y + s * 0.15,
            s * 0.4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// ============================================================
// DRAW ENEMY CARS
// ============================================================

function drawEnemy(enemy) {

    drawCar(
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height,
        enemy.color,
        false
    );
}


// ============================================================
// DRAW SPORTS CAR
// ============================================================

function drawCar(
    x,
    y,
    width,
    height,
    color,
    player
) {

    ctx.save();

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.4)";

    ctx.beginPath();

    ctx.ellipse(
        x + width / 2,
        y + height - 3,
        width * 0.55,
        height * 0.10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Nitro glow
    if (
        player &&
        nitroActive
    ) {
        drawNitroFlame(
            x,
            y,
            width,
            height
        );
    }


    // Wheels
    ctx.fillStyle = "#111";

    ctx.fillRect(
        x - 5,
        y + 22,
        9,
        28
    );

    ctx.fillRect(
        x - 5,
        y + height - 50,
        9,
        28
    );

    ctx.fillRect(
        x + width - 4,
        y + 22,
        9,
        28
    );

    ctx.fillRect(
        x + width - 4,
        y + height - 50,
        9,
        28
    );


    // Main body
    const bodyGradient =
        ctx.createLinearGradient(
            x,
            y,
            x + width,
            y
        );

    bodyGradient.addColorStop(
        0,
        darkenColor(color, 0.55)
    );

    bodyGradient.addColorStop(
        0.25,
        color
    );

    bodyGradient.addColorStop(
        0.5,
        lightenColor(color, 0.3)
    );

    bodyGradient.addColorStop(
        0.75,
        color
    );

    bodyGradient.addColorStop(
        1,
        darkenColor(color, 0.55)
    );

    ctx.fillStyle = bodyGradient;


    // Sports-car body
    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.18,
        y + height
    );

    ctx.lineTo(
        x + width * 0.08,
        y + height * 0.75
    );

    ctx.lineTo(
        x + width * 0.12,
        y + height * 0.28
    );

    ctx.quadraticCurveTo(
        x + width * 0.20,
        y + height * 0.08,
        x + width * 0.35,
        y + height * 0.04
    );

    ctx.lineTo(
        x + width * 0.65,
        y + height * 0.04
    );

    ctx.quadraticCurveTo(
        x + width * 0.80,
        y + height * 0.08,
        x + width * 0.88,
        y + height * 0.28
    );

    ctx.lineTo(
        x + width * 0.92,
        y + height * 0.75
    );

    ctx.lineTo(
        x + width * 0.82,
        y + height
    );

    ctx.closePath();

    ctx.fill();


    // Roof / cabin
    ctx.fillStyle =
        darkenColor(color, 0.35);

    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.24,
        y + height * 0.35
    );

    ctx.quadraticCurveTo(
        x + width * 0.30,
        y + height * 0.13,
        x + width * 0.50,
        y + height * 0.11
    );

    ctx.quadraticCurveTo(
        x + width * 0.70,
        y + height * 0.13,
        x + width * 0.76,
        y + height * 0.35
    );

    ctx.closePath();

    ctx.fill();


    // Windshield
    ctx.fillStyle = "#132a3b";

    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.29,
        y + height * 0.31
    );

    ctx.lineTo(
        x + width * 0.35,
        y + height * 0.17
    );

    ctx.lineTo(
        x + width * 0.65,
        y + height * 0.17
    );

    ctx.lineTo(
        x + width * 0.71,
        y + height * 0.31
    );

    ctx.closePath();

    ctx.fill();


    // Windshield reflection
    ctx.fillStyle =
        "rgba(255,255,255,0.35)";

    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.36,
        y + height * 0.19
    );

    ctx.lineTo(
        x + width * 0.56,
        y + height * 0.19
    );

    ctx.lineTo(
        x + width * 0.47,
        y + height * 0.29
    );

    ctx.closePath();

    ctx.fill();


    // Side windows
    ctx.fillStyle = "#102331";

    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.22,
        y + height * 0.35
    );

    ctx.lineTo(
        x + width * 0.30,
        y + height * 0.18
    );

    ctx.lineTo(
        x + width * 0.47,
        y + height * 0.32
    );

    ctx.closePath();

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.78,
        y + height * 0.35
    );

    ctx.lineTo(
        x + width * 0.70,
        y + height * 0.18
    );

    ctx.lineTo(
        x + width * 0.53,
        y + height * 0.32
    );

    ctx.closePath();

    ctx.fill();


    // Center racing stripe
    ctx.fillStyle =
        "rgba(255,255,255,0.65)";

    ctx.fillRect(
        x + width * 0.47,
        y + height * 0.39,
        width * 0.06,
        height * 0.55
    );


    // Front grille
    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.roundRect(
        x + width * 0.29,
        y + height * 0.80,
        width * 0.42,
        height * 0.10,
        5
    );

    ctx.fill();


    // Headlights
    ctx.fillStyle =
        "#fff5a8";

    ctx.shadowBlur = player ? 10 : 4;
    ctx.shadowColor = "#fff";

    ctx.beginPath();

    ctx.roundRect(
        x + width * 0.15,
        y + height * 0.72,
        width * 0.18,
        height * 0.10,
        4
    );

    ctx.fill();


    ctx.beginPath();

    ctx.roundRect(
        x + width * 0.67,
        y + height * 0.72,
        width * 0.18,
        height * 0.10,
        4
    );

    ctx.fill();

    ctx.shadowBlur = 0;


    // Rear lights
    ctx.fillStyle = "#ff2020";

    ctx.fillRect(
        x + width * 0.13,
        y + height * 0.90,
        width * 0.20,
        height * 0.055
    );

    ctx.fillRect(
        x + width * 0.67,
        y + height * 0.90,
        width * 0.20,
        height * 0.055
    );


    // Mirrors
    ctx.fillStyle =
        darkenColor(color, 0.4);

    ctx.fillRect(
        x - 3,
        y + height * 0.35,
        8,
        12
    );

    ctx.fillRect(
        x + width - 5,
        y + height * 0.35,
        8,
        12
    );


    // Body highlight
    ctx.strokeStyle =
        "rgba(255,255,255,0.35)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        x + width * 0.18,
        y + height * 0.45
    );

    ctx.lineTo(
        x + width * 0.22,
        y + height * 0.70
    );

    ctx.stroke();


    ctx.restore();
}


// ============================================================
// COLOR HELPERS
// ============================================================

function hexToRgb(hex) {

    if (typeof hex !== "string") {
        return {
            r: 100,
            g: 100,
            b: 100
        };
    }

    hex = hex.replace("#", "");

    if (hex.length === 3) {

        hex =
            hex[0] + hex[0] +
            hex[1] + hex[1] +
            hex[2] + hex[2];
    }

    const num =
        parseInt(hex, 16);

    return {

        r: (num >> 16) & 255,

        g: (num >> 8) & 255,

        b: num & 255
    };
}


function darkenColor(color, amount) {

    const rgb = hexToRgb(color);

    return `rgb(
        ${Math.floor(rgb.r * amount)},
        ${Math.floor(rgb.g * amount)},
        ${Math.floor(rgb.b * amount)}
    )`;
}


function lightenColor(color, amount) {

    const rgb = hexToRgb(color);

    return `rgb(
        ${Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount))},
        ${Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount))},
        ${Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount))}
    )`;
}


// ============================================================
// NITRO FLAME
// ============================================================

function drawNitroFlame(
    x,
    y,
    width,
    height
) {

    const centerX =
        x + width / 2;

    const bottomY =
        y + height;


    // Outer blue flame
    ctx.save();

    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00aaff";

    const gradient =
        ctx.createLinearGradient(
            centerX,
            bottomY,
            centerX,
            bottomY + 80
        );

    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        0.25,
        "#65e8ff"
    );

    gradient.addColorStop(
        0.65,
        "#008cff"
    );

    gradient.addColorStop(
        1,
        "rgba(0,80,255,0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.moveTo(
        centerX - width * 0.25,
        bottomY - 3
    );

    ctx.quadraticCurveTo(
        centerX - width * 0.15,
        bottomY + 40,
        centerX,
        bottomY + 75
    );

    ctx.quadraticCurveTo(
        centerX + width * 0.15,
        bottomY + 40,
        centerX + width * 0.25,
        bottomY - 3
    );

    ctx.closePath();

    ctx.fill();


    // Inner flame
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ffffff";

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.moveTo(
        centerX - width * 0.11,
        bottomY
    );

    ctx.quadraticCurveTo(
        centerX - width * 0.08,
        bottomY + 25,
        centerX,
        bottomY + 45
    );

    ctx.quadraticCurveTo(
        centerX + width * 0.08,
        bottomY + 25,
        centerX + width * 0.11,
        bottomY
    );

    ctx.closePath();

    ctx.fill();

    ctx.restore();
}


// ============================================================
// DRAW PARTICLES
// ============================================================

function drawParticles() {

    for (const p of particles) {

        const alpha =
            Math.max(
                0,
                p.life / 35
            );

        ctx.globalAlpha = alpha;

        if (p.type === "nitro") {

            ctx.fillStyle = "#43d9ff";

        } else {

            ctx.fillStyle =
                p.life % 2 === 0
                    ? "#ffb300"
                    : "#ff4d00";
        }

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}


// ============================================================
// DRAW RAIN
// ============================================================

function drawRain() {

    if (!rainMode) {
        return;
    }

    ctx.strokeStyle =
        nightMode
            ? "rgba(150,200,255,0.45)"
            : "rgba(220,240,255,0.45)";

    ctx.lineWidth = 1;

    for (const drop of rainDrops) {

        ctx.beginPath();

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 2,
            drop.y + drop.length
        );

        ctx.stroke();
    }
}


// ============================================================
// HUD
// ============================================================

function drawHUD() {

    ctx.save();

    // Score box
    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.roundRect(
        15,
        15,
        160,
        105,
        15
    );

    ctx.fill();


    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 18px Arial";

    ctx.fillText(
        "SCORE",
        30,
        42
    );

    ctx.font =
        "bold 30px Arial";

    ctx.fillText(
        score,
        30,
        73
    );

    ctx.font =
        "bold 14px Arial";

    ctx.fillText(
        "BEST: " + highScore,
        30,
        98
    );


    // Speed
    const speedText =
        getDisplaySpeed() +
        " KM/H";

    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.roundRect(
        W - 175,
        15,
        160,
        70,
        15
    );

    ctx.fill();

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 14px Arial";

    ctx.fillText(
        "SPEED",
        W - 155,
        40
    );

    ctx.font =
        "bold 25px Arial";

    ctx.fillText(
        speedText,
        W - 155,
        68
    );


    // Lives
    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.roundRect(
        15,
        135,
        160,
        45,
        12
    );

    ctx.fill();

    ctx.fillStyle = "#ff4d4d";

    ctx.font =
        "bold 19px Arial";

    ctx.fillText(
        "♥".repeat(Math.max(0, lives)),
        30,
        165
    );


    // Nitro
    const barWidth =
        Math.min(
            260,
            W * 0.30
        );

    const barX =
        W / 2 -
        barWidth / 2;

    const barY = 20;

    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    ctx.roundRect(
        barX,
        barY,
        barWidth,
        28,
        14
    );

    ctx.fill();


    ctx.fillStyle =
        nitroActive
            ? "#28d9ff"
            : "#087fff";

    ctx.roundRect(
        barX + 3,
        barY + 3,
        (barWidth - 6) *
            (nitro / MAX_NITRO),
        22,
        11
    );

    ctx.fill();


    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "NITRO",
        W / 2,
        barY + 19
    );

    ctx.textAlign = "left";

    ctx.restore();
}


// ============================================================
// START SCREEN
// ============================================================

function drawStartScreen() {

    ctx.fillStyle =
        "rgba(0,0,0,0.60)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    ctx.textAlign = "center";

    ctx.fillStyle = "#fff";

    ctx.font =
        `bold ${Math.min(55, W * 0.10)}px Arial`;

    ctx.fillText(
        "CAR RACING",
        W / 2,
        H * 0.35
    );


    ctx.font =
        "bold 20px Arial";

    ctx.fillStyle = "#54d9ff";

    ctx.fillText(
        "PRESS ENTER OR CLICK TO START",
        W / 2,
        H * 0.46
    );


    ctx.font =
        "16px Arial";

    ctx.fillStyle = "#fff";

    ctx.fillText(
        "Arrow Keys / WASD / Mouse / Touch",
        W / 2,
        H * 0.53
    );

    ctx.fillText(
        "SPACE = NITRO",
        W / 2,
        H * 0.58
    );

    ctx.textAlign = "left";
}


// ============================================================
// PAUSE SCREEN
// ============================================================

function drawPauseScreen() {

    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 45px Arial";

    ctx.fillText(
        "PAUSED",
        W / 2,
        H / 2
    );

    ctx.font =
        "18px Arial";

    ctx.fillText(
        "Press P or Pause to continue",
        W / 2,
        H / 2 + 45
    );

    ctx.textAlign = "left";
}


// ============================================================
// GAME OVER SCREEN
// ============================================================

function drawGameOverScreen() {

    ctx.fillStyle =
        "rgba(0,0,0,0.70)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff4444";

    ctx.font =
        `bold ${Math.min(50, W * 0.10)}px Arial`;

    ctx.fillText(
        "GAME OVER",
        W / 2,
        H * 0.36
    );


    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 25px Arial";

    ctx.fillText(
        "SCORE: " + score,
        W / 2,
        H * 0.45
    );


    ctx.font =
        "18px Arial";

    ctx.fillText(
        "BEST: " + highScore,
        W / 2,
        H * 0.50
    );


    ctx.fillStyle = "#54d9ff";

    ctx.font =
        "bold 19px Arial";

    ctx.fillText(
        "PRESS R OR ENTER TO RESTART",
        W / 2,
        H * 0.60
    );

    ctx.textAlign = "left";
}


// ============================================================
// MAIN DRAW
// ============================================================

function drawGame() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    drawBackground();

    drawTrees();

    drawRoad();


    // Enemy cars
    for (const enemy of enemies) {
        drawEnemy(enemy);
    }


    // Player blinking after collision
    if (
        invincibleTimer === 0 ||
        Math.floor(invincibleTimer / 6) % 2 === 0
    ) {

        drawCar(
            playerX,
            playerY,
            PLAYER_WIDTH,
            PLAYER_HEIGHT,
            "#e52b2b",
            true
        );
    }


    drawParticles();

    drawRain();

    drawHUD();


    // Collision flash
    if (collisionFlash > 0) {

        ctx.fillStyle =
            `rgba(255,40,40,${collisionFlash / 45})`;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }


    if (!gameStarted && !gameOver) {
        drawStartScreen();
    }


    if (paused) {
        drawPauseScreen();
    }


    if (gameOver) {
        drawGameOverScreen();
    }
}


// ============================================================
// CLICK TO START
// ============================================================

canvas.addEventListener("click", function () {

    canvas.focus();

    if (!gameStarted && !gameOver) {
        startGame();
    }

});


// ============================================================
// FULLSCREEN SUPPORT
// ============================================================

function requestGameFullscreen() {

    const wrapper =
        document.getElementById("gameWrapper");

    if (!document.fullscreenElement) {

        if (wrapper && wrapper.requestFullscreen) {

            wrapper.requestFullscreen()
                .catch(() => {});

        } else if (canvas.requestFullscreen) {

            canvas.requestFullscreen()
                .catch(() => {});
        }

    } else {

        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}


// ============================================================
// MOBILE / TOUCH SAFETY
// ============================================================

document.addEventListener(
    "touchend",
    function () {

        // Do not release keyboard states here.
        // Mobile buttons handle their own state.

    },
    { passive: true }
);


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop() {

    updateGame();

    drawGame();

    requestAnimationFrame(gameLoop);
}


// ============================================================
// INITIALIZE
// ============================================================

createTrees();
createRain();

playerX =
    W / 2 -
    PLAYER_WIDTH / 2;

playerY =
    H -
    PLAYER_HEIGHT -
    35;

gameLoop();