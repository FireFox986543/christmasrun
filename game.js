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

// Use this if referencing canvas' size in rendering loops! instead of canvas.width/height!
let canvasSize = Size.zero;

let nextEnemy = 1000;
let enemySpawnRate = 60;
let enemySpawnIncrease = 1

let bugyi1 = 0;
let bugyi2 = 0;
let bugyi3 = 0;

let lbugyi1 = 0;
let lbugyi2 = 0;
let lbugyi3 = 0;

const DEBUG = true;

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    console.log('resized');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvasSize = new Size(rect.width, rect.height);

    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
    }
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

    // Keep highscore across multiple restarts
    let highScore = player === undefined ? 0 : player.highScore;

    //ChainsawEnemy.setValues(60, 10, 8, .95);
    entities.push(new ChainsawEnemy(new Point(500, 500), new Size(200, 200), 0));
    spawnPlayer();
    //spawnEnemies(10, 3000, 400, 400);
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
    let x = Math.random() * canvasSize.width + (Math.random() >= .5 ? 1 : -1) * canvasSize.width;
    let y = Math.random() * canvasSize.height + (Math.random() >= .5 ? 1 : -1) * canvasSize.height;

    // Spawn enemies relative to player -> add player pos to position
    entities.push(new ChainsawEnemy(new Point(x, y).add(player.position), new Size(200, 200)));
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
    if (performance.now() >= nextEnemy) {
        spawnEnemyAround();
        nextEnemy += enemySpawnRate;
        enemySpawnRate *= enemySpawnIncrease;
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
    ctx.save();

    // Clear, Render background
    ctx.fillStyle = "#86d5f7";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Render xy axis lines
    if (DEBUG) {
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(translateX(), 0);
        ctx.lineTo(translateX(), canvasSize.height);
        ctx.stroke()
        ctx.beginPath();
        ctx.moveTo(0, translateY());
        ctx.lineTo(canvasSize.width, translateY());
        ctx.stroke()
    }

    let culled = 0;
    // Render entities
    entities.forEach(e => {
        if (!isCulled(translatePoint(e.position), e.size))
            e.render(ctx, dt, images);
        else
            culled++;
    });

    // Render debug entries
    ctx.fillStyle = 'black';
    if (DEBUG) {

        ctx.font = "20px Arial";
        ctx.fillText(`Entities: ${entities.length}   culled: ${culled}`, 10, 40);
        ctx.fillText(`Delta: ${dt.toFixed(4)} FPS: ${(1 / dt).toFixed(2)}`, 10, 80);
        ctx.fillText(`Player(xy): ${player.position.x.toFixed(2)} ${player.position.y.toFixed(2)}`, 10, 120);
        ctx.fillText(`Scroll(xy): ${scrollX.toFixed(2)} ${scrollY.toFixed(2)}`, 10, 140);
        ctx.fillText(`Input(xy):  ${horizontal.toFixed(2)} ${vertical.toFixed(2)}`, 10, 200);
        ctx.fillText(`Enemy speed:  ${ChainsawEnemy.baseSpeed}`, 10, 240);

        ctx.fillText(`H key down:  ${getKeyDown(KeyCode.KeyH)}     ${bugyi1}`, 10, 400);
        ctx.fillText(`H key pres:  ${getKey(KeyCode.KeyH)}     ${bugyi2}`, 10, 450);
        ctx.fillText(`H key rele:  ${getKeyUp(KeyCode.KeyH)}     ${bugyi3}`, 10, 500);

        ctx.fillText(`L button down:  ${getMouseButtonDown(MouseButtons.Left)}     ${lbugyi1}`, 10, 600);
        ctx.fillText(`L button pres:  ${getMouseButton(MouseButtons.Left)}     ${lbugyi2}`, 10, 650);
        ctx.fillText(`L button rele:  ${getMouseButtonUp(MouseButtons.Left)}     ${lbugyi3}`, 10, 700);

        if (getKeyDown(KeyCode.KeyH))
            bugyi1++;
        if (getKey(KeyCode.KeyH))
            bugyi2++;
        if (getKeyUp(KeyCode.KeyH))
            bugyi3++;

        if (getMouseButtonDown(MouseButtons.Left))
            lbugyi1++;
        if (getMouseButton(MouseButtons.Left))
            lbugyi2++;
        if (getMouseButtonUp(MouseButtons.Left))
            lbugyi3++;
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
        let startX = canvasSize.width / 2 - width / 2;

        outlinedText(ctx, startX, 70, 0, 3, leftText); // Draw leftText (SCORE: )
        startX = canvasSize.width / 2 + width / 2 - digitWidth * sc.length; // Start after leftText
        let delta = 0;
        // Draw each number with a fixed width
        for (let i = 0; i < sc.length; i++) {
            outlinedText(ctx, startX + delta, 70, 0, 3, sc[i]);
            delta += sc[i] === '.' ? digitWidth / 2 : digitWidth; // Half size for .
        }

        ctx.font = "52px 'Jersey 10'";
        let text = `HIGHEST:  ${player.highScore.toFixed(2)}`
        width = ctx.measureText(text).width;

        outlinedText(ctx, canvasSize.width / 2 - width / 2, 120, 0, 2, text);
    }

    // Render lives
    {
        const max = 3;
        const size = 48;
        const y = 150;
        const gap = 10;
        const startX = canvasSize.width / 2 - (max * size + (max - 1) * gap) / 2;

        for (let i = 0; i < max; i++) {
            ctx.drawImage(images['ornament' + (i < player.lives ? '1' : '2')], startX + (size + gap) * i, y, size, size);
        }
    }

    if (player.dead && Date.now() >= player.deathAStart) {
        ctx.font = "164px 'Jersey 10'";
        let text = 'YOU  DIED!';
        let width = ctx.measureText(text).width;

        let t = Math.min(1, (Date.now() - player.deathAStart) / (player.deathAEnd - player.deathAStart));
        let y = canvasSize.height / 2 - interpolate(t, 4) * 100;
        let x = canvasSize.width / 2 - width / 2;

        ctx.lineWidth = 20;
        ctx.strokeStyle = `rgba(222, 42, 26, ${t.toFixed(2)})`;
        ctx.fillStyle = `rgba(255, 255, 255, ${t.toFixed(2)})`;
        outlinedText(ctx, x, y, 0, 5, text);
    }

    // Render mouse pointer
    ctx.drawImage(images['pointer1'], mousePosition.x, mousePosition.y, 80, 80);

    ctx.restore();
}

