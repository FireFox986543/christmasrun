class Entity {
    constructor(position, size) {
        this.position = position;
        this.size = size;
    }

    get screenX() { return translateX(this.position.x - this.size.width / 2); }
    get screenY() { return translateY(this.position.y - this.size.height / 2); }

    update(dt) { }
    render(ctx, dt, images) { }
}

class PlayerEntity extends Entity {
    constructor(position, size, speed) {
        super(position, size);
        this.speed = speed;
        this.horizontal = 0;
        this.vertical = 0;
    }

    syncInput(h, v) {
        this.horizontal = h;
        this.vertical = v;
    }
    update(dt) {
        this.position.x += this.horizontal * this.speed * dt;
        this.position.y -= this.vertical * this.speed * dt;
    }
    render(ctx, dt, images) {
        ctx.drawImage(images['player'], this.screenX, this.screenY, this.size.width, this.size.height);
        let screenPosition = translatePoint(this.position);
        fillCirlce(ctx, screenPosition.x, screenPosition.y, 3, 'pink');
    }
}

class ChainsawEnemy extends Entity {
    constructor(position, size, speed) {
        super(position, size);
        this.speed = speed;
        this.rotation = 0;
    }

    update(dt) {
        this.rotation = angleTowards(player.position, this.position) + Math.PI;
        let move = moveDirection(this.rotation, this.speed * dt);
        this.position.x -= move.x; // Note: -= is required here, because technically the entity faces away from the player
        this.position.y -= move.y;

        // Check if an enemy is touching the player
        if (!dead && sqrDistance(new Point(player.position.x, player.position.y), new Point(this.position.x, this.position.y)) < 150 * 150 && dt !== 0)
            die();
    }

    render(ctx, dt, images) {
        // Draw a single enemy
        ctx.save();
        ctx.translate(this.screenX + this.size.width / 2, this.screenY + this.size.height / 2); // Required to add half size, for center pivot
        ctx.rotate(this.rotation); // Note: rotates around pivot (ctx.translate)
        ctx.drawImage(images['chainsaw'], -this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height)
        fillCirlce(ctx, -this.size.width / 2, -this.size.height / 2, 3, 'green');

        ctx.restore();

        // Debug
        let screenPosition = translatePoint(this.position);
        fillCirlce(ctx, screenPosition.x, screenPosition.y, 3, 'blue');
        strokeCirlce(ctx, screenPosition.x, screenPosition.y, 150, 'orange');
    }
}