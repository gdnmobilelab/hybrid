
global.createImageBitmap = function(data:Blob) {
    return new Promise((fulfill, reject) => {
        (ImageBitmap as any).createImageBitmapCallbackErrorCallback(data, fulfill, reject);
    })
}