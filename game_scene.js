class ChaseGameScene extends Scene {
    constructor() {
        super();

        this.player;

        this.horizontal = 0;
        this.vertical = 0;

        this.scrollX = 0;
        this.scrollY = 0;

        this.nextEnemy = 1000;
        this.enemySpawnRate = 400;
        this.nextRateIncrease = 10000;
        this.enemyRateIncrease = 6000;

        this.DEBUG = true;
        this.enemySpawning = true;
    }

    gameLoop(dt) {
        if (getKeyDown(KeyCode.KeyF1))
            this.DEBUG = !this.DEBUG;

        if (timeScale === 0)
            return;

        if (this.player.dead) {
            timeScale *= .97;

            if (timeScale < .01)
                timeScale = 0;
        }
        else {
            this.horizontal += (getKey(KeyCode.KeyA) ? -1 : 0) + (getKey(KeyCode.KeyD) ? 1 : 0);
            this.horizontal = Math.max(-1, Math.min(1, this.horizontal))

            this.vertical += (getKey(KeyCode.KeyS) ? -1 : 0) + (getKey(KeyCode.KeyW) ? 1 : 0);
            this.vertical = Math.max(-1, Math.min(1, this.vertical))

            this.player.syncInput(this.horizontal, this.vertical);
        }

        const damping = .94;
        this.horizontal *= damping;
        this.vertical *= damping;

        // Spawn enemies
        if (gameTime >= this.nextRateIncrease) {
            this.enemySpawnRate = Math.max(.180, this.enemySpawnRate - .5);
            this.nextRateIncrease += this.enemyRateIncrease;
        }
        if (this.enemySpawning && this.gameTime >= this.nextEnemy) {
            this.spawnEnemyAround();
            this.nextEnemy += this.enemySpawnRate;
        }

        ChainsawEnemy.staticUpdate(dt);

        this.entities.forEach(e => {
            e.update(dt);
        });

        this.scrollX += (this.player.position.x - this.scrollX) * .2;
        this.scrollY += (this.player.position.y - this.scrollY) * .2;

        if (!this.player.isImmune)
            this.player.score += dt;
    }
    render(dt) {
        // Clear, Render background
        clearBuffer('#86d5f7')

        // Render xy axis lines
        if (this.DEBUG) {
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
        this.entities.forEach(e => {
            if (!isCulled(translatePoint(e.position), e.size)) {
                e.render(dt, images, transf);
                ctx.setTransform(transf); // Reset the transform after every entity
            }
            else
                culled++;
        });

        // Render debug entries
        if (this.DEBUG) {
            ctx.fillStyle = 'black';
            ctx.font = "20px Arial";
            const x = viewLeft + 10;
            ctx.fillText(`Entities: ${this.entities.length}   culled: ${culled}`, x, 40);
            ctx.fillText(`Delta: ${dt.toFixed(4)} FPS: ${(1 / dt).toFixed(2)}`, x, 80);
            ctx.fillText(`Player(xy): ${this.player.position.x.toFixed(2)} ${this.player.position.y.toFixed(2)}`, x, 120);
            ctx.fillText(`Scroll(xy): ${this.scrollX.toFixed(2)} ${this.scrollY.toFixed(2)}`, x, 140);
            ctx.fillText(`Input(xy):  ${this.horizontal.toFixed(2)} ${this.vertical.toFixed(2)}`, x, 200);
            ctx.fillText(`Enemy speed:  ${ChainsawEnemy.baseSpeed}`, x, 240);

            {
                ctx.textAlign = 'right';
                let x = viewRight - 20;

                ctx.fillText(`Enemy spawn rate: ${this.enemySpawnRate}`, x, 100);
                ctx.fillText(`Enemy spawnrt inc: ${this.enemyRateIncrease}`, x, 120);
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
            const sc = this.player.score.toFixed(2);
            const leftText = 'SCORE:   ';
            let width = ctx.measureText(leftText).width + digitWidth * sc.length;
            let startX = VIRTUAL_WIDTH / 2 - width / 2;

            outlinedText(startX, 70, 0, 3, leftText); // Draw leftText (SCORE: )
            startX = VIRTUAL_WIDTH / 2 + width / 2 - digitWidth * sc.length; // Start after leftText
            let delta = 0;
            // Draw each number with a fixed width
            for (let i = 0; i < sc.length; i++) {
                outlinedText(startX + delta, 70, 0, 3, sc[i]);
                delta += sc[i] === '.' ? digitWidth / 2 : digitWidth; // Half size for .
            }

            ctx.font = "52px 'Jersey 10'";
            let text = `HIGHEST:  ${this.player.highScore.toFixed(2)}`
            width = ctx.measureText(text).width;

            outlinedText(VIRTUAL_WIDTH / 2 - width / 2, 120, 0, 2, text);
        }

        // Render lives
        {
            const max = 3;
            const size = 48;
            const y = 150;
            const gap = 10;
            const startX = VIRTUAL_WIDTH / 2 - (max * size + (max - 1) * gap) / 2;

            for (let i = 0; i < max; i++) {
                ctx.drawImage(images['ornament' + (i < this.player.lives ? '1' : '2')], startX + (size + gap) * i, y, size, size);
            }
        }

        if (this.player.dead && Date.now() >= this.player.deathAStart) {
            ctx.font = "164px 'Jersey 10'";
            let text = 'YOU  DIED!';
            let width = ctx.measureText(text).width;

            let t = Math.min(1, (Date.now() - this.player.deathAStart) / (this.player.deathAEnd - this.player.deathAStart));
            let y = VIRTUAL_HEIGHT / 2 - interpolate(t, 4) * 100;
            let x = VIRTUAL_WIDTH / 2 - width / 2;

            ctx.lineWidth = 20;
            ctx.strokeStyle = `rgba(222, 42, 26, ${t.toFixed(2)})`;
            ctx.fillStyle = `rgba(255, 255, 255, ${t.toFixed(2)})`;
            outlinedText(x, y, 0, 5, text);
        }

        // Render mouse pointer
        renderPointer();
    }

    restartGame() {
        Object.keys(keys).forEach(key => delete keys[key]);
        this.entities.length = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        timeScale = 1;
        gameTime = 0;
        this.nextEnemy = 10;
        this.enemySpawnRate = .4;
        this.nextRateIncrease = 10;
        this.enemyRateIncrease = 6;

        // Keep highscore across multiple restarts
        let highScore = this.player === undefined ? 0 : this.player.highScore;

        if (this.enemySpawning)
            this.spawnEnemies(20, 2000, 400, 400);

        //entities.push(new ChainsawEnemy(new Point(200, 200), new Size(200, 200), 0));
        this.spawnPlayer();
        this.player.highScore = highScore;
    }
    spawnPlayer() {
        this.player = new PlayerEntity(new Point(0, 0), new Size(230, 230), 200);
        this.entities.push(this.player);
    }
    spawnEnemies(amount, scatter, nsW, nsH) {
        for (let i = 0; i < amount; i++) {
            let x = Math.random() * scatter * 2 - scatter;
            let y = Math.random() * scatter * 2 - scatter;

            if (Math.abs(x) < nsW && Math.abs(y) < nsH) {
                i--;
                console.log('Skipped because ' + x + ' a ' + y);
                continue;
            }

            this.entities.push(new ChainsawEnemy(new Point(x, y), new Size(200, 200)));
        }
    }
    spawnEnemyAround() {
        const angle = Math.random() * Math.PI * 2;
        const point = moveDirection(angle, Math.max(VIRTUAL_WIDTH, VIRTUAL_HEIGHT) + 300);

        // Spawn enemies relative to player -> add player pos to position
        this.entities.push(new ChainsawEnemy(this.player.position.add(point), new Size(200, 200)));
    }

    onLoad() {
        this.restartGame();
    }
}