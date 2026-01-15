const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const images = {};

const entities = [];
let player;

let horizontal = 0;
let vertical = 0;

let scrollX = 0;
let scrollY = 0;

let gameTime = 0;
let lastTick = 0;
let timeScale = 1;

let nextEnemy = 1000;
let enemySpawnRate = 400;
let nextRateIncrease = 10000;
let enemyRateIncrease = 6000;

let DEBUG = true;
let enemySpawning = true;

window.addEventListener("resize", resizeCanvas);

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;
let visibleWidth = 0;
let visibleHeight = 0;
let viewLeft = 0;
let viewRight = 0;
let viewTop = 0;
let viewBottom = 0;
const viewport = {
    rect: undefined,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    cssWidth: 0,
    cssHeight: 0
};

function resizeCanvas() {
    // WARNING: a ton of hard to understand math here:
    // If you DON'T want future HEADACHES, don't ever ever touch this
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    viewport.rect = rect;
    viewport.scale = rect.height / VIRTUAL_HEIGHT

    viewport.offsetX = (rect.width - VIRTUAL_WIDTH * viewport.scale) / 2;
    viewport.offsetY = (rect.height - VIRTUAL_HEIGHT * viewport.scale) / 2;

    visibleWidth = rect.width / viewport.scale;
    visibleHeight = rect.height / viewport.scale;
    const visibleX = -viewport.offsetX / viewport.scale;
    const visibleY = -viewport.offsetY / viewport.scale;
    viewLeft = visibleX;
    viewTop = visibleY;
    viewRight = visibleX + visibleWidth;
    viewBottom = visibleY + visibleHeight;

    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);

    ctx.imageSmoothingEnabled = false;
}
async function requestImages() {
    const paths = {
        'player': 'src/pixelPlayer.png',
        'chainsaw': 'src/pixelChainsaw.png',
        'pointer1': 'src/pointer1.png',
        'pointer2': 'src/pointer2.png',
        'ornament1': 'src/ornament.png',
        'ornament2': 'src/ornamentDark.png',
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
    timeScale = 1;
    gameTime = 0;
    nextEnemy = 10;
    enemySpawnRate = .4;
    nextRateIncrease = 10;
    enemyRateIncrease = 6;

    // Keep highscore across multiple restarts
    let highScore = player === undefined ? 0 : player.highScore;

    if (enemySpawning)
        spawnEnemies(20, 2000, 400, 400);

    //entities.push(new ChainsawEnemy(new Point(200, 200), new Size(200, 200), 0));
    spawnPlayer();
    player.highScore = highScore;
}
function startGame() {
    restartGame();

    requestImages().then(() => {
        loop();
    });
}
function spawnPlayer() {
    player = new PlayerEntity(new Point(0, 0), new Size(230, 230), 200);
    entities.push(player);
}
function spawnEnemies(amount, scatter, nsW, nsH) {
    for (let i = 0; i < amount; i++) {
        let x = Math.random() * scatter * 2 - scatter;
        let y = Math.random() * scatter * 2 - scatter;

        if (Math.abs(x) < nsW && Math.abs(y) < nsH) {
            i--;
            console.log('Skipped because ' + x + ' a ' + y);
            continue;
        }

        entities.push(new ChainsawEnemy(new Point(x, y), new Size(200, 200)));
    }
}
function spawnEnemyAround() {
    const angle = Math.random() * Math.PI * 2;
    const point = moveDirection(angle, Math.max(VIRTUAL_WIDTH, VIRTUAL_HEIGHT) + 300);

    // Spawn enemies relative to player -> add player pos to position
    entities.push(new ChainsawEnemy(player.position.add(point), new Size(200, 200)));
}

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
    catch (e) {
        console.error(e);
    }

    gameTime += dt;
    requestAnimationFrame(loop);
}

