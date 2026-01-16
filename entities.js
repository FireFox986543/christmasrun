class Entity {
    constructor(position, size) {
        this.position = position;
        this.size = size;
    }

    get screenX() { return translateX(this.position.x - this.size.width / 2); }
    get screenY() { return translateY(this.position.y - this.size.height / 2); }

    update(dt) { }
    render(dt, images) { }

    destroy() {
        scene.entities.splice(scene.entities.indexOf(this), 1);
    }
}

class PlayerEntity extends Entity {
    static #deathFadeStart = 0;

    constructor(position, size, speed) {
        super(position, size);
        this.speed = speed;
        this.horizontal = 0;
        this.vertical = 0;
        this.lives = 3;
        this.highScore = 0;
        this.score = 0;
        this.dead = false;
        this.deathAStart = 0;
        this.deathAEnd = 0;
        this.immune = 0;
        this.immuneDuration = 3;
    }

    get isImmune() { return this.immune > 0; }

    syncInput(h, v) {
        this.horizontal = h;
        this.vertical = v;
    }
    update(dt) {
        this.immune = Math.max(0, this.immune - dt);
        let speed = this.speed;

        if (this.isImmune && !this.dead)
            speed *= Math.pow(this.immune / this.immuneDuration, 3) + 1;

        this.position.x += this.horizontal * speed * dt;
        this.position.y -= this.vertical * speed * dt;
    }
    render(dt, images) {
        if (!this.dead && this.isImmune && fraction(this.immune * 4) > .5)
            ctx.globalAlpha = .3;
        if (this.dead) {
            const t = Math.min(1, (Date.now() - PlayerEntity.#deathFadeStart) / (this.deathAEnd - PlayerEntity.#deathFadeStart));
            ctx.globalAlpha = Math.pow(1 - t, 4);
        }

        ctx.drawImage(images['player'], this.screenX, this.screenY, this.size.width, this.size.height);
        ctx.globalAlpha = 1;

        if (!scene.DEBUG) return;
        let screenPosition = translatePoint(this.position);
        fillCircle(screenPosition.x, screenPosition.y, 3, 'pink');
        ctx.fillStyle = 'red';
        ctx.font = "24px Arial";
        ctx.fillText(this.immune.toFixed(2), screenPosition.x + 120, screenPosition.y);
    }
    destroy() { console.error("Sorry, you can't destroy the player!"); }

    hurt() {
        if (this.isImmune) return;

        this.lives--;

        if (this.lives <= 0)
            this.die();
        else
            this.immune = this.immuneDuration; // Immunity for 3 seconds
    }
    die() {
        if (this.isImmune) return;

        this.highScore = Math.max(this.highScore, this.score);
        this.dead = true;
        this.immune = 1 / 0;
        this.deathAStart = Date.now() + 1500;
        this.deathAEnd = this.deathAStart + 1000;
        PlayerEntity.#deathFadeStart = Date.now() + 250;

        setTimeout(() => {
            scene.restartGame();
        }, 3500);
    }
}

class ChainsawEnemy extends Entity {
    static baseSpeed = 60;
    static #speedIncrementInterval = 10;
    static #speedIncrementAmount = 8;
    static #speedAmountChangeScale = .95;
    static #nextSpeedIncrease = 0;
    
    static #impulseDampen = -10;
    static #collisionImpulse = 100;

    static #removalDistance = 5000 * 5000; // Note: squared

    constructor(position, size) {
        super(position, size);
        this.rotation = 0;
        this.impulse = new Point(0, 0);
        this.playerDistance = 0;
    }

    static staticUpdate() {
        if (gameTime >= this.#nextSpeedIncrease) {
            this.baseSpeed += this.#speedIncrementAmount;
            this.#speedIncrementAmount *= this.#speedAmountChangeScale
            this.#nextSpeedIncrease += this.#speedIncrementInterval;
        }
    }

    static flipRotation(rot) {
        if (rot <= 0)
            return Math.PI + rot;

        return -Math.PI + rot;
    }

    update(dt) {
        this.rotation = angleTowards(scene.player.position, this.position);
        let move = moveDirection(this.rotation, ChainsawEnemy.baseSpeed * dt);
        this.position.x += move.x + this.impulse.x;
        this.position.y += move.y + this.impulse.y;

        this.playerDistance = sqrDistance(scene.player.position, this.position);
        if(this.playerDistance >= ChainsawEnemy.#removalDistance) {
            this.destroy();
            return;
        }

        if (!this.impulse.equals(Point.zero)) {
            let signX = Math.sign(this.impulse.x);
            let signY = Math.sign(this.impulse.y);

            this.impulse.x += ChainsawEnemy.#impulseDampen * signX;
            this.impulse.y += ChainsawEnemy.#impulseDampen * signY;

            // Impulse is only a one time launch, so make it zero if it goes below/above it, while preserving the original direction
            if (Math.sign(this.impulse.x) !== signX)
                this.impulse.x = 0;
            if (Math.sign(this.impulse.y) !== signY)
                this.impulse.y = 0;
        }

        // Check if an enemy is touching the player
        if (!scene.player.isImmune && this.playerDistance < 150 * 150 && dt !== 0) {
            scene.player.hurt();

            // The player only took damage, launch the enemy away from it
            if (!scene.player.dead)
                this.impulse = moveDirection(ChainsawEnemy.flipRotation(this.rotation), ChainsawEnemy.#collisionImpulse);
        }
    }

    render(dt, images, transf) {
        // Draw a single enemy
        const center = new Point(this.screenX + this.size.width / 2, this.screenY + this.size.height / 2);
        ctx.translate(center.x, center.y); // Required to add half size, for center pivot
        let flip = Math.abs(this.rotation) >= Math.PI * 0.5 ? 1 : -1;
        if (this.playerDistance < 25) // Avoid back-to-back flickering when the enemy is at the same pos as the player
            flip = 1;
        ctx.scale(flip, 1);
        ctx.drawImage(images['chainsaw'], -this.size.width / 2, -this.size.height / 2, this.size.width, this.size.height)

        // Debug
        if (!scene.DEBUG) return;
        ctx.setTransform(transf);

        fillCircle( center.x - this.size.width / 2, center.y - this.size.height / 2, 3, 'green');

        fillCircle(center.x, center.y, 3, 'blue');
        line(center, center.add(moveDirection(this.rotation, 120)), 'purple');
        ctx.fillStyle = 'black';
        ctx.font = '22px Arial';
        ctx.fillText(this.rotation, center.x - 500, center.y);
        ctx.fillStyle = 'blue';
        ctx.fillText(flip, center.x - 500, center.y + 50);
        strokeCircle(center.x, center.y, 150, 'orange');
    }
}