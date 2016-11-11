
// Swift exports of functions include argument names in them, so they don't
// map properly to the Canvas API. We need to fix that.

let toMap:any = {
    arcToY1X2Y2Radius: "arcTo",
    arcYRadiusStartAngleEndAngleAntiClockwise: "arc",
    bezierCurveToCp1yCp2xCp2yXY: "bezierCurveTo",
    clearRectYWidthHeight: "clearRect",
    fillRectYWidthHeight: "fillRect",
    lineToY: "lineTo",
    moveToY: "moveTo",
    quadraticCurveToCpyXY: "quadraticCurveTo",
    rectYWidthHeight: "rect",
    strokeRectYWidthHeight: "stroke"
    
}

let asAny = CanvasRenderingContext2D as any;

for (let key in toMap) {
    asAny.prototype[toMap[key]] = asAny.prototype[key];
}

asAny.prototype.drawImage = function() {
    if (arguments.length === 3) {
        this.drawImageDxDy.apply(this, arguments);
    } else if (arguments.length === 5) {
        this.drawImageDxDyDWidthDHeight.apply(this, arguments);
    } else if (arguments.length === 9) {
        this.drawImageSxSySWidthSHeightDxDyDWidthDHeight.apply(this, arguments);
    } else {
        throw new Error("Did not understand drawImage arguments. Length: " + String(arguments.length))
    }

    
}