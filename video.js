let cmd = require('./libs/commander');
let path = require("path");
let fs = require("fs");
let cwd = process.cwd();
let {mkdir} = require('./libs/tools');

let execSync = require('child_process').execSync;

cmd.option("-p <string>","video path");
cmd.option("-o <string>","out path");

cmd.parse(process.argv);

let opts = cmd.opts();

let dir = opts.p;
let out = opts.o;




// let pngFold = `${dir}\\pngfold`;
console.log(1);
// mkdir(pngFold);