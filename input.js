class KeyPress {
    constructor(state, processed) {
        this.state = state;
        this.processed = processed;
    }
}

const keys = {};
const mouseButtons = {
    0: new KeyPress(false, true),
    1: new KeyPress(false, true),
    2: new KeyPress(false, true),
    3: new KeyPress(false, true),
    4: new KeyPress(false, true),
};
const mousePosition = new Point(0, 0);

document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener('keydown', function (e) {
    const k = e.key.toUpperCase();
    if (k.startsWith('F') && k.length > 1 || e.repeat) // Don't cancel keypresses for function keys, also repeat is canceled
        return;
        
    e.preventDefault();

    if (keys[k] === undefined)
        keys[k] = new KeyPress((e.type == "keydown"), false);
    else {
        keys[k].state = (e.type == "keydown");
        keys[k].processed = false;
    }
})
document.addEventListener('keyup', function (e) {
    const k = e.key.toUpperCase();

    if (keys[k] === undefined)
        keys[k] = new KeyPress((e.type == "keydown"), false);
    else {
        keys[k].state = (e.type == "keydown");
        keys[k].processed = false;
    }
})
document.addEventListener("mousemove", (e) => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
});
document.addEventListener("pointermove", handleMouseButtons);
document.addEventListener("pointerdown", handleMouseButtons);
document.addEventListener("pointerup", handleMouseButtons);

function handleMouseButtons(e) {
    for (let i = 0; i < 5; i++) {
        if ((1 << i) & e.buttons) {
            mouseButtons[i].processed = mouseButtons[i].state;
            mouseButtons[i].state = true;
        }
        else {
            mouseButtons[i].processed = !mouseButtons[i].state;
            mouseButtons[i].state = false;
        }
    }
}

// Each game loop tick, we're process each keypress to determine whether we pressed it this tick or not
function processKeys() {
    for (const key in keys) {
        if (!Object.prototype.hasOwnProperty.call(keys, key)) continue;
        keys[key].processed = true;
    }
    for (let i = 0; i < 5; i++)
        mouseButtons[i].processed = true;
}

function getKeyDown(keycode) { // We just pressed down the key this tick
    if (!Object.prototype.hasOwnProperty.call(keys, keycode)) return false;
    return keys[keycode].state && !keys[keycode].processed;
}
function getKey(keycode) { // We are holding down the key
    if (!Object.prototype.hasOwnProperty.call(keys, keycode)) return false;
    return keys[keycode].state;
}
function getKeyUp(keycode) { // We just released the key this tick
    if (!Object.prototype.hasOwnProperty.call(keys, keycode)) return false;
    return !keys[keycode].state && !keys[keycode].processed;
}

function getMouseButtonDown(mousebutton) { // We just pressed down the button this tick
    return mouseButtons[mousebutton].state && !mouseButtons[mousebutton].processed;
}
function getMouseButton(mousebutton) { // We are holding down the button
    return mouseButtons[mousebutton].state;
}
function getMouseButtonUp(mousebutton) { // We just released the button this tick
    return !mouseButtons[mousebutton].state && !mouseButtons[mousebutton].processed;
}

const KeyCode = Object.freeze({
    KeyA: 'A',
    KeyB: 'B',
    KeyC: 'C',
    KeyD: 'D',
    KeyE: 'E',
    KeyF: 'F',
    KeyG: 'G',
    KeyH: 'H',
    KeyI: 'I',
    KeyJ: 'J',
    KeyK: 'K',
    KeyL: 'L',
    KeyM: 'M',
    KeyN: 'N',
    KeyO: 'O',
    KeyP: 'P',
    KeyQ: 'Q',
    KeyR: 'R',
    KeyS: 'S',
    KeyT: 'T',
    KeyU: 'U',
    KeyV: 'V',
    KeyW: 'W',
    KeyX: 'X',
    KeyY: 'Y',
    KeyZ: 'Z',
    Key0: '0',
    Key1: '1',
    Key2: '2',
    Key3: '3',
    Key4: '4',
    Key5: '5',
    Key6: '6',
    Key7: '7',
    Key8: '8',
    Key9: '9',
    KeyEscape: 'ESCAPE',
    KeyEnter: 'ENTER',
    KeyTab: 'TAB',
    KeyBackspace: 'BACKSPACE',
    KeyDelete: 'DELETE',
    KeySpace: ' ',
    KeyShift: 'SHIFT',
    KeyControl: 'CONTROL',
    KeyAlt: 'ALT',
    KeyMeta: 'META',
    KeyCapsLock: 'CAPSLOCK',
    KeyArrowUp: 'ARROWUP',
    KeyArrowDown: 'ARROWDOWN',
    KeyArrowLeft: 'ARROWLEFT',
    KeyArrowRight: 'ARROWRIGHT',
    KeyHome: 'HOME',
    KeyEnd: 'END',
    KeyPageUp: 'PAGEUP',
    KeyPageDown: 'PAGEDOWN',
});
const MouseButtons = Object.freeze({
    Left: 0,
    Right: 1,
    Middle: 2,
    Back: 3,
    Forward: 4,
})