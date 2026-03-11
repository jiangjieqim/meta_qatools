//一鍵發佈器
let cmd = require('./libs/commander');
let path = require("path");
let fs = require("fs");

let {execSync} = require('child_process');
let {tryExecSync,mkdir,copy,getFile,fileDisplay,cmdCopy,replaceAll} = require('./libs/tools');

let cwd = process.cwd();

cmd.option("-w <string>","project workspace");

cmd.parse(process.argv);

let opts = cmd.opts();

let trunk = opts.w;//工作区
console.log('trunk:',trunk);
//更新代码
tryExecSync(`cd ${trunk}/gameclient & svn up`);

//更新资源
tryExecSync(`cd ${trunk}/resource & svn up`);

//更新协议
tryExecSync(`cd ${trunk}/protos & svn up`);

//更新配置表
tryExecSync(`cd ${trunk}/configs & svn up`);

//更新图集
tryExecSync(`cd ${trunk}/gameclient_ui & svn up`);

//发布
tryExecSync(`cd ${trunk}/gameclient/cmd & exportUI_Atlas.bat`);
tryExecSync(`cd ${trunk}/gameclient/cmd & buildxlsx.bat`);
tryExecSync(`cd ${trunk}/gameclient/cmd & buildproto.bat`);
// tryExecSync(`cd ${trunk}/gameclient/cmd & publish.bat`);
