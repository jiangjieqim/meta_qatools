let time = Date.now();
let cwd = process.cwd();
let fs = require("fs");
let cmd = require('./libs/commander');
let path = require("path");

let {execSync,fork} = require('child_process');
let {zipSync,uglifyFile} = require('./libs/tools');
let {cellExport} = require('./cellexport');

let rollup = require(`${cwd}/npm/node_modules/layaair2-cmd/node_modules/rollup`);

// let {visualizer} = require(`${cwd}/npm/node_modules/rollup-plugin-visualizer`);


cmd.option("-w <string>","project workspace");
cmd.option("-c","compress");
cmd.option("--disableFont","disable font");
cmd.option("--tsc","use tsc");

cmd.parse(process.argv);

let useTsc = cmd.opts().tsc;

let w = cmd.opts().w;

console.log(cmd.opts());

let cmdstr = "";

let compress = cmd.opts().c;//是否紧凑压缩代码

function uglifyAndZip(){
    if(compress){
        uglifyFile(`${w}\\bin\\js\\bundle.js`,`${w}\\bin\\js\\bundle.js`);
    }
    zipSync(`${w}\\bin\\js\\bundle.js`,`${w}\\bin\\js\\bundle.bin`);
}


let opt = cmd.opts()
let trunk = path.dirname(w);
if (opt.disableFont){

}else{

    //压缩字体
    try{
        console.log(execSync(`node fontcompress.js -i "${trunk}"`).toString());
    }catch(e){
        console.log(e.stack);
    }
}

if (useTsc) {
    cellExport(w,compress);
    /*
    let tscbin = `bin/js`;
    cmdstr = `cd "${w}" & tsc --outDir ${tscbin} --removeComments true --sourceMap true`;//--pretty false

    console.log(`${cmdstr}\n[${execSync(cmdstr).toString()}]`);//tsc 编译
    let ifile = `${w}/bin/js/bundle.js`;
    let mName = path.basename(ifile).split('.')[0]+"2";

    let _roll = rollup.rollup({
        input: `${w}/${tscbin}/Main.js`, 
        onwarn:(waring,warn)=>{
			//这里注释掉，是为了打包时先忽略循环依赖提示
			// if(waring.code == "CIRCULAR_DEPENDENCY"){
			// 	console.log("warnning Circular dependency:");
				// console.log(waring);
			// }
		},
        plugins:[
            visualizer({emitFile:true,file:"stats.html"}),
        ]

    }).then(bundle => {
        // console.log(bundle);
        let modules = bundle.cache.modules;
        // fs.writeFileSync(`D:/github/Laya3dT1/myLaya22/bin/js/bundle.js`,str,'utf-8');
        // bundle.cache.modules = m1;

        let wri= bundle.write({ file: ifile, format: "iife", sourcemap: true});//name:"laya"
        wri.then(b=>{
            console.log(`${modules.length} modules file used ${(Date.now() - time)} ms`);
            // let s = fs.readFileSync(ifile,{encoding:"utf8"});
            // s = `var ${mName} = ${s}`;
            // s+= `window["${mName}"]=${mName};`;
            // fs.writeFileSync(ifile,s,{encoding:"utf8"});
            uglifyAndZip();
        });
    })
    */

}else{
     // let cmdstr =`layaair2-cmd compile -w ${w}`;
    cmdstr = `layaair2-cmd compile_qc -w ${w}`;
    let s = execSync(cmdstr).toString();
    console.log(s);
    uglifyAndZip();
    console.log(`used ${(Date.now() - time)} ms`);
}
