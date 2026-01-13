class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Size {
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