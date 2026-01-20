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
const mousePosition = new Vector2(0, -1000);

document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener('keydown', function (e) {
    const k = e.key.toUpperCase();
    if(e.repeat) // Cancel Windows' stupid repeating functionality
        return;

    // Preserve some of the browsers' features
    const preserved = [KeyCode.KeyF5, KeyCode.KeyF11, KeyCode.KeyF12];
    if (preserved.indexOf(k) === -1)
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
    if(viewport.rect === undefined)
        return;

    mousePosition.x = (e.clientX - viewport.rect.left - viewport.offsetX) / viewport.scale;
    mousePosition.y = (e.clientY- viewport.rect.top - viewport.offsetY) / viewport.scale;
});
//document.addEventListener("pointermove", handleMouseButtons); pointermove causes problems when moving the mouse around and clicks not registering! So I temporarly removed it
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
    KeyF1: 'F1',
    KeyF2: 'F2',
    KeyF3: 'F3',
    KeyF4: 'F4',
    KeyF5: 'F5',
    KeyF6: 'F6',
    KeyF7: 'F7',
    KeyF8: 'F8',
    KeyF9: 'F9',
    KeyF10: 'F10',
    KeyF11: 'F11',
    KeyF12: 'F12',
});
const MouseButtons = Object.freeze({
    LEFT: 0,
    RIGHT: 1,
    MIDDLE: 2,
    BACK: 3,
    FORWARD: 4,
})