function gameloop(dt) {

    if (getKeyDown(KeyCode.KeyF1))
        DEBUG = !DEBUG;

    if (timeScale === 0)
        return;

    if (player.dead) {
        timeScale *= .97;

        if (timeScale < .01)
            timeScale = 0;
    }
    else {
        horizontal += (getKey(KeyCode.KeyA) ? -1 : 0) + (getKey(KeyCode.KeyD) ? 1 : 0);
        horizontal = Math.max(-1, Math.min(1, horizontal))

        vertical += (getKey(KeyCode.KeyS) ? -1 : 0) + (getKey(KeyCode.KeyW) ? 1 : 0);
        vertical = Math.max(-1, Math.min(1, vertical))

        player.syncInput(horizontal, vertical);
    }

    const damping = .94;
    horizontal *= damping;
    vertical *= damping;

    // Spawn enemies
    if (gameTime >= nextRateIncrease) {
        enemySpawnRate = Math.max(.180, enemySpawnRate - .5);
        nextRateIncrease += enemyRateIncrease;
    }
    if (enemySpawning && gameTime >= nextEnemy) {
        spawnEnemyAround();
        nextEnemy += enemySpawnRate;
    }

    ChainsawEnemy.staticUpdate(dt);

    entities.forEach(e => {
        e.update(dt);
    });

    scrollX += (player.position.x - scrollX) * .2;
    scrollY += (player.position.y - scrollY) * .2;

    if (!player.isImmune)
        player.score += dt;
}

function render(dt) {
    // Clear, Render background
    ctx.fillStyle = "#86d5f7";
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Render xy axis lines
    if (DEBUG) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(translateX(), viewTop);
        ctx.lineTo(translateX(), viewTop + visibleHeight);
        ctx.stroke()
        ctx.beginPath();
        ctx.moveTo(viewLeft, translateY());
        ctx.lineTo(viewLeft + visibleWidth, translateY());
        ctx.stroke()
    }

    // Render entities
    const transf = ctx.getTransform();
    let culled = 0;
    entities.forEach(e => {
        if (!isCulled(translatePoint(e.position), e.size)) {
            e.render(ctx, dt, images, transf);
            ctx.setTransform(transf); // Reset the transform after every entity
        }
        else
            culled++;
    });

    // Render debug entries
    if (DEBUG) {
        ctx.fillStyle = 'black';
        ctx.font = "20px Arial";
        const x = viewLeft + 10;
        ctx.fillText(`Entities: ${entities.length}   culled: ${culled}`, x, 40);
        ctx.fillText(`Delta: ${dt.toFixed(4)} FPS: ${(1 / dt).toFixed(2)}`, x, 80);
        ctx.fillText(`Player(xy): ${player.position.x.toFixed(2)} ${player.position.y.toFixed(2)}`, x, 120);
        ctx.fillText(`Scroll(xy): ${scrollX.toFixed(2)} ${scrollY.toFixed(2)}`, x, 140);
        ctx.fillText(`Input(xy):  ${horizontal.toFixed(2)} ${vertical.toFixed(2)}`, x, 200);
        ctx.fillText(`Enemy speed:  ${ChainsawEnemy.baseSpeed}`, x, 240);

        {
            ctx.textAlign = 'right';
            let x = viewRight - 20;

            ctx.fillText(`Enemy spawn rate: ${enemySpawnRate}`, x, 100);
            ctx.fillText(`Enemy spawnrt inc: ${enemyRateIncrease}`, x, 120);
        }

        ctx.textAlign = 'left';
    }

    // Render scores
    {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#062a48';
        ctx.lineWidth = 16;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.miterLimit = 2;
        ctx.font = "100px 'Jersey 10'";

        const digitWidth = 52;
        const sc = player.score.toFixed(2);
        const leftText = 'SCORE:   ';
        let width = ctx.measureText(leftText).width + digitWidth * sc.length;
        let startX = VIRTUAL_WIDTH / 2 - width / 2;

        outlinedText(ctx, startX, 70, 0, 3, leftText); // Draw leftText (SCORE: )
        startX = VIRTUAL_WIDTH / 2 + width / 2 - digitWidth * sc.length; // Start after leftText
        let delta = 0;
        // Draw each number with a fixed width
        for (let i = 0; i < sc.length; i++) {
            outlinedText(ctx, startX + delta, 70, 0, 3, sc[i]);
            delta += sc[i] === '.' ? digitWidth / 2 : digitWidth; // Half size for .
        }

        ctx.font = "52px 'Jersey 10'";
        let text = `HIGHEST:  ${player.highScore.toFixed(2)}`
        width = ctx.measureText(text).width;

        outlinedText(ctx, VIRTUAL_WIDTH / 2 - width / 2, 120, 0, 2, text);
    }

    // Render lives
    {
        const max = 3;
        const size = 48;
        const y = 150;
        const gap = 10;
        const startX = VIRTUAL_WIDTH / 2 - (max * size + (max - 1) * gap) / 2;

        for (let i = 0; i < max; i++) {
            ctx.drawImage(images['ornament' + (i < player.lives ? '1' : '2')], startX + (size + gap) * i, y, size, size);
        }
    }

    if (player.dead && Date.now() >= player.deathAStart) {
        ctx.font = "164px 'Jersey 10'";
        let text = 'YOU  DIED!';
        let width = ctx.measureText(text).width;

        let t = Math.min(1, (Date.now() - player.deathAStart) / (player.deathAEnd - player.deathAStart));
        let y = VIRTUAL_HEIGHT / 2 - interpolate(t, 4) * 100;
        let x = VIRTUAL_WIDTH / 2 - width / 2;

        ctx.lineWidth = 20;
        ctx.strokeStyle = `rgba(222, 42, 26, ${t.toFixed(2)})`;
        ctx.fillStyle = `rgba(255, 255, 255, ${t.toFixed(2)})`;
        outlinedText(ctx, x, y, 0, 5, text);
    }

    // Render mouse pointer
    ctx.drawImage(images['pointer1'], mousePosition.x, mousePosition.y, 80, 80);
}

