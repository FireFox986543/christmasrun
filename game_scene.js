class ChaseGameScene extends Scene {
    #diedUIContainer;

    constructor(difficultyLevel) {
        super();

        this.resetDifficulties();
        this.difficultyLevel = difficultyLevel;
        this.difficulty = this.difficulties[difficultyLevel];

        this.player;

        this.horizontal = 0;
        this.vertical = 0;

        this.scrollX = 0;
        this.scrollY = 0;

        this.DEBUG = false;
        this.enemySpawning = true;
    }

    gameLoop(dt) {
        getSelectedUIElement();
        handleUIClicks();

        // We clicked the home button
        if(scene !== this)
            return;

        if(getKeyDown(KeyCode.KeyP))
            this.#diedUIContainer.setActive(!this.#diedUIContainer.isActive);

        if (getKeyDown(KeyCode.KeyF1))
            this.DEBUG = !this.DEBUG;
        if(getKeyDown(KeyCode.KeyI))
            this.player.lives = 100000;

        if (timeScale === 0)
            return;

        if (this.player.dead) {
            timeScale *= .97;

            if (timeScale < .01)
                timeScale = 0;
        }
        else {
            const keyA = getKey(KeyCode.KeyA) || getKey(KeyCode.KeyArrowLeft);
            const keyD = getKey(KeyCode.KeyD) || getKey(KeyCode.KeyArrowRight);
            const keyW = getKey(KeyCode.KeyW) || getKey(KeyCode.KeyArrowUp);
            const keyS = getKey(KeyCode.KeyS) || getKey(KeyCode.KeyArrowDown);

            this.horizontal += (keyA ? -1 : 0) + (keyD ? 1 : 0);
            this.horizontal = Math.max(-1, Math.min(1, this.horizontal))

            this.vertical += (keyS ? -1 : 0) + (keyW ? 1 : 0);
            this.vertical = Math.max(-1, Math.min(1, this.vertical))

            this.player.syncInput(this.horizontal, this.vertical);
        }

        const damping = .94;
        this.horizontal *= damping;
        this.vertical *= damping;

        // Spawn enemies
        if (this.gameTime >= this.difficulty.nextSpawnIntvIncrease) {
            this.difficulty.enemySpawnInterval = Math.max(this.difficulty.enemySpawnIntervalMin,
                this.difficulty.enemySpawnInterval - this.difficulty.enemySpawnIntvIncrAmount);

            if (this.difficulty.enemySpawnIntvIncrInterval === 9) // After .2
                this.difficulty.enemySpawnIntvIncrInterval = 30;
            else
                this.difficulty.enemySpawnIntvIncrInterval++;

            this.difficulty.nextSpawnIntvIncrease += this.difficulty.enemySpawnIntvIncrInterval;
        }
        if (this.enemySpawning && this.gameTime >= this.difficulty.nextEnemySpawn) {
            this.spawnEnemyAround();
            this.difficulty.nextEnemySpawn += this.difficulty.enemySpawnInterval;
        }

        ChainsawEnemy.staticUpdate(dt);

        for(let i = 0; i < this.entities.length; i++)
            this.entities[i].update(dt);

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
            ctx.moveTo(translateX(), viewport.viewTop);
            ctx.lineTo(translateX(), viewport.viewTop + viewport.visibleHeight);
            ctx.stroke()
            ctx.beginPath();
            ctx.moveTo(viewport.viewLeft, translateY());
            ctx.lineTo(viewport.viewLeft + viewport.visibleWidth, translateY());
            ctx.stroke()
        }

        // Render entities
        const culled = renderEntities(dt);

        // Render debug entries
        if (this.DEBUG) {
            ctx.fillStyle = 'black';
            ctx.font = "20px Arial";
            const x = viewport.viewLeft + 10;
            ctx.fillText(`Entities: ${this.entities.length}   culled: ${culled}`, x, 40);
            ctx.fillText(`Delta: ${dt.toFixed(4)} FPS: ${(1 / dt).toFixed(2)}`, x, 80);
            ctx.fillText(`Player(xy): ${this.player.position.x.toFixed(2)} ${this.player.position.y.toFixed(2)}`, x, 120);
            ctx.fillText(`Scroll(xy): ${this.scrollX.toFixed(2)} ${this.scrollY.toFixed(2)}`, x, 140);
            ctx.fillText(`Input(xy):  ${this.horizontal.toFixed(2)} ${this.vertical.toFixed(2)}`, x, 200);
            ctx.fillText(`Enemy speed:  ${this.difficulty.enemyStartSpeed}`, x, 240);

            {
                ctx.textAlign = 'right';
                let x = viewport.viewRight - 20;

                ctx.fillText(`Scene: ${scene.constructor.name}`, x, 200);
                ctx.fillText(`Difficulty: ${this.difficultyLevel}`, x, 225);
                ctx.fillText(`Gametime: ${this.gameTime.toFixed(2)}`, x, 300);
                ctx.fillText(`Enemy spawn next: ${this.difficulty.nextSpawnIntvIncrease}`, x, 320);
                ctx.fillText(`Enemy spawn rate: ${this.difficulty.enemySpawnInterval}`, x, 340);
                ctx.fillText(`Enemy spawnrt inc: ${this.difficulty.enemySpawnIntvIncrInterval}`, x, 360);
            }

            ctx.textAlign = 'left';
        }

        // Render scores
        {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#062a48';
            ctx.lineWidth = 16;
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

            outlinedText(VIRTUAL_WIDTH / 2 - width / 2, 130, 0, 2, text);
        }

        // Render lives
        {
            const size = 48;
            const y = 160;
            const gap = 10;
            const startX = VIRTUAL_WIDTH / 2 - (this.player.maxLives * size + (this.player.maxLives - 1) * gap) / 2;
            const remaining = this.player.maxLives - this.player.lives + 1;

            for (let i = 0; i < this.player.maxLives; i++) {
                const active = i < this.player.lives;
                const thisY = active ? y + Math.cos(animationNow() * 3 * remaining + i * 1.8) * 4 : y;
                ctx.drawImage(images['ornament' + (active ? '1' : '2')], startX + (size + gap) * i, thisY, size, size);
            }
        }

        this.#renderDifficulty();
        ctx.textAlign = 'left';

        if (this.player.dead && Date.now() >= this.player.deathAStart) {
            ctx.font = "256px 'Jersey 10'";
            let text = 'YOU  DIED!';
            let width = ctx.measureText(text).width;

            let t = Math.min(1, (Date.now() - this.player.deathAStart) / (this.player.deathAEnd - this.player.deathAStart));
            let y = VIRTUAL_HEIGHT / 2 - interpolateEaseIn(t, 4) * 100;
            let x = VIRTUAL_WIDTH / 2 - width / 2;

            ctx.lineWidth = 48;
            ctx.strokeStyle = `rgba(222, 42, 26, ${t.toFixed(2)})`;
            ctx.fillStyle = `rgba(255, 255, 255, ${t.toFixed(2)})`;
            outlinedText(x, y, 0, 5, text);
        }

        renderUIElements();

        // Render mouse pointer
        renderPointer();
    }

    resetDifficulties() {
        this.difficulties = [
            { // Easy
                startEnemies: 12, // How many enemies will spawn by default on game start
                startEnemiesScatter: 2000, // Scattering of starting enemies
                nextEnemySpawn: 16,
                enemySpawnInterval: .5, // Every this interval an enemy will spawn
                enemySpawnIntervalMin: .25, // The minimum interval for enemy spawns
                enemySpawnDistance: 400, // Distance from player to spawn enemies outside of the screen
                nextSpawnIntvIncrease: 14,
                enemySpawnIntvIncrInterval: 8,  // Every this interval the enemySpawnInterval will change
                enemySpawnIntvIncrAmount: 0.04, // enemySpawnInterval will change by this amount
                playerImmuneDuration: 4,
                playerMaxLives: 4,
                enemyStartSpeed: 50,
                enemyMaxSpeed: 70,
                enemySpeedIncrementInterval: 12,
                enemySpeedIncrementAmount: 6, // Enemies' speed changes by this every interval
                enemySpeedAmountChangeScale: .9, // enemySpeedIncrementAmount scales by this every speed change
                enemyNextSpeedIncrease: 18,
                enemyCollisionRadius: 120,
                enemyCollisionRadiusSquared: 120 * 120, // Squared distance in enemies will collide with the player
            },
            { // Normal
                startEnemies: 20, // How many enemies will spawn by default on game start
                startEnemiesScatter: 2000, // Scattering of starting enemies
                nextEnemySpawn: 10,
                enemySpawnInterval: .4, // Every this interval an enemy will spawn
                enemySpawnIntervalMin: .18, // The minimum interval for enemy spawns
                enemySpawnDistance: 300, // Distance from player to spawn enemies outside of the screen
                nextSpawnIntvIncrease: 10,
                enemySpawnIntvIncrInterval: 6,  // Every this interval the enemySpawnInterval will change
                enemySpawnIntvIncrAmount: 0.05, // enemySpawnInterval will change by this amount
                playerImmuneDuration: 3,
                playerMaxLives: 3,
                enemyStartSpeed: 60,
                enemyMaxSpeed: 100,
                enemySpeedIncrementInterval: 10,
                enemySpeedIncrementAmount: 8, // Enemies' speed changes by this every interval
                enemySpeedAmountChangeScale: .95, // enemySpeedIncrementAmount scales by this every speed change
                enemyNextSpeedIncrease: 12,
                enemyCollisionRadius: 150,
                enemyCollisionRadiusSquared: 150 * 150, // Squared distance in enemies will collide with the player
            },
            { // Hard
                startEnemies: 40, // How many enemies will spawn by default on game start
                startEnemiesScatter: 1500, // Scattering of starting enemies
                nextEnemySpawn: 6,
                enemySpawnInterval: .3, // Every this interval an enemy will spawn
                enemySpawnIntervalMin: .14, // The minimum interval for enemy spawns
                enemySpawnDistance: 100, // Distance from player to spawn enemies outside of the screen
                nextSpawnIntvIncrease: 6,
                enemySpawnIntvIncrInterval: 4,  // Every this interval the enemySpawnInterval will change
                enemySpawnIntvIncrAmount: 0.08, // enemySpawnInterval will change by this amount
                playerImmuneDuration: 2.5,
                playerMaxLives: 3,
                enemyStartSpeed: 72,
                enemyMaxSpeed: 120,
                enemySpeedIncrementInterval: 7,
                enemySpeedIncrementAmount: 8, // Enemies' speed changes by this every interval
                enemySpeedAmountChangeScale: 1.1, // enemySpeedIncrementAmount scales by this every speed change
                enemyNextSpeedIncrease: 8,
                enemyCollisionRadius: 170,
                enemyCollisionRadiusSquared: 170 * 170, // Squared distance in enemies will collide with the player
            }
        ];
    }
    restartGame() {
        Object.keys(keys).forEach(key => delete keys[key]);
        this.entities.length = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        this.horizontal = 0;
        this.vertical = 0;
        timeScale = 1;
        this.gameTime = 0;
        this.resetDifficulties();
        this.difficulty = this.difficulties[this.difficultyLevel];
        this.#diedUIContainer.setActive(false);

        // Keep highscore across multiple restarts
        let highScore = this.player === undefined ? 0 : this.player.highScore;

        if (this.enemySpawning)
            this.spawnEnemies(this.difficulty.startEnemies, this.difficulty.startEnemiesScatter, 400, 400);

        //entities.push(new ChainsawEnemy(new Point(200, 200), new Size(200, 200), 0));
        this.spawnPlayer();
        this.player.highScore = highScore;
    }
    playerDied() {
        setTimeout(() => {
            this.#diedUIContainer.setActive(true);
        }, 2000);
    }
    spawnPlayer() {
        this.player = new PlayerEntity(new Vector2(0, 0), new Size(230, 230), 200);
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

            this.entities.push(new ChainsawEnemy(new Vector2(x, y), new Size(200, 200)));
        }
    }
    spawnEnemyAround() {
        const angle = Math.random() * Math.PI * 2;
        const point = Vector2.fromAngle(angle, Math.max(VIRTUAL_WIDTH, VIRTUAL_HEIGHT) + this.difficulty.enemySpawnDistance);

        // Spawn enemies relative to player -> add player pos to position
        this.entities.push(new ChainsawEnemy(this.player.position.add(point), new Size(200, 200)));
    }

    #renderDifficulty() {
        let text;
        ctx.strokeStyle = 'white';
        switch(this.difficultyLevel) {
            case 0:
                ctx.fillStyle = '#74f00f';
                text = 'EASY';
                break;
            case 2:
                ctx.fillStyle = '#ed120b';
                text = 'HARD';
                break;
            default: 
                ctx.fillStyle = '#ffb700';
                text = 'NORMAL';
                break;
        }

        ctx.textAlign = 'right';
        ctx.font = '128px "Jersey 10"';
        ctx.lineWidth = 22;
        outlinedText(viewport.viewRight - 20, 96, 0, 4, text);
    }

    onLoad() {
        this.#diedUIContainer = new UIPanel();
        const smallWidth = getButtonSize(ButtonTypes.RedSmall).width / 2 + 60;
        const y = 100;
        const startAnim = StartFadeFlyUpAnimation.bind(.6, Vector2.up.multiply(200));
        const restartBtn = new UIButton(new Vector2(-smallWidth, y), 'RESTART', ButtonTypes.RedSmall, () => { this.restartGame(); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, null, HoverFlyUpAnimation.apply, startAnim);
        const homeBtn = new UIButton(new Vector2(smallWidth, y), 'HOME', ButtonTypes.BlueSmall, () => { loadScene(new MenuScene()); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, null, HoverFlyUpAnimation.apply, startAnim);

        this.#diedUIContainer.appendMultiple(restartBtn, homeBtn);
        this.#diedUIContainer.setActive(false);
        this.uiElements.push(this.#diedUIContainer, restartBtn, homeBtn);

        this.restartGame();
    }
}