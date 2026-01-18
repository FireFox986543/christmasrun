class Point {
    static zero = new Point(0, 0);
    static one = new Point(1, 1);
    static up = new Point(0, 1);
    static down = new Point(0, -1);
    static left = new Point(-1, 0);
    static right = new Point(1, 0);

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(p) { return new Point(this.x + p.x, this.y + p.y); }
    subtr(p) { return new Point(this.x - p.x, this.y - p.y); }
    negate() { return new Point(-this.x, -this.y); }
    equals(p) { return this.x === p.x && this.y === p.y; }
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

class PointerType {
    constructor(id, hotspot) {
        this.id = id;
        this.hotspot = hotspot;
    }
}
const PointerTypes = Object.freeze({
    POINTER: new PointerType(1, new Point(11, 6)),
    HAND: new PointerType(2, new Point(17, 3)),
});

class ScaleAndRotateAnimation {
    static apply = this.bind(2, 0.05235, 32); // Note rotate = 3 degrees in radians
    static #handle(e, speed, rotate, scaleAmount) {
        // Ensure that the xy coordinates are at the button's center
        const x = e.x + e.width / 2;
        const y = e.y + e.height / 2;
        const scale = Math.cos(scene.gameTime * speed) / scaleAmount + 1 + (1 / scaleAmount);

        // We set the pivot point for the rotation to the center of the button
        ctx.translate(x, y);
        ctx.rotate(Math.sin(scene.gameTime * (speed + .5)) * rotate);
        ctx.scale(scale, scale);
        return new Point(-e.width / 2, -e.height / 2);
    }
    static bind(speed, rotate, scaleAmount) { return (e) => { return ScaleAndRotateAnimation.#handle(e, speed, rotate, scaleAmount); } };
}
class HoverFlyUpAnimation {
    static apply = this.bind(.3, 16);
    static #handle(e, duration, amount) {
        if (e.mouseOver) {
            const t = Math.min(1, (scene.gameTime - e.hoverStart) / duration);
            ctx.translate(0, -interpolateEaseIn(t, 3) * amount);
            return;
        }
        const hoverEnds = e.hoverEnd + duration
        if (scene.gameTime <= hoverEnds) {
            const t = Math.min(1, (hoverEnds - scene.gameTime) / duration);
            ctx.translate(0, -interpolateEaseOut(t, 3) * amount);
        }
    }
    static bind(duration, amount) { return (e) => { HoverFlyUpAnimation.#handle(e, duration, amount); }; }
}
/*
class Animation {
    static apply() {
        this.handle(1, 2, 3);
    }   
    static handle(one, two, three) {
        anim; anim; anim; anim;
        1 = one;
        2 = two;
        three = 3;
    }
    static bindAnimation(one, two, three) {
        return () => { Animation.handle.call(this, one, two, three); };
    }
}*/