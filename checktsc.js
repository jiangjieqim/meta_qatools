// tsc --outDir "D:/jjq/game/trunk/gameclient/bin/js" --project "D:/jjq/game/trunk/gameclient"
let fs = require("fs");
let {execSync,exec} = require('child_process');
let path = require("path");
let cmd = require('./libs/commander');
cmd.option("-w <string>","this is project path");
cmd.parse(process.argv);
let cwd = process.cwd();
let w = cmd.opts().w;

// console.log(`>>>>${w}`,`****${cwd}`);
// let cmd1 = `tsc --outDir "${w}/bin/js" --project "${w}"`
// let out = execSync(cmd1);
// console.log(out);
/*
exec(cmd1,(error,stdout,stderr)=>{
    if(error){
        //error
        console.log(error);
        console.log(stdout);
        console.log(stderr);
        return;
    }
});
*/
try {
    console.log("################## clear cache!!!")
    console.log(
        execSync(`cd ${w}/cmd & clear.bat`).toString()
    );
} catch (e) {
    // console.log(e.stdout.toString());
    for(let i = 0;i < e.output.length;i++){
        if(e.output[i]){
            console.log(">>>>",e.output[i].toString());
        }
    }
}
// let cmd2 = `cd  ${w} & layaair2-cmd compile -w ${w}`;
let cmd2 = `cd ${cwd} & node compile.js -w ${w}`;
console.log(execSync(cmd2).toString());
