let strOutput = test.createStream();

let output = document.createElement("pre");
output.setAttribute('style', `
    position: absolute;
    top: 0;
    left: 0;
    background: #fff;
    z-index:2;
    width: 100%;
`)

document.body.appendChild(output);

strOutput.on('data', (chunk) => {
    output.innerHTML += chunk
})
