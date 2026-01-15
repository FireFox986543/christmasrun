class Point {
    static zero = new Point(0, 0);
    static one = new Point(1, 1);
    static up = new Point(0, 1);
    static down = new Point(0, -1);
    static left = new Point(-1, 0);
    static right = new Point(1, 0);

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(p) { return new Point(this.x + p.x, this.y + p.y); }
    subtr(p) { return new Point(this.x - p.x, this.y - p.y); }
    negate() { return new Point(-this.x, -this.y); }
    equals(p) { return this.x === p.x && this.y === p.y; }
}
class Size {
    static zero = new Size(0, 0);
    static one = new Size(1, 1);

    get area() { return this.width * this.height; }

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}
class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    static fromPointSize(point, size) {
        return new Rect(point.x, point.y, size.width, size.height);
    }
}