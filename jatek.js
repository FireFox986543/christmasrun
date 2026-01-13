const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const images = {};

const entities = [];
let player;

let horizontal = 0;
let vertical = 0;

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

let lbugyi1 = 0;
let lbugyi2 = 0;
let lbugyi3 = 0;

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
        'chainsaw': 'src/chainsaw.png',
        'pointer1': 'src/pointer1.png',
        'pointer2': 'src/pointer2.png',
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
    horizontal = 0;
    vertical = 0;
    score = 0;
    dead = false;

    //entities.push(new ChainsawEnemy(new Point(0, 0), new Size(3 / 2 * 230, 230), 120));
    spawnEnemies(1000, 16_000, 400, 400);
    spawnPlayer();
}
function startGame() {
    restartGame();

    requestImages().then(() => {
        loop();
    });
}
function spawnPlayer() {
    player = new PlayerEntity(new Point(0, 0), new Size(25 / 39 * 230, 230), 200);
    entities.push(player);
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

        entities.push(new ChainsawEnemy(new Point(x, y), new Size(width, height), 120));
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
    catch (e) {
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
        horizontal += (getKey(KeyCode.KeyA) ? -1 : 0) + (getKey(KeyCode.KeyD) ? 1 : 0);
        horizontal = Math.max(-1, Math.min(1, horizontal))

        vertical += (getKey(KeyCode.KeyS) ? -1 : 0) + (getKey(KeyCode.KeyW) ? 1 : 0);
        vertical = Math.max(-1, Math.min(1, vertical))

        player.syncInput(horizontal, vertical);
    }

    const damping = .94;
    horizontal *= damping;
    vertical *= damping;

    entities.forEach(e => {
        e.update(dt);
    });

    scrollX += (player.position.x - scrollX) * .2;
    scrollY += (player.position.y - scrollY) * .2;

    if (!dead)
        score += dt;
}

function render(dt) {
    ctx.save();
    ctx.scale(renderScale, renderScale);

    // Clear, Render background
    ctx.fillStyle = "#86d5f7";
    ctx.fillRect(0, 0, canvas.width / renderScale, canvas.height / renderScale);

    // Render xy axis lines
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(translateX(), 0);
    ctx.lineTo(translateX(), canvas.height);
    ctx.stroke()
    ctx.beginPath();
    ctx.moveTo(0, translateY());
    ctx.lineTo(canvas.width, translateY());
    ctx.stroke()

    // Render entities
    entities.forEach(e => e.render(ctx, dt, images));

    // Render debug entries
    ctx.fillStyle = 'black';
    ctx.font = "20px Arial";
    ctx.fillText(`Delta: ${dt.toFixed(4)} FPS: ${(1 / dt).toFixed(2)}`, 10, 80);
    ctx.fillText(`Player(xy): ${player.position.x.toFixed(2)} ${player.position.y.toFixed(2)}`, 10, 120);
    ctx.fillText(`Scroll(xy): ${scrollX.toFixed(2)} ${scrollY.toFixed(2)}`, 10, 140);
    ctx.fillText(`Input(xy):  ${horizontal.toFixed(2)} ${vertical.toFixed(2)}`, 10, 200);

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

    // Render scores
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

    // Render mouse pointer
    ctx.drawImage(images['pointer1'], mousePosition.x, mousePosition.y, 64, 64);

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
function translatePoint(p) { return new Point(translateX(p.x), translateY(p.y)); }
function translateX(x = 0) { return x - scrollX + canvas.width / 2 / renderScale; }
function translateY(y = 0) { return y - scrollY + canvas.height / 2 / renderScale; }
function angleTowards(a, b) { return Math.atan2(a.y - b.y, a.x - b.x) }
function moveDirection(angle, magnitude) { return new Point(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude); }
function sqrDistance(a, b) { return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2); }
function deg(r) { return Math.PI / 180 * r; }
function rad(d) { return 180 / Math.PI * d; }
function AABB(x1, y1, width1, height1, x2, y2, width2, height2) { return (x1 < x2 + width2 && x1 + width1 > x2) && (y1 < y2 + height2 && y1 + height1 > y2); }
function AABBPoint(x, y, width, height, px, py) { return (px < x + width && px > x) && (py < y + height && py > y) }

// Extra utilities
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