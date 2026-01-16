const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const images = {};

let scene = null;
let defaultScene = new MenuScene();

window.addEventListener("resize", resizeCanvas);

let lastTick = 0;
let timeScale = 1;
let gameTime = 0;

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
    offsetY: 0
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
resizeCanvas();
gameEngineStart();

function loop() {
    if (scene !== null) {
        let dt = Math.min(0.05, (performance.now() - lastTick) / 1000);
        lastTick = performance.now();

        try {
            scene.gameLoop(dt * timeScale);
            scene.render(dt * timeScale);

            processKeys();
            scene.gameTime += dt;
        }
        catch (e) {
            console.error(e);
        }
    }

    requestAnimationFrame(loop);
}

function gameEngineStart() {
    requestImages().then(() => {
        if (defaultScene !== null)
            loadScene(defaultScene);

        loop();
    });
}

// Scene managing
function loadScene(sc) {
    if (sc === null)
        throw new Error("No scene to load!");

    if (scene !== null)
        scene.onUnload();

    scene = sc;
    scene.onLoad();
}
function unloadScene() {
    if (scene !== null)
        scene.onUnload();
}


// Transformation functions

function interpolate(t, s) { return 1 - Math.pow(1 - t, s); }
// Translate world space -> screen space
function translatePoint(p) { return new Point(translateX(p.x), translateY(p.y)); }
function translateX(x = 0) { return x - scene.scrollX + VIRTUAL_WIDTH / 2; }
function translateY(y = 0) { return y - scene.scrollY + VIRTUAL_HEIGHT / 2; }
// Translate screen space -> world space
function revTranslatePoint(p) { return new Point(revTranslateX(p.x), revTranslateY(p.y)); }
function revTranslateX(x = 0) { return x + scene.scrollX - VIRTUAL_WIDTH / 2; }
function revTranslateY(y = 0) { return y + scene.scrollY - VIRTUAL_HEIGHT / 2; }
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
function fillCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '';
    ctx.fillStyle = color;
    ctx.fill();
}
function strokeCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.fillStyle = '';
    ctx.stroke();
}
function outlinedText(x, y, offsetX, offsetY, text) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(text, x + offsetX, y + offsetY);
    ctx.fillText(text, x, y);
}
function line(point1, point2, color) {
    let before = ctx.strokeStyle;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke()
    ctx.strokeStyle = before;
}
function clearBuffer(c) {
    ctx.fillStyle = c;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}
function renderPointer() {
    ctx.drawImage(images['pointer1'], mousePosition.x, mousePosition.y, 80, 80);
}