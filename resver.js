//资源管理
let cmd = require('./libs/commander');
let path = require("path");
let fs = require("fs");
let cwd = process.cwd();
let {Byte} = require("./libs/byte.js");
let {execSync} = require('child_process');
console.log("################################################## 生成manifest");

let {deleteall,writeSyncBin,timestamtoTime,cmdCopy,glupCompressImage,mkdir,compressJPG,compressPNG,fileDisplay,zipSync,uglifyFile,getFileSuffix,getAllFileList,jsonMini} = require('./libs/tools');

const MANIFEST_FILE = 'manifest.json';
const MANIFEST_FILE_BIN = "manifest.bin";

function getMd5FileMap(dir) {
    let baseMap = {};
    let allfile = getAllFileList(`${dir}`);
    // allfile = allfile.concat(getAllFileList(`${dir}\\ui`));
    for (let i = 0; i < allfile.length; i++) {
        let url = allfile[i];

        let back = url.replace(dir,'');
        let arr = back.split("\\");
        if(arr.length >=2 && arr[1] == 'g'){
            continue;
        }
        if (path.basename(url) == MANIFEST_FILE ||
        path.basename(url) == MANIFEST_FILE_BIN
        ) {

        } else {
            let s = fs.readFileSync(url);
            // console.log(s.toString());
            // let a = s.toString();
            let v = MD5(s);
            let key = url.replace(dir + '\\', "");
            key = key.replace(/\\/g, '/');
            // console.log(key);
            baseMap[key] = v;
        }
        // console.log(v);
    }
    return baseMap;
}
let MD5 = require(`${cwd}/npm/node_modules/js-md5`);

cmd.option("--base <string>","base path");
cmd.option("--cur <string>","cur path");
cmd.option("-o <string>","out path");

cmd.parse(process.argv);
let opts = cmd.opts();

// let timeStr = timestamtoTime(Date.now());
//let startTime= new Date(2022,0,1,0,0,0).getTime();//uint32 Max 2106 02 07 14 28 15
let curtime = ((Date.now())/1000).toFixed(0);

// curtime = 1;


let basePath = opts.base;//基础资源包
let curPath = opts.cur;  //当前使用的资源包
let outPath = `${curPath}/g`;

deleteall(outPath);

mkdir(outPath);

// opts.o;//增量资源包路径



// let s = MD5("dasdas");
// console.log(s);

let time = Date.now();



let baseMap = getMd5FileMap(basePath);
let curMap = getMd5FileMap(curPath);
let testKey = `res/font/englishCfg.json`;



console.log(`${Date.now() - time} ms`);
// D:\jjq\game\trunk\release\resource\res\font\englishCfg
// console.log(`len: ${allfile.length}`);

// let str = ;
// console.log(str);
fs.writeFileSync(`${curPath}/${MANIFEST_FILE}`, JSON.stringify(curMap), { encoding: "utf-8" });
fs.writeFileSync(`${basePath}/${MANIFEST_FILE}`, JSON.stringify(baseMap), { encoding: "utf-8" });

//增量文件map
let newMap = {};
for(let i in curMap){
    // console.log(i,curMap[i]);
    let url = i;
    let v = curMap[i];
    if(baseMap[url]!=v){
        newMap[url] = `${curtime}/${i}`;
    }
}

// console.log(newMap);
//################################################################
// mkdir(`${outPath}/${curtime}`);
let cnt = 0;
for(let url in newMap){
    let targetUrl = newMap[url];
    targetUrl = targetUrl.replace(/\//g,'\\');
    url = url.replace(/\//g,'\\');
    cmdCopy(`${curPath}/${url}`,`${outPath}\\${targetUrl}`);
    // console.log(url);
    cnt++;
}
//  resver.js --base D:\jjq\game\trunk\release\resource --cur D:\jjq\game\trunk\releaseVer2\resource -o D:\jjq\game\trunk\newresource
let mByte = new Byte();//字节流对象
mByte.writeUint32(cnt);
for(let url in newMap){
    // console.log(url);
    //let v = newMap[url];
    newMap[url]= curtime;
    mByte.writeUTFString(url);
    mByte.writeUint32(curtime);
}
let mjson = `${curPath}/${MANIFEST_FILE}`.replace(/\//g,'\\');
let binfile = `${curPath}/${MANIFEST_FILE_BIN}`.replace(/\//g,'\\');

fs.writeFileSync(mjson,JSON.stringify(newMap),"utf8");
writeSyncBin(binfile,mByte);

console.log("out:\n"+mjson+'\n'+binfile);

/*
"program": "littlepackage.js",
"args": [
    "-i","D:\\jjq\\game\\trunk\\release",
    "-o","D:\\jjq\\game\\trunk",
]
},
*/
function littlePackage(_path){
    let i=path.dirname(_path);
    let o=path.dirname(i);
    let s = execSync(`node littlepackage.js -i ${i} -o ${o}`);
    console.log(s.toString());
}

littlePackage(curPath);