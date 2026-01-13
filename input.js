const keys = [];
const mousePosition = new Point(0, 0);

class KeyPress {
    constructor(state, processed) {
        this.state = state;
        this.processed = processed;
    }
}

document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener('keydown', function (e) {
    const k = e.key.toUpperCase();
    if (k.startsWith('F') && k.length > 1 || e.repeat) // Don't cancel keypresses for function keys, also repeat is canceled
        return;

    console.log(k);
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
  console.log("Viewport:", e.clientX, e.clientY);
});

// Each game loop tick, we're process each keypress to determine whether we pressed it this tick or not
function processKeys() {
    for (const key in keys) {
        if (!Object.prototype.hasOwnProperty.call(keys, key)) continue;
        keys[key].processed = true;
    }
}

function getKeydown(keycode) { // We just pressed down the key this tick
    if (!Object.prototype.hasOwnProperty.call(keys, keycode)) return false;
    return keys[keycode].state && !keys[keycode].processed;
}
function getKey(keycode) { // We are pressing down the key
    if (!Object.prototype.hasOwnProperty.call(keys, keycode)) return false;
    return keys[keycode].state;
}
function getKeyup(keycode) { // We just released the key this tick
    if (!Object.prototype.hasOwnProperty.call(keys, keycode)) return false;
    return !keys[keycode].state && !keys[keycode].processed;
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