let {xls2Json} = require('./tools');

let cmd = require('./commander');
cmd.option("-o <string>","output");
cmd.option("-i <string>","input");
cmd.parse(process.argv);
let opts = cmd.opts();
// console.log(opts)
// node xlsx2json.js -i "D:\jjq\game\design\配置表\excels\t_action.xlsx" -o "D:\jjq\game\tools\qatools\t_action.json"
let time = Date.now();

xls2Json(opts.i,opts.o,()=>{
    console.log(`xls2Json ${opts.o} used ${(Date.now()-time)} ms`);
});