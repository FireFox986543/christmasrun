class MenuScene extends Scene {
    constructor() {
        super();
    }

    gameLoop() {
        if (getKeyDown(KeyCode.KeySpace))
            loadScene(new ChaseGameScene());
    }
    render() {
        // Clear, Render background
        clearBuffer('white')
        
        ctx.font = '132px "Jersey 10"';
        ctx.fillStyle = '#98c5f3';
        ctx.strokeStyle = '#061f39';
        ctx.lineWidth = 25;
        const text = 'PRESS  [SPACE]  TO  START  GAME  . . .';
        const width = ctx.measureText(text).width;

        // Text height is approx. the quarter of the font size
        outlinedText(VIRTUAL_WIDTH / 2 - width / 2, VIRTUAL_HEIGHT / 2 + 132 / 4, 0, 4, text);
        fillCircle(VIRTUAL_WIDTH / 2 - width / 2, VIRTUAL_HEIGHT / 2, 3, 'red');

        renderPointer();
    }
}