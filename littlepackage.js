//构建小包
let {toArrayBuffer,writeSyncBin,timestamtoTime,cmdCopy,glupCompressImage,mkdir,compressJPG,compressPNG,fileDisplay,zipSync,uglifyFile,getFileSuffix,getAllFileList,jsonMini} = require('./libs/tools');

let cmd = require('./libs/commander');
let path = require("path");
let fs = require("fs");
let {Byte} = require("./libs/byte.js");

cmd.option("-i <string>","input path");
cmd.option("-o <string>","out path");
cmd.parse(process.argv);
let opts = cmd.opts();

let input = opts.i;
let out = opts.o;
// console.log(opts);

function filter(url){
    // console.log(url);
    if(path.basename(url) == 'initconfig.js'){
        return false;
    }
    if(url.indexOf(`${input}\\resource`) !=-1){
        return false;
    }
    return true;
}
console.log("################################################## 构建小包");

let filelist = getAllFileList(input,filter);
// console.log(filelist);

let manifest = `${input}\\resource\\manifest.bin`;

filelist.push(manifest);

//#########################################################
function getKey(manifest) {
    let str = fs.readFileSync(manifest);
    // console.log(str);
    // let ab = toArrayBuffer(str);
    let bs = new Byte();
    bs.endian = Byte.LITTLE_ENDIAN;
    bs.writeArrayBuffer(str);
    bs.pos = 0;
    let len = bs.readUint32();
    // console.log(len);
    for (let i = 0; i < len; i++) {
        let _name = bs.readUTFString();
        let _timekey = bs.readUint32();
        console.log(_timekey, _name);
        // resMap[_name] = `${_timekey}/${_name}`;
        return _timekey;
    }
    return 0;
}

let timeKey = getKey(manifest);

// console.log(timeKey);
let oldLen = filelist.length;
if(timeKey){
    let filelist2 = getAllFileList(`${input}/resource/g/${timeKey}`);
    filelist = filelist.concat(filelist2);
}
out = `${out}\\little\\${timestamtoTime(timeKey*1000,'','','','')}`;

for(let i = 0;i < filelist.length;i++){
    let url = filelist[i];
    let p1 = url.replace(input,"");
    // console.log(url);
    let newurl = `${out}\\${p1}`;
    if(i == oldLen-1){
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    }
    cmdCopy(url,newurl);
}