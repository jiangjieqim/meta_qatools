let fs = require("fs");
let execSync = require('child_process').execSync;
let path = require("path");
let {zipSync,writeSyncBin,toArrayBuffer,getAllFileList,mkdir,copy,getFile,fileDisplay,cmdCopy,replaceAll} = require('./libs/tools');
let {jtob} = require("./json2b.js");
let {Byte} = require("./libs/byte.js");
// let JSZip = require("./libs/jszip.js");

let time = Date.now();

let cmd = require('./libs/commander');

let p1 = `D:/jjq/game/trunk/configs/excels`//`D:/jjq/game/design/配置表/excels`;

let jsonDir = 'D:/jjq/game/trunk/resource/o/config/export';

let codeDir = "D:/jjq/game/trunk/gameclient/src/game/static/json/struct";
let cshapedir = "D:/jjq/game/trunk/gameserver/ServerLib/StaticData/cfg";
cmd.option("-excels <string>","this is excels path");
cmd.option("-jsondir <string>","this is jsondir project path");
cmd.option("-codedir <string>","this is codedir project path");
cmd.option("-cshapedir <string>","this is cshapedir project path");

cmd.parse(process.argv);

let opt =  cmd.opts();

//  node json2bAll.js -excels "D://jjq//game//design//配置表//excels" -jsondir "D://jjq//game//trunk//resource//res//config//export" -codedir "D://jjq//game//trunk//gameclient//src//game//static//json//struct"

// node json2bAll.js -excels "D:\jjq\game\design\配置表\excels" -jsondir "D:\jjq\game\trunk\resource\res\config\export" -codedir "D:\jjq\game\trunk\gameclient\src\game\static\json\struct"

p1 = opt.Excels;
jsonDir = opt.Jsondir;
mkdir(jsonDir);

codeDir = opt.Codedir;
cshapedir = opt.Cshapedir;

let jsonParent = path.dirname(jsonDir);
let _list3 = fs.readdirSync(jsonParent);
///////////////////////////////////////////////////////////////////
//自定义配置json
let configFileList = [];
for(let i = 0;i < _list3.length;i++){
    let url =  `${jsonParent}/${_list3[i]}`;
    let stats = fs.statSync(url);
    let isFile = stats.isFile();
    if(isFile){
        configFileList.push(url);
    }
}
// console.log(configFileList);
//语言包
let fontPath = `${path.dirname(jsonParent)}\\font`; 
configFileList.push(`${fontPath}\\chineseCfg.json`);
configFileList.push(`${fontPath}\\englishCfg.json`);
///////////////////////////////////////////////////////////////////
function filter(url){
    let n = path.basename(url);
    let suffix = n.split('.')[1];
    if(suffix=='xlsx'){
        return true;
    }
    return false;
}

let flist =  getAllFileList(p1,filter);


// D:/jjq/game/tools/qatools

// console.log(flist);


// D:\jjq\game\trunk\resource\res\config\export


// jtob("D:/jjq/game/design/配置表/excels/t_action.xlsx",'D:/jjq/game/trunk/resource/res/config/export',"D:/jjq/game/trunk/gameclient/src/game/static/json/struct");


//build bin file
for(let i = 0;i < flist.length;i++){
    let url = flist[i];
    // execSync(`node json2b.js -excels ${url} -jsondir ${jsonDir} -codedir ${codeDir}`);
    jtob(url,jsonDir,codeDir,cshapedir);
}

console.log(`json to bin used ${Date.now()-time} ms`);


function filterBin(url){
    let n = path.basename(url);
    if(n == 'all.bin'){
        return false;
    }
    let suffix = n.split('.')[1];
    if(suffix=='bin'){
        return true;
    }
    return false;
}

let binflist =  getAllFileList(jsonDir,filterBin);

// console.log(binflist);
let bs = new Byte();
bs.endian = Byte.LITTLE_ENDIAN;
bs.writeUint32(binflist.length);
for(let i = 0;i < binflist.length;i++){
    let url = binflist[i];
    let s = fs.readFileSync(url,{encoding:"binary"});    //"utf-8"
    // console.log("pos:",bs.pos);
    bs.writeUint32(s.length);
    let ab = toArrayBuffer(s);
    // console.log(s.length,i,bs.pos);
    bs.writeArrayBuffer(ab);
    // console.log("######################");
}
// console.log("length",bs.length);


let filename = 'all';
let allbin = `${jsonDir}\\${filename}.bin`;

writeSyncBin(allbin,bs);


let pathStr = "";
for(let i = 0;i < configFileList.length;i++){
    let u = configFileList[i];
    pathStr+=u+";";
    // if(i < configFileList.length - 1){
        // pathStr+=";"
    // }
}
pathStr+=allbin;
console.log(zipSync(pathStr,allbin,true).toString());//zip 压缩

console.log("json2bAll:",allbin);

// let ss = new Byte();
// ss.writeUint32(11);
// ss.writeUTFString("aas");
// for(let i = 0;i < 5;i++){
//     ss.writeInt32(i);
// }
// writeSyncBin(allbin,ss);
// // zipSync(allbin,allbin);
// console.log("ss:",ss.length,'bytes');
