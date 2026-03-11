// console.log(11);
// D:\jjq\game\tools\qatools\npm\node_modules\layaair2-cmd\node_modules\gulp-jsonminify

let fs = require("fs");
let path = require("path");
let execSync = require('child_process').execSync;

let cwd = process.cwd();
// console.log(cwd);//"d:\\jjq\\game\\tools\\qatools"
let ideModuleDir = `${cwd}/npm/node_modules/layaair2-cmd/node_modules/`;
const gulp = require(ideModuleDir + "gulp");
const jsonminify = require(ideModuleDir + "gulp-jsonminify");

// const jsonmin =  require(ideModuleDir + "jsonminify");
let {getAllFileList,xls2JsonSync,xls2Json,resizeImage,jsonMini,uglifyFile,compressPNG,compressJPG,zipSync} = require('./libs/tools');


// console.log(jsonminify);




// let cmd =`cd D:/LayaTest/a1 & layaair2-cmd publish -c web`;
// // let cmd = `cd D:/LayaTest/a1 & layaair2-cmd compile`;
// let s = execSync(cmd);
// console.log(s.toString());


//D:\\jjq\\game\\tools\\qatools\\npm\\node_modules\\layaair2-cmd\\node_modules\\gulp\\bin\\gulp.js


// "D:\\jjq\\game\\tools\\qatools\\npm\\node_modules\\layaair2-cmd\\node_modules\\gulp\\bin\\gulp.js"
// '--gulpfile=D:\\LayaTest\\a1\\.laya\\publish.js'
// '--config=web.json'
// 'publish'

/*

let cmd = `node ${cwd}\\npm\\node_modules\\layaair2-cmd\\node_modules\\gulp\\bin\\gulp.js --gulpfile=${cwd}\\a.js`;
let s = execSync(cmd);
console.log(s.toString());
*/



/*
let str = fs.readFileSync(`${cwd}\\boots_f_3A.lh`,{encoding:"utf8"});
// console.log(str.length);
let b =  jsonMini(str);
// console.log(b.length);
console.log('['+
// uglifyFile('D:\\jjq\\game\\tools\\qatools\\zipres.js','D:\\jjq\\game\\tools\\qatools\\zipresMin.js',true)
uglifyFile(`D:\\jjq\\game\\gameclient\\bin\\js\\bundle.js`,`D:\\jjq\\game\\gameclient\\bin\\js\\minbundle.js`)

+']');

*/
// compressPNG("D:\\jjq\\game\\tools\\qatools\\business.png","D:\\jjq\\game\\tools\\qatools\\businessMIN.png",0);


// compressJPG("D:\\jjq\\game\\tools\\qatools\\rode1.jpg","D:\\jjq\\game\\tools\\qatools\\rode1Min.jpg",30);


// const ws = fs.createWriteStream("file.zip");
// s.pipe(ws);
// console.log(0);

// let o = "D:\\jjq\\game\\tools\\qatools\\bundle.zip";
// let url = "D:\\jjq\\game\\tools\\qatools\\bundle.js";
// zipAsync(o,url,()=>{
//     // console.log(0)
// })
// // console.log(1)




// console.log(1);
// zipSync("D:\\jjq\\game\\tools\\qatools\\bundle.js","D:\\jjq\\game\\tools\\qatools\\bundle.zip");
// console.log(2);

// resizeImage(`D:/jjq/game/out/resource/ui/remote/main/create/img_line_2.png`,
// `d:/1.png`,0.3);

// let time = Date.now();
// xls2Json('D:/jjq/game/design/配置表/excels/t_action.xlsx','D:/jjq/game/tools/qatools/t_action.json',()=>{
//     console.log("b",Date.now()-time);
// });
// console.log("a",Date.now()-time);

// xls2JsonSync('D:/jjq/game/tools/qatools/t_action.xlsx','D:/jjq/game/tools/qatools/t_action.json');

//  'D:/jjq/game/design/配置表/excels/t_action.xlsx'

// xls2JsonSync('D:/jjq/game/design/配置表/excels/t_action.xlsx','D:/jjq/game/tools/qatools/t_action2.json');


// let {Byte} = require("./libs/byte.js");

// let b = new Byte();
// b.writeUTFString("jianjai");
// b.writeByte(2);
// b.pos = 0;

// console.log(b.readUTFString());
// console.log(b.readByte());

// let {uint64,fromValue} = require("./libs/uint64.js");



// let n2 = new uint64(0,0,false);
// n2.add('101010101');
// let k = fromValue('1010101010000000000000000000000000000');

// console.log(k.toString());

// let {start} = require("./json2b.js");
// console.log(start);

// let JSZip = require("./libs/jszip.js");

// zipSync(`D:/jjq/game/trunk/resource/res/config/comCfg.json;D:/jjq/game/trunk/resource/res/config/guideCfg.json`,`D:/jjq/game/trunk/resource/res/config/1.zip`);

// console.log(1);


// tsc --outDir "bin2/js" --sourceMap false

// let curpath = `D:/jjq/game/trunk`;
// let new1 = `${curpath}/gameclient/bin2`;
// let cfile = getAllFileList(new1);
// // console.log(cfile);

// let str = '';
// for(let i =0;i < cfile.length;i++){
//     let url = cfile[i];
//     str += fs.readFileSync(url);
// }
// // console.log(str);
// let cp = `${curpath}/gameclient/bundle.js`;
// fs.writeFileSync(`${curpath}/gameclient/bundle.js`, str, { encoding: "utf-8" });


// // uglifyFile(cp,cp);

// // zipSync(cp,`${curpath}\\gameclient\\bin\\js\\bundle.zip`);

// console.log(1);

let js2IIFE = require(`${cwd}/npm/node_modules/jiife/jiife.js`);
let s = js2IIFE.processFiles(['D:/jjq/game/trunk/gameclient/bin/js/game/common/MapRoleManager.js']);


fs.writeFileSync('D:/jjq/game/trunk/gameclient/bin/test1.js', s, 'utf8');



// D:\jjq\game\tools\qatools>node D:\jjq\game\tools\qatools\libs\xlsx2json -i D:\jjq\game\trunk\configs\excels\t_action.xlsx -o "D:\jjq\game\trunk\resource\o\config\export\cfg_t_action.json"


// node D:\jjq\game\tools\qatools\libs\xlsx2json -i D:\jjq\game\trunk\configs\excels\t_action.xlsx -o 
// 'D:\jjq\game\trunk\resource\o\config\export/cfg_t_action.json'
// s.replace(/\//g,"/");

// let a = "D:\jjq\game\trunk\resource\o\config\export/cfg_t_action.json"

