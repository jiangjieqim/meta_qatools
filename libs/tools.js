let path = require("path");
let fs = require("fs");
let execSync = require('child_process').execSync;
let cwd = process.cwd();
let ideModuleDir = `${cwd}/npm/node_modules/layaair2-cmd/node_modules/`;
const jsonminify =  require(ideModuleDir + "jsonminify");
const images =  require(`${cwd}/npm/node_modules/images/index.js`);
let JSZip = require("./jszip.js");
const { fork } = require("child_process");
const node_xj = require(`${cwd}/npm/node_modules/xls-to-json/index.js`);

// console.log(image);
// D:\jjq\game\tools\qatools\npm\node_modules\layaair2-cmd\node_modules\uglify-js
// const uglify =  require(ideModuleDir + "uglify-js/bin/uglifyjs");

//创建目录
//dirname : 'D:\\jjq\\game\\resource\\anims'
function mkdir(dirname){
    if(fs.existsSync(dirname)){
        return true;
    } else {
        if (mkdir(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
/**
 * 重置image宽高
 * resizeImage('D:/jjq/game/tools/qatools/tro_m_9_D.jpg','D:/jjq/game/tools/qatools/tro_m_9_D_small.jpg',0.5);
 */
function resizeImage(i, o, percentum) {
    let img = images(i);
    
    let oldW = img.width();
    let oldH = img.height();
    let c = Math.min(oldH,oldW);
    let p  = 1 / c;
    if(percentum < p){
        percentum = p;//像素不可以小于1
        console.log(`fix percentum ${percentum}`);
    }
    let w = oldW * percentum;
    img.size(w);
    img.save(o, {
        quality: percentum * 100
    });
    console.log(`resizeImage old w = ${oldW} h = ${oldH} new w = ${w} h = ${oldH*percentum} ${o}`);
}

/**copy */
function cmdCopy(desc,out){
     let f1 = path.dirname(out);
     mkdir(f1);
     cmd = `copy "${desc}" "${out}"`;
    //  console.log(cmd);
     let s = execSync(cmd);
    //  console.log("CmdCOPY",'\t',desc,'\t',out);
}

function copy(desc,out){
    let s = fs.readFileSync(desc,{encoding:"utf8"});
    fs.writeFileSync(out,s,{encoding:"utf8"});
    // console.log("COPY",'\t',desc,'\t',out);
}

function checkSuffix(u,arr){
    for(let i  =0;i < arr.length;i++){
        if (u.indexOf(arr[i])!=-1) {
            return true;
        }
    }
}

/**
 * 只编译根目录下的文件
 * @param {*} filePath 
 * @param {*} func 
 * @param {*} suffixArr 过滤的文件类型
 */
function getFile(filePath,func,suffixArr=[".xml"]){
    let _l1 = fs.readdirSync(filePath);
    for (let i = 0; i < _l1.length; i++) {
        let u = path.join(filePath, _l1[i]);
        // if (u.indexOf(suffix)!=-1) {
        if(checkSuffix(u,suffixArr)){
            let str = fs.readFileSync(u, { encoding: "utf8" })
            func(u, str);
        }
    }
}

function deleteall(path) {
    let files = []
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path)
        files.forEach(function (file, index) {
            // console.log(file);      
            let curPath = path + '/' + file
            // console.log(curPath)
            if (fs.statSync(curPath).isDirectory()) {
                // recurse        
                deleteall(curPath)
            } else {
                // delete file     
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
}
//参数一  :   删除该路径下的名为参数二的文件夹或文件
//参数二: 需要删除的文件夹或文件名// 
//findFileDelAll('I:\\workspace', 'node_modules')
function findFileDelAll(path, findName) {
    let filesAll = []
    if (fs.existsSync(path)) {
        filesAll = fs.readdirSync(path)
        filesAll.forEach((fileItem, index) => {
            let findCurrPath = path + '/' + fileItem
            if (fileItem == findName) {
                console.log(findCurrPath,"*",findName);
                deleteall(findCurrPath)
                findFileDelAll(path, findName);
            } else {
                if (fs.statSync(findCurrPath).isDirectory()) {
                    // recurse       
                    findFileDelAll(findCurrPath, findName)
                }
            }
        })
    }
}

// 遍历所有文件夹
function fileDisplay(filePath, callBack) {
    let files = fs.readdirSync(filePath);
    files.forEach(function (filename) {
        let fileDir = path.join(filePath, filename);
        let stats = fs.statSync(fileDir);
        let isFile = stats.isFile();
        let isDir = stats.isDirectory();
        if (isFile) {
            callBack(fileDir);
        }
        if (isDir) {
            fileDisplay(fileDir, callBack);
        }
    });
}
//获取文件目录下的所有文件列表
function getAllFileList(filepath,filter){
    let fileList = [];
    fileDisplay(filepath,(url)=>{
        if(filter){
            if(filter(url)){
                fileList.push(url);
            }
        
        }else{
            fileList.push(url);
        }
    });
    return fileList;
}

function replaceAll(str,s,t){
    let index = str.indexOf(s)
    if(index == -1){
        return str;
    }
    str = str.replace(s,t);
    return replaceAll(str,s,t);
}
//json去空格，换行，压缩
function jsonMini(str){
    return jsonminify(str);
}

//js压缩
function uglifyFile(i,o){
    // let m = confuse == true ? "-m" : "";
    let cmd =`uglifyjs -V & uglifyjs -o ${o} ${i} --mangle -c --define DEBUG=true`;
    let s = execSync(cmd);
    console.log('uglifyjs:'+o);
    return s.toString();
}
/*

 glupCompressImage('D:\\jjq\\game\\resource\\**\\*.{png,jpg}','D:\\jjq\\game\\out\\',()=>{
        console.log("finish");
    });

*/
function glupCompressImage(i,o,end){
    // let cmd = `node ${cwd}\\npm\\node_modules\\layaair2-cmd\\node_modules\\gulp\\bin\\gulp.js --gulpfile=${cwd}\\libs\\compresspng.js `;
    // let s = execSync(cmd);
    let cmd = [`--gulpfile=${cwd}\\libs\\compresspng.js`,`-i=${i}`,`-o=${o}`];  //,`${i}`,`${o}`
    let _gulp = fork( `${cwd}\\npm\\node_modules\\layaair2-cmd\\node_modules\\gulp\\bin\\gulp.js`,cmd,{
        silent: true
    })

    _gulp.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    
    _gulp.stderr.on('data', (data) => {
        console.log(`${data}`);
    });
    
    _gulp.on('close', (code) => {
        console.log(`exit：${code}`);
        end();
    });
}

/**
 * 压缩png
 * compressPNG("D:\\jjq\\game\\tools\\qatools\\business.png","D:\\jjq\\game\\tools\\qatools\\businessMIN.png",0);
 * @param {*} quality 0-100
 */
function compressPNG(i,o,quality,errList){
    if(fs.existsSync(o)){
        // console.log("is exists! del "+o);
        // throw Error("file exists");
        fs.unlinkSync(o);
    }
    let time = Date.now();

    // console.log("start "+i);
    let s = "";
    // quality = quality || "30-50"
    if(!quality){
        quality = quality || "30-50"
    }else{
        let q = quality;
        let min = q - 10;
        let max = q + 10;
        if(min < 0){
            min = 0;
        }
        if(max >100){
            max = 99;
        }

        quality = `${min}-${max}`;
    }
    let cmd = `${cwd}\\pngquant\\pngquant --quality=${quality} "${i}" -o "${o}"`;
    let outStat;
    try{
        s = execSync(cmd);
        // console.log(s);
        outStat = fs.statSync(o);
    }
    catch(e){
        // console.log(e.stack);
        // if(errList){
        errList.push({i:i,o:o,quality:quality});//i,o,quality
        // }
        // console.log(e);
        // glupZip(i,o);
        // glupCompressImage('D:\\jjq\\game\\1\\business.png','D:\\jjq\\game\\1\\out\\',()=>{
        //     console.log("finish");
        // });
        
    }
    // console.log();
    let inputStat = fs.statSync(i);
    let n = 0;
    if(outStat){
        n =  ((outStat.size / inputStat.size)*100).toFixed(2);
    }
    console.log(`${n}% compressPNG:`+o+(` used ${(Date.now() - time)} ms`));

    return s.toString();
}
/**
 *compressJPG("D:\\jjq\\game\\tools\\qatools\\rode1.jpg","D:\\jjq\\game\\tools\\qatools\\rode1Min.jpg",30); 
 * @param {*} quality 0-100
 */
function compressJPG(i,o,quality){
    let inputStat = fs.statSync(i);
    images(i).save(o,{quality:quality});
    outStat = fs.statSync(o);
    let n =  ((outStat.size / inputStat.size)*100).toFixed(2);
    console.log(`${n}% compressJPG`,quality,o);

}
/*
let o = "D:\\jjq\\game\\tools\\qatools\\bundle.zip";
let url = "D:\\jjq\\game\\tools\\qatools\\bundle.js";
zipAsync(o,url,()=>{
    console.log(0)
})
console.log(1)
*/
function zipAsync(o,url,end){
    // console.log(JSZip);
    let str = fs.readFileSync(url);
    let filename = path.basename(url);
    let zip = new JSZip();
    zip.file(filename, str);
    let s = zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }
    }).then(function (content) {
        fs.writeFileSync(o, content, { encoding: "utf-8" });
        console.log("zip file:" + o);
        end();
    });
}
/**
 * zipSync("D:\\jjq\\game\\tools\\qatools\\bundle.js","D:\\jjq\\game\\tools\\qatools\\bundle.zip");
 */
function zipSync(i,o){
    let cmd =  `node ${cwd}\\libs\\zip -i ${i} -o ${o}`;
    let s = execSync(cmd);
    return s;
}

function getFileSuffix(url){
    let name = path.basename(url);
    let arr = name.split(".");
    return arr[arr.length - 1];
}
/**

xls2Json('D:/jjq/game/design/配置表/excels/t_action.xlsx','D:/jjq/game/tools/qatools/t_action.json',()=>{
    console.log(1);
});
 */
function xls2Json(i,o,callBack){
    node_xj({
        input:i,
        output:o
    },
    function(err,result){
        if(err){
            console.log(err);
        }else{
            //console.log(result);
        }
        callBack();
    }
    );
}
/**
 xls2JsonSync('D:/jjq/game/design/配置表/excels/t_action.xlsx','D:/jjq/game/tools/qatools/t_action.json');
 */
function xls2JsonSync(i,o){
    let cmd =  `node ${cwd}\\libs\\xlsx2json -i ${i} -o ${o}`;
    let s = execSync(cmd);
    return s;
}
function toBuffer(ab){
    let buf =  Buffer.alloc(ab.byteLength);//new Buffer(ab.byteLength);
    let view = new Uint8Array(ab);
    for(let i = 0;i< buf.length;i++){
        buf[i] = view[i];
    }
    return buf;
}
//将Byte对象写入文件
function writeBin(out,mByte,_call){
    let bf = toBuffer(mByte.buffer);
    let ws = fs.createWriteStream(out);
    ws.write(bf);
    ws.end();
    ws.on("close",()=>{
        console.log('writeBin -> '+out);
        _call();
    });
}
function writeSyncBin(out,mByte){
    
    let s = mByte.readUint8Array(0,mByte.length);
    // let s = mByte.readArrayBuffer(mByte.length);
    // let o = toBuffer(s);
    // let str = mByte.readUTFBytes();
    fs.writeFileSync(out,s,"binary");
    

    // mByte.pos = 0;
    // let s = mByte.readUTFBytes(mByte.length);
    // fs.writeFileSync(out,s,{encoding:"utf8"});

}
function toArrayBuffer(buf){
    let ab = new ArrayBuffer(buf.length);
    let view = new Uint8Array(ab);
    for(let i = 0;i < buf.length;i++){
        // let s = buf[i];
        var c = buf.charCodeAt(i);
        view[i] = c;
    }
    return ab;
}

function uglifyAndZip(p){
    uglifyFile(p,p);
    zipSync(p,p);
}

/**
   * @param v 毫秒
   * 1403058804000 -> 20140618103300
   * 时间戳转时间
   */
function timestamtoTime(v, k = "", dk = "", tk = "", mid = "") {
    let date = new Date(v);
    let Y = date.getFullYear() + k;
    let M = (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + k;
    let D = date.getDate() + dk;
    let h = date.getHours() + tk;
    let m = date.getMinutes() + tk;
    let s = date.getSeconds();
    return Y + M + D + mid + h + m + s;
}
//移除注释/**/
function replaceComments(data) {
    data = data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
    return data;
}

function tryExecSync(cmd){
    console.log(cmd);
    try{
        let p = execSync(cmd);
        console.log(p.toString());
    }catch(e){
        for(let i = 0;i < e.output.length;i++){
            let o = e.output[i];
            if(o){
                console.log('error:['+o.toString()+']');
            }
        }
    }
}

module.exports = { mkdir, copy, getFile, findFileDelAll, fileDisplay, cmdCopy, replaceAll, 
    jsonMini, uglifyFile, compressPNG,
     compressJPG ,zipSync,getFileSuffix,getAllFileList,glupCompressImage,resizeImage,
     xls2Json, xls2JsonSync,writeBin, toArrayBuffer,writeSyncBin,uglifyAndZip,timestamtoTime,
     deleteall,
     toBuffer,replaceComments,tryExecSync
    };