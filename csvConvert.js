const fs = require('fs');
const path = require('path');
const json2csv = require('json2csv').parse;
const folderPath = path.join(__dirname, './translate') //遍历的文件夹路径

let csvData = []
const fields = ['key', 'zh-CN', 'en-US', 'zh-HK'];

const flattenObject = (obj, parentKey = '') => { // 对象扁平化
  const result = {}
  for (const key in obj) {

    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (obj[key].constructor === Object) {
      Object.assign(result, flattenObject(obj[key], currentKey))
    } else {
      result[currentKey] = obj[key]
    }
  }
  return result
}

const readFile = (filePath, parentKey) => { // 读取文件内容
  const data = fs.readFileSync(filePath, 'utf8');
  return flattenObject(JSON.parse(data), parentKey);
}
const resultData = {}

const readDir = (targetPath, parentKey) => {
  const files = fs.readdirSync(targetPath);

  // 遍历文件列表，区分目录和文件
  files.forEach((file) => {
    const filePath = path.join(targetPath, file);

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readDir(filePath, file)
    } else if (stat.isFile()) {
      const key = file.split('.')[0]

      Object.assign(resultData, flattenObject(readFile(filePath, key), parentKey))
    }
  });

}
readDir(folderPath)

// CSV文件字段
for (const key in resultData) {
  csvData.push({
    'key': key,
    'zh-CN': resultData[key]
  })
}


const csv = json2csv(csvData, { fields });

fs.writeFileSync(`translate.csv`, csv, 'utf-8');

console.log('CSV 文件已生成：translate.csv');
