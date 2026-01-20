class MenuScene extends Scene {
    #totalTitleLength;
    #letterLengths;
    #titleText = 'Christmas  RUN'
    #color1 = '#de291f'
    #color2 = '#159741'

    #mainPanel;
    #modeSelectorPanel;

    constructor() {
        super();
    }

    gameLoop() {
        getSelectedUIElement();
        handleUIClicks();
    }
    render() {
        // Clear, Render background
        clearBuffer('lightblue')

        ctx.font = '256px "Jersey 10"';
        ctx.fillStyle = '#de291f';
        ctx.strokeStyle = 'white';
        ctx.lineJoin = "square";
        ctx.lineCap = "square";
        ctx.miterLimit = 2;
        ctx.lineWidth = 48;

        const transf = ctx.getTransform();
        const scale = Math.sin(animationNow() * 3) / 20 + 1 + (1 / 20);
        ctx.translate(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 4);
        ctx.scale(scale, scale);
        ctx.rotate(Math.sin(animationNow() * 2.8) * 0.0698); // 4 degrees
        ctx.textBaseline = 'middle';
        // Render title 2 times, once the background stroke, then the letters themselves
        for (let j = 0; j < 2; j++) {
            let startX = -this.#totalTitleLength / 2;
            for (let i = 0; i < this.#titleText.length; i++) {
                const char = this.#titleText[i];
                
                if(char !== ' ') {
                    if(j === 0)
                        ctx.strokeText(char, startX, this.#titleSine(3, 22, i / 3));
                    else {
                        ctx.fillStyle = fraction(animationNow() + i * 1.5) >= .5 ? this.#color2 : this.#color1;
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
    }

    onLoad() {
        this.#mainPanel = new UIPanel();
        const playBtn = new UIButton(Vector2.zero, 'PLAY GAME', ButtonTypes.RedLarge, () => { this.#playBtnClick(); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, ScaleAndRotateAnimation.apply, HoverFlyUpAnimation.apply, StartFadeFlyUpAnimation.bind(.4, Vector2.up.multiply(120), false));
        playBtn.setParent(this.#mainPanel);

        this.#modeSelectorPanel = new UIPanel();
        const smallWidth = getButtonSize(ButtonTypes.RedSmall).width + 20;
        const smallHeight = getButtonSize(ButtonTypes.RedSmall).height;
        const easyBtn = new UIButton(new Vector2(-smallWidth, 0), 'EASY', ButtonTypes.GreenSmall, () => { this.#playModeBtnClick(0); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, null, HoverFlyUpAnimation.apply);
        const normalBtn = new UIButton(new Vector2(0, 0), 'NORMAL', ButtonTypes.YellowSmall, () => { this.#playModeBtnClick(1); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, null, HoverFlyUpAnimation.apply);
        const hardBtn = new UIButton(new Vector2(smallWidth, 0), 'HARD', ButtonTypes.RedSmall, () => { this.#playModeBtnClick(2); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, null, HoverFlyUpAnimation.apply);
        const backBtn = new UIButton(new Vector2(0, smallHeight + 40), 'BACK', ButtonTypes.BlueLarge, () => { this.#backBtnClick(); }, HorizontalAlign.CENTER, VerticalAlign.CENTER, null, HoverFlyUpAnimation.apply)
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
    #playModeBtnClick(diff) { loadScene(new ChaseGameScene(diff)); }

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