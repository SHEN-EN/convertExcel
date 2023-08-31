const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const csvFilePath = path.join(__dirname, '../translate.csv');
const iconv = require('iconv-lite');

const mkdir = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true }, (err) => {
      if (err) {
        throw err;
      }
    })
  }
}


const handleDelete = (targetPath) => {

  if (fs.existsSync(targetPath)) {
    console.log('is exists');
    fs.unlink(targetPath, err => {

      if (err) {
        console.log('delete fail', err);
        process.exit(1);
      }
    });
  }
}

const mkFile = (targetPath) => {
  handleDelete()
  fs.writeFileSync(targetPath, '')
}

const writeFile = (targetPath, content) => {
  if (!content) return

  const writeStream = fs.createWriteStream(targetPath, { flags: 'a', encoding: "utf-8" });
  writeStream.write(JSON.stringify(content));
  writeStream.on('finish', () => {
    writeStream.end();
  })
}

const arrayToObject = (arr, content) => {
  if (!content) return
  let result = {}
  let current = result;
  arr.forEach((iterator, index) => {
    current[iterator] = index === arr.length - 1 ? content : {}
    current = current[iterator]
  });
  return result;
}

const deepMerge = (obj1, obj2) => { //input: {header:{content:''}} , {header:{titile:''}} output: {header:{content:'',titile:''}}

  for (const key in obj2) {
    if (obj1.hasOwnProperty(key) && typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      deepMerge(obj1[key], obj2[key]);
    } else {
      obj1[key] = obj2[key];
    }
  }

}

const dataMap = {}
const createJson = (iterator) => {
  let keyParts = []
  keyParts = iterator['key'].split('.'); // [0] 模块名字 [1] json文件夹名字 

  for (const key in iterator) { // 创建语言
    if (key !== 'key') {
      const dirPath = path.join(__dirname, `./translateCsv/${keyParts[0]}/${key}`)

      mkdir(dirPath)
      mkFile(path.join(dirPath, `${keyParts[1]}.json`));
      const mergeData = {}

      const data = arrayToObject(keyParts.slice(2), iterator[key])
      mergeData[path.join(dirPath, `${keyParts[1]}.json`)] = data

      iterator[key] && deepMerge(dataMap, mergeData)
    }
  }
}

const csvtojsonFn = () => {
  if (!fs.existsSync(csvFilePath)) {
    console.log('csv 文件不存在')
    return
  }
  fs.createReadStream(csvFilePath, { encoding: "utf-8" })
    .pipe(csv())
    .on('data', (row) => {
      createJson(row)
    })
    .on('end', () => {
      for (const key in dataMap) {
        writeFile(key, dataMap[key])
      }
      console.log('JSON 文件已生成:', path.join(__dirname, './translateCvs'))
    })
    .on('error', (err) => {
      console.error('Error occurred during conversion:', err);
    });
}

const convertCvsDecode = () => { // 把cvs 转换成utf-8格式
  fs.readFile(csvFilePath, (err, data) => {
    if (err) {
      console.error('Error reading the input file:', err);
      return;
    }

    // 去除BOM标记并转换为普通UTF-8编码
    const utf8Data = iconv.decode(data, 'utf-8');

    // 保存为UTF-8编码的文件
    fs.writeFile(csvFilePath, utf8Data, 'utf8', (err) => {
      if (err) {
        console.error('Error writing the output file:', err);
        return;
      }
      
      csvtojsonFn();
    });
  });
}

convertCvsDecode()