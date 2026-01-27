const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const images = {};

let scene = null;
let defaultScene = new MenuScene();

window.addEventListener("resize", resizeCanvas);

let lastTick = 0;
let timeScale = 1;

const VIRTUAL_WIDTH = 1920;
const VIRTUAL_HEIGHT = 1080;
const viewport = {
    rect: undefined,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    visibleWidth: 0,
    visibleWidth2: 0,
    visibleHeight: 0,
    visibleHeight2: 0,
    viewLeft: 0,
    viewRight: 0,
    viewTop: 0,
    viewBottom: 0,
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

    viewport.visibleWidth = rect.width / viewport.scale;
    viewport.visibleWidth2 = rect.width / viewport.scale / 2;
    viewport.visibleHeight = rect.height / viewport.scale;
    viewport.visibleHeight2 = rect.height / viewport.scale / 2;
    const visibleX = -viewport.offsetX / viewport.scale;
    const visibleY = -viewport.offsetY / viewport.scale;
    viewport.viewLeft = visibleX;
    viewport.viewTop = visibleY;
    viewport.viewRight = visibleX + viewport.visibleWidth;
    viewport.viewBottom = visibleY + viewport.visibleHeight;

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
        'ui_atlas': 'src/ui_atlas.png',
        'grid': 'src/bg1.png',
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
        let dt = Math.min(0.05, (performance.now() - lastTick) / 1000) * timeScale;
        lastTick = performance.now();

        try {
            scene.gameLoop(dt);
            scene.render(dt);

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
        // Wait for the font to load then we could properly draw with the right one
        document.fonts.load('16px "Jersey 10"').then(() => {
            if (defaultScene !== null)
                loadScene(defaultScene);

            loop();
        });
    });
}

// Scene managing
function loadScene(sc) {
    if (sc === null)
        throw new Error("No scene to load!");

    if (scene !== null)
        unloadScene(scene);

    timeScale = 1;
    scene = sc;
    console.log(`Loading '${sc.constructor.name}' scene . . .`);
    scene.onLoad();
}
function unloadScene() {
    if (scene !== null)
        scene.onUnload();

    _lastSelectedElement = null;
    selectedUIElement = null;
    pointerType = PointerTypes.POINTER;
}


// Transformation functions

function interpolateEaseIn(t, s) { return 1 - Math.pow(1 - t, s); }
function interpolateEaseOut(t, s) { return Math.pow(t, s); }
// Translate world space -> screen space
function translatePoint(p) { return new Vector2(translateX(p.x), translateY(p.y)); }
function translateX(x = 0) { return x - scene.scrollX + VIRTUAL_WIDTH / 2; }
function translateY(y = 0) { return y - scene.scrollY + VIRTUAL_HEIGHT / 2; }
// Translate screen space -> world space
function revTranslatePoint(p) { return new Vector2(revTranslateX(p.x), revTranslateY(p.y)); }
function revTranslateX(x = 0) { return x + scene.scrollX - VIRTUAL_WIDTH / 2; }
function revTranslateY(y = 0) { return y + scene.scrollY - VIRTUAL_HEIGHT / 2; }
function deg2rad(d) { return Math.PI / 180 * d; }
function rad2deg(r) { return 180 / Math.PI * r; }
function AABB(rectA, rectB) { return (rectA.x < rectB.x + rectB.width && rectA.x + rectA.width > rectB.x) && (rectA.y < rectB.y + rectB.height && rectA.y + rectA.height > rectB.y); }
function AABBPoint(rect, point) { return (point.x < rect.x + rect.width && point.x >= rect.x) && (point.y < rect.y + rect.height && point.y >= rect.y) }
function isCulled(point, size) {
    return point.x + size.width / 2 < viewport.viewLeft || point.x - size.width / 2 > viewport.viewLeft + viewport.visibleWidth ||
        point.y + size.height / 2 < viewport.viewTop || point.y - size.height / 2 > viewport.viewTop + viewport.visibleHeight;
}

function arrayRemove(array, target) { array.splice(array.indexOf(target), 1); }

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
    ctx.lineJoin = "square";
    ctx.lineCap = "square";
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
function renderEntities(dt) {
    let culled = 0;
    const transf = ctx.getTransform();
    for (let i = 0; i < scene.entities.length; i++) {
        const e = scene.entities[i];
        if (!isCulled(translatePoint(e.position), e.size)) {
            e.render(dt, images, transf);
            ctx.setTransform(transf); // Reset the transform after every entity
        }
        else
            culled++;
    }
    return culled;
}
function renderUIElements() {
    let fillStyle = ctx.fillStyle;
    let strokeStyle = ctx.strokeStyle;
    let textBaseline = ctx.textBaseline;
    const transf = ctx.getTransform();
    for (let i = 0; i < scene.uiElements.length; i++) {
        const e = scene.uiElements[i];
        if(e.isActive) {
            e.render();
            ctx.setTransform(transf); // Reset the transform after every ui element
        }
    }

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.textBaseline = textBaseline;
}