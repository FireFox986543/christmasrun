// I KNEW IT, that this "POINT" would come, heh-eh
// So I made the points into vector2-s, like a normal game engine would have
class Vector2 {
    static zero = Object.freeze(new Vector2(0, 0));
    static one = Object.freeze(new Vector2(1, 1));
    static up = Object.freeze(new Vector2(0, 1));
    static down = Object.freeze(new Vector2(0, -1));
    static left = Object.freeze(new Vector2(-1, 0));
    static right = Object.freeze(new Vector2(1, 0));

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(p) { return new Vector2(this.x + p.x, this.y + p.y); }
    subtr(p) { return new Vector2(this.x - p.x, this.y - p.y); }
    negate() { return new Vector2(-this.x, -this.y); }
    multiply(b) { return new Vector2(this.x * b, this.y * b); }
    divide(b) { return new Vector2(this.x / b, this.y / b); }
    equals(p) { return this.x === p.x && this.y === p.y; }

    get sqrMagnitude() { return this.x * this.x + this.y * this.y; }
    get magnitude() { return Math.sqrt(this.sqrMagnitude); }

    static distance(a, b) { return Math.sqrt(this.sqrDistance(a, b)); }
    static sqrDistance(a, b) { return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2); }

    static angleTowards(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
    // NOTE: before it was called 'moveDirection', so replace that old knowledge with this more accurate name
    static fromAngle(angle, magnitude) { return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude); }
    static normalize(a) {
        const mag = a.magnitude;
        return mag === 0 ? Vector2.zero : a.divide(mag);
    }
}
class Size {
    static zero = new Size(0, 0);
    static one = new Size(1, 1);

    get area() { return this.width * this.height; }

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}
class Rect {
    static identity = new Rect(0, 0, 0, 0);

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    static fromPointSize(point, size) {
        return new Rect(point.x, point.y, size.width, size.height);
    }
}

class ClipRegion extends Rect {
    constructor(x, y, width, height, atlas, scale) {
        super(x, y, width, height);
        this.atlas = atlas;
        this.scale = scale;
    }

    fullSize() { return new Size(this.width * this.scale, this.height * this.scale); }
}
const UIAtlas = Object.freeze({
    ButtonRedLarge: new ClipRegion(0, 0, 60, 10, 'ui_atlas', 10),
    ButtonRedSmall: new ClipRegion(60, 0, 40, 10, 'ui_atlas', 10),
    ButtonYellowLarge: new ClipRegion(0, 10, 60, 10, 'ui_atlas', 10),
    ButtonYellowSmall: new ClipRegion(60, 10, 40, 10, 'ui_atlas', 10),
    ButtonBlueLarge: new ClipRegion(0, 20, 60, 10, 'ui_atlas', 10),
    ButtonBlueSmall: new ClipRegion(60, 20, 40, 10, 'ui_atlas', 10),
    ButtonGreenLarge: new ClipRegion(0, 30, 60, 10, 'ui_atlas', 10),
    ButtonGreenSmall: new ClipRegion(60, 30, 40, 10, 'ui_atlas', 10),
    HL_ButtonRedLarge: new ClipRegion(0, 40, 60, 10, 'ui_atlas', 10),
    HL_ButtonRedSmall: new ClipRegion(60, 40, 40, 10, 'ui_atlas', 10),
    HL_ButtonYellowLarge: new ClipRegion(0, 50, 60, 10, 'ui_atlas', 10),
    HL_ButtonYellowSmall: new ClipRegion(60, 50, 40, 10, 'ui_atlas', 10),
    HL_ButtonBlueLarge: new ClipRegion(0, 60, 60, 10, 'ui_atlas', 10),
    HL_ButtonBlueSmall: new ClipRegion(60, 60, 40, 10, 'ui_atlas', 10),
    HL_ButtonGreenLarge: new ClipRegion(0, 70, 60, 10, 'ui_atlas', 10),
    HL_ButtonGreenSmall: new ClipRegion(60, 70, 40, 10, 'ui_atlas', 10),
});
const ButtonTypes = Object.freeze({
    RedLarge: 'ButtonRedLarge',
    RedSmall: 'ButtonRedSmall',
    YellowLarge: 'ButtonYellowLarge',
    YellowSmall: 'ButtonYellowSmall',
    BlueLarge: 'ButtonBlueLarge',
    BlueSmall: 'ButtonBlueSmall',
    GreenLarge: 'ButtonGreenLarge',
    GreenSmall: 'ButtonGreenSmall',
});
function getButtonSize(btntype) { return UIAtlas[btntype].fullSize(); }

class PointerType {
    constructor(id, hotspot) {
        this.id = id;
        this.hotspot = hotspot;
    }
}
const PointerTypes = Object.freeze({
    POINTER: new PointerType(1, new Vector2(11, 6)),
    HAND: new PointerType(2, new Vector2(17, 3)),
});

