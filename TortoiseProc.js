let fs = require("fs");
let execSync = require('child_process').execSync;
let path = require("path");
let {tryExecSync,mkdir,copy,getFile,fileDisplay,cmdCopy,replaceAll} = require('./libs/tools');

let cmd = require('./libs/commander');
cmd.option("-w <string>","this is svn commit path");
cmd.parse(process.argv);
let w = cmd.opts().w;


tryExecSync(`svn up`);

let s = `TortoiseProc.exe /command:commit /path:${w} /closeonend:0`;

tryExecSync(s);