// Transformation functions

function interpolate(t, s) { return 1 - Math.pow(1 - t, s); }
// Translate world space -> screen space
function translatePoint(p) { return new Point(translateX(p.x), translateY(p.y)); }
function translateX(x = 0) { return x - scrollX + canvasSize.width / 2; }
function translateY(y = 0) { return y - scrollY + canvasSize.height / 2; }
// Translate screen space -> world space
function revTranslatePoint(p) { return new Point(revTranslateX(p.x), revTranslateY(p.y)); }
function revTranslateX(x = 0) { return x + scrollX - canvasSize.width / 2; }
function revTranslateY(y = 0) { return y + scrollY - canvasSize.height / 2; }
function angleTowards(a, b) { return Math.atan2(a.y - b.y, a.x - b.x) }
function moveDirection(angle, magnitude) { return new Point(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude); }
function sqrDistance(a, b) { return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2); }
function deg(r) { return Math.PI / 180 * r; }
function rad(d) { return 180 / Math.PI * d; }
function AABB(x1, y1, width1, height1, x2, y2, width2, height2) { return (x1 < x2 + width2 && x1 + width1 > x2) && (y1 < y2 + height2 && y1 + height1 > y2); }
function AABBPoint(x, y, width, height, px, py) { return (px < x + width && px > x) && (py < y + height && py > y) }
function isCulled(point, size) {
    return point.x + size.width / 2 < 0 || point.x - size.width / 2 > canvasSize.width ||
        point.y + size.height / 2 < 0 || point.y - size.height / 2 > canvasSize.height;
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