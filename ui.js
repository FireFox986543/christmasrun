let pointerType = PointerTypes.POINTER;
let selectedUIElement = null;

class UIElement {
    #enabled;
    #shadowed;
    selectable;

    constructor(rect, horizontalAlign = 0, verticalAlign = 0) {
        this.rect = rect;
        this.#enabled = true;
        this.#shadowed = false; // Shadowing means that one ancestor is disabled, so this one is considered inactive
        this.parent = null; // Null parent means it's attached to nothing
        this.children = [];
        this.horizontalAlign = horizontalAlign;
        this.verticalAlign = verticalAlign;
        this.selectable = true;
    }

    #posHelper(align, offset, size) {
        switch (align) {
            case 1:
                return offset - size / 2;
            case 2:
                return -offset - size;
            default:
                return offset;
        }
    }
    get x() { return viewport.viewLeft + viewport.visibleWidth2 * this.horizontalAlign + this.#posHelper(this.horizontalAlign, this.rect.x, this.width); }
    get y() { return viewport.viewTop + viewport.visibleHeight2 * this.verticalAlign + this.#posHelper(this.verticalAlign, this.rect.y, this.height); }
    get width() { return this.rect.width; }
    get height() { return this.rect.height; }

    get enabled() { return this.#enabled; }
    set enabled(value) { this.setActive(value); }
    get shadowed() { return this.#shadowed; }
    set shadowed(value) { this.setShadowed(value); }

    // Whether this element is truly active, based on shadowing
    get isActive() { return !this.#shadowed && this.#enabled; }

    render() { }
    onMouseEnter() { }
    onMouseExit() { }
    onMouseClick(btn) { }

    isMyChild(child) { return this.children.indexOf(child) > -1; }
    appendMultiple(...children) { children.forEach(c => this.appendChild(c)); }
    appendChild(child) {
        if (this.isMyChild(child))
            return;

        this.children.push(child);
        child.parent = this;
    }
    detachChild(child) {
        if (!this.isMyChild(child))
            return;

        arrayRemove(this.children, child);
        child.parent = null;
    }
    setParent(parent) {
        if (parent === null) {
            parent = null;
            return;
        }

        parent.appendChild(this);
    }
    separateParent() {
        this.parent.detachChild(this);
    }

    setShadowed(value) {
        this.#shadowed = value;

        if (this.#enabled)
            this.children.forEach(c => c.setShadowed(value));
    }
    setActive(value) {
        this.#enabled = value;

        if (this.children.length > 0 && !this.shadowed)
            this.children.forEach(c => c.setShadowed(!value));
    }
}
class UIButton extends UIElement {
    mouseOver = false
    hoverStart = 0;
    hoverEnd = 0;
    activeTime = 0;

    get inStartAnimDuration() { return this.startAnimation !== null && animationNow() <= this.activeTime + this.startAnimation.duration; }

    constructor(point, text, buttonType, clicked, horizontalAlign = 0, verticalAlign = 0, animation = null, hoverAnimation = null, startAnimation = null) {
        const button = UIAtlas[buttonType];
        super(new Rect(point.x, point.y, button.width * button.scale, button.height * button.scale), horizontalAlign, verticalAlign);
        this.text = text;
        this.buttonType = buttonType;
        this.clicked = clicked;
        this.mouseOver = false;
        this.animation = animation;
        this.hoverAnimation = hoverAnimation;
        this.startAnimation = startAnimation;
        this.activeTime = animationNow();
    }

    render() {
        let renderPoint = new Vector2(this.x, this.y);

        if (this.startAnimation !== null && this.inStartAnimDuration) {
            // Temporarly disable hovering effects by turning off selection for this element
            this.selectable = false;
            this.startAnimation.render(this);
        }
        else {
            // Re-enable selection after the start animation is finished
            this.selectable = true;

            // Don't let hover effects play if playing start animations
            if (this.hoverAnimation !== null)
                // In the anim function we pass in this to refer to this ui element, it WON't return a new position (yet)
                this.hoverAnimation(this);
        }

        if (this.animation !== null)
            // In the anim function we pass in this to refer to this ui element, also it will return the new position after the animation
            renderPoint = this.animation(this);

        renderButton(UIAtlas[`${this.mouseOver ? "HL_" : ""}${this.buttonType}`], this.text, renderPoint.x, renderPoint.y);
        ctx.globalAlpha = 1;
    }

    onMouseEnter() {
        pointerType = PointerTypes.HAND;
        this.mouseOver = true;
        this.hoverStart = animationNow();
    }
    onMouseExit() {
        pointerType = PointerTypes.POINTER;
        this.mouseOver = false;
        this.hoverEnd = animationNow();
    }
    onMouseClick(btn) { this.clicked(btn); }

    setShadowed(value) {
        super.setShadowed(value);

        if(this.startAnimation !== null && this.startAnimation.shadowingUpdates)
            this.activeTime = value ? -1000 : animationNow();
    }
    setActive(value) {
        super.setActive(value); // Handle normal logic

        this.activeTime = value ? animationNow() : -1000;
    }
}
class UIPanel extends UIElement {
    constructor() { super(Rect.identity); }
}
class UIText extends UIElement {
    constructor(point, text, color, horizontalAlign, verticalAlign) {
        super(new Rect(point.x, point.y, 0, 0), horizontalAlign, verticalAlign);
        this.selectable = false;
        this.text = text;
        this.color = color;
    }
}

function setPointer(pt) { pointerType = pt; }
function renderPointer() {
    const transf = ctx.getTransform();
    const scale = Math.sin(animationNow() * 1.3) / 50 + 1 + (1 / 50);
    ctx.translate(mousePosition.x - pointerType.hotspot.x, mousePosition.y - pointerType.hotspot.y)
    ctx.scale(scale, scale);
    ctx.drawImage(images['pointer' + pointerType.id], 0, 0, 100, 100);
    ctx.setTransform(transf);
}
function renderButton(button, text, x, y) {
    ctx.drawImage(images[button.atlas], button.x, button.y, button.width, button.height, x, y, button.width * button.scale, button.height * button.scale);
    ctx.font = '64px "Jersey 10"';
    ctx.fillStyle = 'white';
    const halfWidth = ctx.measureText(text).width / 2;
    const before = ctx.textBaseline;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(text, x + button.width * button.scale / 2 - halfWidth, y + button.height * button.scale / 2)
    ctx.textBaseline = before;
}

const HorizontalAlign = Object.freeze({
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2,
});
const VerticalAlign = Object.freeze({
    TOP: 0,
    CENTER: 1,
    BOTTOM: 2,
});

function getSelectedUIElement() {
    for (let i = 0; i < scene.uiElements.length; i++) {
        const e = scene.uiElements[i];
        if (e.isActive && e.selectable && AABBPoint(new Rect(e.x, e.y, e.width, e.height), mousePosition)) {
            if (selectedUIElement !== e) {
                if (selectedUIElement !== null)
                    selectedUIElement.onMouseExit();

                selectedUIElement = e;
                e.onMouseEnter();
            }

            return;
        }
    }

    if (selectedUIElement !== null)
        selectedUIElement.onMouseExit();

    selectedUIElement = null;
}
let _lastSelectedElement;
function handleUIClicks() {
    if (getMouseButtonDown(MouseButtons.LEFT))
        _lastSelectedElement = selectedUIElement;
    if (getMouseButtonUp(MouseButtons.LEFT) && selectedUIElement !== null && selectedUIElement === _lastSelectedElement)
        selectedUIElement.onMouseClick(MouseButtons.LEFT);
}