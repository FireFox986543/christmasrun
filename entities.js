class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get screenX() { return translateX(this.x); }
    get screenY() { return translateY(this.y); }

    update(dt) { }
    render(ctx, dt, images) { }
}

class PlayerEntity extends Entity {
    constructor(x, y, width, height, speed) {
        super(x, y, width, height);
        this.speed = speed;
    }
}

class ChainsawEnemy extends Entity {
    constructor(x, y, width, height, speed) {
        super(x, y, width, height);
        this.speed = speed;
        this.rotation = 0;
    }

    update(dt) {
        this.rotation = Math.atan2(playerY - this.y, playerX - this.x);
        this.x += Math.cos(this.rotation) * this.speed * dt;
        this.y += Math.sin(this.rotation) * this.speed * dt;
    }

    render(ctx, dt, images) {
        // Draw a single enemy
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation + Math.PI / 2);
        ctx.drawImage(images['chainsaw'], -this.width / 2, -this.height / 2, this.width, this.height)
        ctx.restore();
    }
}