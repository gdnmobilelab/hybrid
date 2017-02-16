var path = require('path');
var fs = require('fs');

const allFilesSync = (dir, fileList = []) => {
  
  if (fs.statSync(dir).isDirectory() === false) {
      return [dir]
  }


  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file)

    if (fs.statSync(filePath).isDirectory()) {
        allFilesSync(filePath, fileList);
    } else {
        fileList.push(filePath);
    }

  })
  return fileList
}

module.exports = allFilesSync;