// Transformation functions

function interpolate(t, s) { return 1 - Math.pow(1 - t, s); }
// Translate world space -> screen space
function translatePoint(p) { return new Point(translateX(p.x), translateY(p.y)); }
function translateX(x = 0) { return x - scrollX + VIRTUAL_WIDTH / 2; }
function translateY(y = 0) { return y - scrollY + VIRTUAL_HEIGHT / 2; }
// Translate screen space -> world space
function revTranslatePoint(p) { return new Point(revTranslateX(p.x), revTranslateY(p.y)); }
function revTranslateX(x = 0) { return x + scrollX - VIRTUAL_WIDTH / 2; }
function revTranslateY(y = 0) { return y + scrollY - VIRTUAL_HEIGHT / 2; }
function angleTowards(a, b) { return Math.atan2(a.y - b.y, a.x - b.x) }
function moveDirection(angle, magnitude) { return new Point(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude); }
function sqrDistance(a, b) { return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2); }
function deg(r) { return Math.PI / 180 * r; }
function rad(d) { return 180 / Math.PI * d; }
function AABB(x1, y1, width1, height1, x2, y2, width2, height2) { return (x1 < x2 + width2 && x1 + width1 > x2) && (y1 < y2 + height2 && y1 + height1 > y2); }
function AABBPoint(x, y, width, height, px, py) { return (px < x + width && px > x) && (py < y + height && py > y) }
function isCulled(point, size) {
    return point.x + size.width / 2 < viewLeft || point.x - size.width / 2 > viewLeft + visibleWidth ||
        point.y + size.height / 2 < viewTop || point.y - size.height / 2 > viewTop + visibleHeight;
}

// Extra utilities
function fraction(n) { return n - Math.trunc(n) };
function fillCirlce(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '';
    ctx.fillStyle = color;
    ctx.fill();
}
function strokeCirlce(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.fillStyle = '';
    ctx.stroke();
}
function outlinedText(ctx, x, y, offsetX, offsetY, text) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(text, x + offsetX, y + offsetY);
    ctx.fillText(text, x, y);
}
function line(ctx, point1, point2, color) {
    let before = ctx.strokeStyle;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke()
    ctx.strokeStyle = before;
}