const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const images = {};

const entities = [];

let playerX = 0;
let playerY = 0;
let horizontal = 0;
let vertical = 0;
const playerSpeed = 300;

let scrollX = 0;
let scrollY = 0;

let lastTick = 0;
let timeScale = 1;
let renderScale = 1;

let score = 0;
let highScore = 0;
let dead = false;
let deathAStart;
let deathAEnd;

let bugyi1 = 0;
let bugyi2 = 0;
let bugyi3 = 0;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
async function requestImages() {
    const paths = {
        'player': 'src/player.png',
        'chainsaw': 'src/chainsaw.png'
    }
    let loaded = 0;

    for (const [id, path] of Object.entries(paths)) {
        images[id] = new Image();
        images[id].src = path;
        images[id].addEventListener('load', () => loaded++);
    }

    const promises = Array.from(images).map(img =>
        new Promise(resolve => {
            if (img.complete)
                resolve();
            else
                img.addEventListener('load', resolve, { once: true });
        })
    );

    return Promise.all(promises);
}
function restartGame() {
    Object.keys(keys).forEach(key => delete keys[key]);
    entities.length = 0;
    scrollX = 0;
    scrollY = 0;
    playerX = 0;
    playerY = 0;
    horizontal = 0;
    vertical = 0;
    score = 0;
    dead = false;

    //spawnPlayerEntity();
    spawnEnemies(1000, 16_000, 400, 400);
}
function startGame() {
    restartGame();

    requestImages().then(() => {
        loop();
    });
}
function spawnEnemies(amount, scatter, nsW, nsH) {
    for (let i = 0; i < amount; i++) {
        let x = Math.random() * scatter * 2 - scatter;
        let y = Math.random() * scatter * 2 - scatter;
        const height = 230;
        const width = 3 / 2 * height;

        if (Math.abs(x) < nsW && Math.abs(y) < nsH) {
            i--;
            console.log('Skipped because ' + x + ' a ' + y);
            continue;
        }

        entities.push(new ChainsawEnemy(x, y, width, height, 120));
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

startGame()

function loop() {
    let dt = Math.min(0.05, (performance.now() - lastTick) / 1000);
    lastTick = performance.now();

    try {
        gameloop(dt * timeScale);
        render(dt * timeScale);
        
        processKeys();
    }
    catch(e){
        console.error(e);
    }

    requestAnimationFrame(loop);
}

function gameloop(dt) {
    if (timeScale === 0)
        return;

    if (dead) {
        timeScale *= .97;

        if (timeScale < .01)
            timeScale = 0;
    }
    else {
        horizontal += (keys['KeyA'] ? -1 : 0) + (keys['KeyD'] ? 1 : 0);
        horizontal = Math.max(-1, Math.min(1, horizontal))

        vertical += (keys['KeyS'] ? -1 : 0) + (keys['KeyW'] ? 1 : 0);
        vertical = Math.max(-1, Math.min(1, vertical))

        // Top - down coordinates
        playerX += horizontal * playerSpeed * dt;
        playerY -= vertical * playerSpeed * dt;
    }

    const damping = .94;
    horizontal *= damping;
    vertical *= damping;

    entities.forEach(e => {
        e.update(dt);
/*
        // Check if an enemy is touching the player
        if (!dead && sqrDistance(playerX, playerY, e.x, e.y) < 150 * 150 && dt !== 0)
            die();*/
    });

    scrollX += (playerX - scrollX) * .2;
    scrollY += (playerY - scrollY) * .2;

    if (!dead)
        score += dt;
}

function render(dt) {
    ctx.save();
    ctx.scale(renderScale, renderScale);
    // Bg
    ctx.fillStyle = "#86d5f7";
    ctx.fillRect(0, 0, canvas.width / renderScale, canvas.height / renderScale);

    ctx.strokeStyle = 'black';

    ctx.beginPath();
    ctx.moveTo(translateX(), 0);
    ctx.lineTo(translateX(), canvas.height);
    ctx.stroke()

    ctx.beginPath();
    ctx.moveTo(0, translateY());
    ctx.lineTo(canvas.width, translateY());
    ctx.stroke()

    entities.forEach(e => e.render(ctx, dt, images));

    ctx.fillStyle = 'black';

    ctx.font = "20px Arial";
    ctx.fillText(`Delta: ${dt.toFixed(4)} FPS: ${(1 / dt).toFixed(2)}`, 10, 80);
    ctx.fillText(`Player(xy): ${playerX.toFixed(2)} ${playerY.toFixed(2)}`, 10, 120);
    ctx.fillText(`Scroll(xy): ${scrollX.toFixed(2)} ${scrollY.toFixed(2)}`, 10, 140);
    ctx.fillText(`Input(xy):  ${horizontal.toFixed(2)} ${vertical.toFixed(2)}`, 10, 200);


    ctx.fillText(`H key down:  ${getKeydown(KeyCode.KeyH)}     ${bugyi1}`, 10, 400);
    ctx.fillText(`H key pres:  ${getKey(KeyCode.KeyH)}     ${bugyi2}`, 10, 450);
    ctx.fillText(`H key rele:  ${getKeyup(KeyCode.KeyH)}     ${bugyi3}`, 10, 500);

    if(getKeydown(KeyCode.KeyH))
        bugyi1++;
    if(getKey(KeyCode.KeyH))
        bugyi2++;
    if(getKeyup(KeyCode.KeyH))
        bugyi3++;

    {
        ctx.font = "56px Arial";
        let text = `SCORE: ${score.toFixed(2)}`
        let width = ctx.measureText(text).width;

        ctx.fillText(text, canvas.width / 2 - width / 2, 60);

        ctx.font = "32px Arial";
        text = `HIGHEST: ${highScore.toFixed(2)}`
        width = ctx.measureText(text).width;

        ctx.fillText(text, canvas.width / 2 - width / 2, 100);
    }

    const playerHeight = 230;
    const playerWidth = 25 / 39 * playerHeight;

    ctx.drawImage(images['player'], translateX(playerX - playerWidth / 2), translateY(playerY - playerHeight / 2), playerWidth, playerHeight);

    if (dead && Date.now() >= deathAStart) {
        ctx.font = "120px Arial";
        let text = 'YOU DIED!';
        let width = ctx.measureText(text).width;
        
        let t = Math.min(1, (Date.now() - deathAStart) / (deathAEnd - deathAStart));
        let y = canvas.height / 2 - 100 - interpolate(t, 4) * 100;
        let x = canvas.width / 2 - width / 2;
        
        ctx.fillStyle = `rgba(236, 23, 16, ${t.toFixed(2)})`;
        ctx.fillText(text, x, y);
    }

    ctx.restore();
}

function die() {
    highScore = Math.max(highScore, score);
    dead = true;
    deathAStart = Date.now() + 500;
    deathAEnd = deathAStart + 1000;
}

// Transformation functions

function interpolate(t, s) { return 1 - Math.pow(1 - t, s); }
// Translate world space -> screen space
function translateX(x = 0) { return x - scrollX + canvas.width / 2 / renderScale; }
function translateY(y = 0) { return y - scrollY + canvas.height / 2 / renderScale; }
function angleTowards(x1, y1, x2, y2) { return Math.atan2(y1 - y2, x1 - x2) }
function moveDirection(angle, magnitude) { return [Math.cos(angle) * magnitude, Math.sin(angle) * magnitude]; }
function sqrDistance(x1, y1, x2, y2) { return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2); }
function deg(r) { return Math.PI / 180 * r; }
function rad(d) { return 180 / Math.PI * d; }
function AABB(x1, y1, width1, height1, x2, y2, width2, height2) { return (x1 < x2 + width2 && x1 + width1 > x2) && (y1 < y2 + height2 && y1 + height1 > y2); }
function AABBPoint(x, y, width, height, px, py) { return (px < x + width && px > x) && (py < y + height && py > y) }