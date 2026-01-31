class MenuScene extends Scene {
    #totalTitleLength;
    #letterLengths;
    #titleText = 'Christmas  RUN'
    #color1 = '#de291f'
    #color2 = '#159741'
    #sceneStart;
    #fadeDuration = .7;
    #sceneEnds = undefined;
    #nextScene;

    #mainPanel;
    #modeSelectorPanel;
    #playerDir = randomDir();
    #targetDir = randomDir();
    #nextDirChange = 0;
    #nextEnemySpawn = 0;

    constructor() {
        super();

        this.radius = 120;

        this.scrollX = 0;
        this.scrollY = 0;

        this.difficulty = { // Normal
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
        }
    }

    gameLoop(dt) {
        getSelectedUIElement();
        handleUIClicks();

        if (animationNow() >= this.#sceneEnds) {
            loadScene(this.#nextScene);
            return;
        }

        const move = Vector2.normalize(Vector2.fromAngle(this.#playerDir, 1)).multiply(300);
        this.player.position.x += move.x * dt;
        this.player.position.y += move.y * dt;

        this.scrollX += (this.player.position.x - this.scrollX) * 0.2;
        this.scrollY += (this.player.position.y - this.scrollY) * 0.2;

        if (this.gameTime >= this.#nextEnemySpawn) {
            this.spawnEnemyAround();
            this.#nextEnemySpawn += .2;
        }

        for (let i = 0; i < this.entities.length; i++)
            this.entities[i].update(dt);

        if (this.gameTime >= this.#nextDirChange) {
            this.#targetDir += Math.random() * Math.PI * 2 - Math.PI;
            this.#nextDirChange += Math.random() + 1;
        }

        this.#playerDir += (this.#targetDir - this.#playerDir) * .02;
    }
    render(dt) {
        // Clear, Render background
        clearBuffer('white');
        ctx.save();

        if (animationNow() <= this.#sceneStart + this.#fadeDuration) {
            const scale = interpolateEaseOut(Math.min(1, (animationNow() - this.#sceneStart) / this.#fadeDuration), 4);
            ctx.beginPath();
            ctx.arc(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, VIRTUAL_WIDTH * scale, 0, Math.PI * 2);
            ctx.clip();
        }
        else if (animationNow() <= this.#sceneEnds) {
            const scale = interpolateEaseOut(Math.min(1, (this.#sceneEnds - animationNow()) / this.#fadeDuration), 4);
            ctx.beginPath();
            ctx.arc(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, VIRTUAL_WIDTH * scale, 0, Math.PI * 2);
            ctx.clip();
        }

        renderBackground();

        // This is only for the first fade in that happens when the player loads the document, not when the scene changes
        // At later points the scene changes will be covered with the circleing animation
        globalAlpha = interpolateEaseOut(Math.min(1, (animationNow()) / .5), 4);
        ctx.globalAlpha = scaleAlpha(1);

        renderEntities(dt);

        /*
            Render directions for player
        const playerPos = translatePoint(new Vector2(this.player.position.x, this.player.position.y));
        ctx.lineWidth = 2;
        line(playerPos, playerPos.add(Vector2.fromAngle(this.#playerDir, 200)), 'purple');
        line(playerPos, playerPos.add(Vector2.fromAngle(this.#targetDir, 200)), 'green');
        ctx.fillText(Vector2.fromAngle(this.#playerDir, 200), 300, 400);
        ctx.fillText(playerPos, 300, 460);*/

        ctx.font = '256px "Jersey 10"';
        ctx.fillStyle = '#de291f';
        ctx.strokeStyle = 'white';
        ctx.lineJoin = "square";
        ctx.lineCap = "square";
        ctx.miterLimit = 2;
        ctx.lineWidth = 48;

        const transf = ctx.getTransform();
        const scale = Math.sin(animationNow() * 3) / 20 + 1 + (1 / 20);
        ctx.translate(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 5);
        ctx.scale(scale, scale);
        ctx.rotate(Math.sin(animationNow() * 2.8) * (Math.cos(animationNow() * 3 + 10) * 0.5) * Math.sin(animationNow() * 1.4) * 0.0698); // 4 degrees
        ctx.textBaseline = 'middle';
        // Render title 2 times, once the background stroke, then the letters themselves
        for (let j = 0; j < 2; j++) {
            let startX = -this.#totalTitleLength / 2;
            for (let i = 0; i < this.#titleText.length; i++) {
                const char = this.#titleText[i];

                if (char !== ' ') {
                    if (j === 0)
                        ctx.strokeText(char, startX, this.#titleSine(3, 22, i / 3));
                    else {
                        ctx.fillStyle = fraction(animationNow() * 0.5 + i * 1.5) >= .5 ? this.#color2 : this.#color1;
                        ctx.fillText(char, startX, this.#titleSine(3, 22, i / 3) - 4);
                    }
                }

                startX += this.#letterLengths[i];
            }
        }
        ctx.setTransform(transf);

        ctx.textBaseline = 'alphabetic';
        renderUIElements();
        /*ctx.fillStyle = 'black';
        ctx.font = '64px "Jersey 10"';
        ctx.fillText(`Element: ${this.uiElements.indexOf(selectedUIElement)} ${selectedUIElement}`, viewport.viewLeft + 20, 80);
        ctx.fillText(`lElement: ${this.uiElements.indexOf(_lastSelectedElement)} ${_lastSelectedElement}`, viewport.viewLeft + 20, 140);
        ctx.fillText(`FPS: ${(1 / dt).toFixed(2)}`, viewport.viewLeft + 20, 340);
        ctx.fillText(`Delta: ${dt.toFixed(4)}`, viewport.viewLeft + 20, 380);*/

        /*this.renderNode(300 + 0, 20, this.uiElements[0]); // a
        this.renderNode(300 - 100, 20 + 100, this.uiElements[1]); // b
        this.renderNode(300 + 0, 20 + 100, this.uiElements[2]); // c
        this.renderNode(300 + 100, 20 + 100, this.uiElements[3]); // d
        this.renderNode(300 - 50, 20 + 200, this.uiElements[4]); // e
        this.renderNode(300 + 50, 20 + 200, this.uiElements[5]); // f
        this.renderNode(300 + 100, 20 + 200, this.uiElements[6]); // g

        this.renderNode(800 + 0, 20, this.uiElements[7]); // h
        this.renderNode(800 + -50, 20 + 100, this.uiElements[9]); // j
        this.renderNode(800 + 50, 20 + 100, this.uiElements[8]); // i
        this.renderNode(800 + 50, 20 + 200, this.uiElements[10]); // k
        this.renderNode(800 + 100, 20 + 300, this.uiElements[11]); // m
        this.renderNode(800 + 0, 20 + 300, this.uiElements[12]); // l*/

        renderPointer();
        ctx.restore();
    }

    onLoad() {
        this.#mainPanel = new UIPanel();
        const playBtn = new UIButton(new Vector2(0, 120), 'PLAY GAME', ButtonTypes.RedLarge, () => { this.#playBtnClick(); }, HorizontalAlign.CENTER, VerticalAlign.BOTTOM, ScaleAndRotateAnimation.apply, HoverFlyAnimation.apply, StartFadeFlyUpAnimation.bind(.4, Vector2.up.multiply(120), false));
        playBtn.setParent(this.#mainPanel);

        this.#modeSelectorPanel = new UIPanel();
        const hoverFUA = HoverFlyAnimation.apply;
        const hoverAnim = o => HoverAnimation.bind(4, Vector2.up.multiply(3), o);
        const smallWidth = getButtonSize(ButtonTypes.RedSmall).width + 20;
        const smallHeight = getButtonSize(ButtonTypes.RedSmall).height;
        const easyBtn = new UIButton(new Vector2(-smallWidth, 140), 'EASY', ButtonTypes.GreenSmall, () => { this.#playModeBtnClick(0); }, HorizontalAlign.CENTER, VerticalAlign.BOTTOM, hoverAnim(-8), hoverFUA);
        const normalBtn = new UIButton(new Vector2(0, 140), 'NORMAL', ButtonTypes.YellowSmall, () => { this.#playModeBtnClick(1); }, HorizontalAlign.CENTER, VerticalAlign.BOTTOM, hoverAnim(0), hoverFUA);
        const hardBtn = new UIButton(new Vector2(smallWidth, 140), 'HARD', ButtonTypes.RedSmall, () => { this.#playModeBtnClick(2); }, HorizontalAlign.CENTER, VerticalAlign.BOTTOM, hoverAnim(8), hoverFUA);
        const backBtn = new UIButton(new Vector2(0, smallHeight - 80), 'BACK', ButtonTypes.BlueLarge, () => { this.#backBtnClick(); }, HorizontalAlign.CENTER, VerticalAlign.BOTTOM, hoverAnim(0), hoverFUA)
        this.#modeSelectorPanel.appendMultiple(easyBtn, normalBtn, hardBtn, backBtn);
        this.#modeSelectorPanel.setActive(false);

        this.uiElements.push(this.#mainPanel, playBtn, this.#modeSelectorPanel, easyBtn, normalBtn, hardBtn, backBtn);

        ctx.font = '256px "Jersey 10"';
        ctx.fillStyle = '#de291f';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 48;
        this.#letterLengths = [];
        this.#totalTitleLength = 0;
        for (let i = 0; i < this.#titleText.length; i++) {
            const m = ctx.measureText(this.#titleText[i]).width;
            this.#letterLengths.push(m);
            this.#totalTitleLength += m;
        }

        this.#sceneStart = animationNow();

        this.player = new PlayerEntity(new Vector2(0, 0), new Size(230, 230), 200);
        this.player.maxLives = 1 / 0; // The player is essentially invulnerable
        this.player.lives = 1 / 0;
        this.entities.push(this.player);

        if (animationNow() > 1)
            this.#sceneStart = animationNow();
        else // If we didn't start the game yet
            this.#sceneStart = -1 / 0;
    }

    #titleSine(frequency, amplitude, offset) { return Math.sin(offset + animationNow() * frequency) * amplitude; }

    #playBtnClick() {
        this.#mainPanel.setActive(false);
        this.#modeSelectorPanel.setActive(true);
    }
    #backBtnClick() {
        this.#mainPanel.setActive(true);
        this.#modeSelectorPanel.setActive(false);
    }
    #playModeBtnClick(diff) {
        if (this.#sceneEnds !== undefined)
            return;

        this.#sceneEnds = animationNow() + this.#fadeDuration;
        this.#nextScene = new ChaseGameScene(diff);
    }

    spawnEnemyAround() {
        const point = Vector2.fromAngle(randomDir(), Math.max(VIRTUAL_WIDTH, VIRTUAL_HEIGHT));

        // Spawn enemies relative to player -> add player pos to position
        this.entities.push(new ChainsawEnemy(this.player.position.add(point), new Size(200, 200)));
    }

    /*renderNode(x, y, n) {
        const size = 8;
        const shad = n.shadowed, ena = n.enabled;
        ctx.fillStyle = shad ? 'gray' : 'white';
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        ctx.fillStyle = ena ? 'green' : 'red';
        ctx.fillRect(x + size / 2, y - size / 2, size, size);
        ctx.fillStyle = n.isActive ? 'lime' : 'orange';
        ctx.fillRect(x, y + size / 2, size, size);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(n.name, x + size*2, y + size*2);
    }

    onLoad() {
        const a = new UIElement('a', new Rect(0, 0, 10, 10));
        const b = new UIElement('b', new Rect(0, 0, 10, 10));
        const c = new UIElement('c', new Rect(0, 0, 10, 10));
        const d = new UIElement('d', new Rect(0, 0, 10, 10));
        const e = new UIElement('e', new Rect(0, 0, 10, 10));
        const f = new UIElement('f', new Rect(0, 0, 10, 10));
        const g = new UIElement('g', new Rect(0, 0, 10, 10));
        const h = new UIElement('h', new Rect(0, 0, 10, 10));
        const i = new UIElement('i', new Rect(0, 0, 10, 10));
        const j = new UIElement('j', new Rect(0, 0, 10, 10));
        const k = new UIElement('k', new Rect(0, 0, 10, 10));
        const l = new UIElement('l', new Rect(0, 0, 10, 10));
        const m = new UIElement('m', new Rect(0, 0, 10, 10));
        const n = new UIElement('n', new Rect(0, 0, 10, 10));

        // First tree
        a.appendChild(b);
        c.setParent(a);
        d.appendChild(g);
        a.appendChild(d);
        c.appendChild(e);
        c.separateParent();
        f.setParent(c);
        a.appendChild(c);

        // Second tree
        k.appendChild(l);
        m.setParent(k);
        i.setParent(h);
        h.appendChild(j);
        i.appendChild(k);
        h.detachChild(i);
        h.appendChild(i);
        i.setParent(h);

        // Third tree
        n.setParent(null);

        this.uiElements.push(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
    }*/
}