class ScaleAndRotateAnimation {
    static apply = this.bind(2, 0.05235, 32); // Note rotate = 3 degrees in radians
    static #handle(e, speed, rotate, scaleAmount) {
        // Ensure that the xy coordinates are at the button's center
        const x = e.x + e.width / 2;
        const y = e.y + e.height / 2;
        const scale = Math.cos(animationNow() * speed) / scaleAmount + 1 + (1 / scaleAmount);

        // We set the pivot point for the rotation to the center of the button
        ctx.translate(x, y);
        ctx.rotate(Math.sin(animationNow() * (speed + .5)) * rotate);
        ctx.scale(scale, scale);
        return new Vector2(-e.width / 2, -e.height / 2);
    }
    static bind(speed, rotate, scaleAmount) { return (e) => { return ScaleAndRotateAnimation.#handle(e, speed, rotate, scaleAmount); } };
}
class HoverAnimation {
    static apply = this.bind(1, 3, 0);
    static #handle(e, speed, amount, offset) {
        ctx.translate(0, Math.sin(animationNow() * speed + offset) * amount);
        return new Vector2(e.x, e.y);
    }
    static bind(speed, amount, offset) { return (e) => { return HoverAnimation.#handle(e, speed, amount, offset); } };
}
class HoverFlyUpAnimation {
    static apply = this.bind(.3, 16);
    static #handle(e, duration, amount) {
        if (e.mouseOver) {
            const t = Math.min(1, (animationNow() - e.hoverStart) / duration);
            ctx.translate(0, -interpolateEaseIn(t, 3) * amount);
            return;
        }
        const hoverEnds = e.hoverEnd + duration
        if (animationNow() <= hoverEnds) {
            const t = Math.min(1, (hoverEnds - animationNow()) / duration);
            ctx.translate(0, -interpolateEaseOut(t, 3) * amount);
        }
    }
    static bind(duration, amount) { return (e) => { HoverFlyUpAnimation.#handle(e, duration, amount); }; }
}
class StartFadeFlyUpAnimation {
    static apply = this.bind(.4, Vector2.up.multiply(120));
    static #handle(e, duration, vector) {
        // For this we could use the canvas translating, I may modify this to return a point instead in the future to replace the canvas transformations

        // TODO: Make something similar to these animation classes for easing functions, eg: linear, ease in/out, quadratic, cubic etc.
        // And more complex ones
        // Also for waves, like sine, cosine, but more complex, that would produce more natural-looking animations

        const t = interpolateEaseOut(Math.min(1, (animationNow() - e.activeTime) / duration), 3);
        const newVector = vector.multiply(1 - t);
        ctx.globalAlpha = scaleAlpha(t);
        ctx.translate(newVector.x, newVector.y);
    }
    static bind(duration, vector, shadowingUpdates = true) {
        return {
            duration: duration,
            shadowingUpdates: shadowingUpdates,
            render: (e) => { StartFadeFlyUpAnimation.#handle(e, duration, vector); }
        };
    }
}

function renderBackground() {
    // Render backgrounds, No explaining,
    // Just to know, didn't take that long, hehe ;)
    // Just a handful of hours to figure it out on my own — I already did this on another project
    const renderSize = 1024;
    const sourceSize = 256
    let startX = viewport.viewLeft - revTranslateX(viewport.viewLeft) % renderSize;
    let cellX = Math.floor(revTranslateX(viewport.viewLeft) / renderSize);
    let startY = viewport.viewTop - revTranslateY(viewport.viewTop) % renderSize;
    let cellY = Math.floor(revTranslateY(viewport.viewTop) / renderSize);
    if (scene.scrollX <= viewport.visibleWidth2)
        startX -= renderSize;
    if (scene.scrollY <= viewport.visibleHeight2)
        startY -= renderSize;

    const visibleFirstX = renderSize - (viewport.viewLeft - startX);
    const amountX = Math.ceil((viewport.visibleWidth - visibleFirstX) / renderSize) + 1;
    const visibleFirstY = renderSize - (viewport.viewTop - startY);
    const amountY = Math.ceil((viewport.visibleHeight - visibleFirstY) / renderSize) + 1;

    ctx.font = '24px "Jersey 10"';
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 1; // Note, we don't care about the scaled alpha, as the background must be opaque!!!

    for (let y = 0; y < amountY; y++) {
        for (let x = 0; x < amountX; x++) {
            const drawX = Math.ceil(startX + renderSize * x);
            const drawY = Math.ceil(startY + renderSize * y);
            const tileX = ((cellX + x) % 4 + 4) % 4;
            const tileY = ((cellY + y) % 4 + 4) % 4;
            ctx.drawImage(images['grid'], tileX * sourceSize, tileY * sourceSize, sourceSize, sourceSize, drawX, drawY, renderSize + 1, renderSize + 1); // Overdraw just 1 px to fix stitching issues, it's gone now
            //ctx.fillText(cellX + x, drawX, startY + renderSize * (y + .5));
        }
    }
}

function animationNow() { return performance.now() / 1000; }