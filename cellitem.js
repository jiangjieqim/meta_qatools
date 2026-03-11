let cwd = process.cwd();
let fs = require("fs");

let {zipSync,uglifyFile,uglifyAndZip} = require('./libs/tools');

let rollup = require(`${cwd}/npm/node_modules/layaair2-cmd/node_modules/rollup`);

let cmd = require('./libs/commander');
cmd.option("-i <string>","input path");
cmd.option("-p <string>","project path");
cmd.option("-n <string>","module name");
cmd.option("-c","compress");


cmd.parse(process.argv);
let input = cmd.opts().i;
let project = cmd.opts().p;
let _name = cmd.opts().n;

input = input.replace(/\\/g,'/');

project = project.replace(/\\/g,'/');

let fileArr = input.split(';');
let fileCnt = fileArr.length;
let allstr = "";
function createCell(cellFile){
    let out = cellFile.replace('/js/','/rollup/'); 
    let jonlyImport = cellFile;//只导出当前类

    let _roll= rollup.rollup({
        input:cellFile,//子文件
        onwarn:(waring,warn)=>{
			//这里注释掉，是为了打包时先忽略循环依赖提示
		},
    }).then(bundle => {
      let modules = bundle.cache.modules;
      let ifile = out;
      let wri = bundle.write({ file: ifile, format: "iife", sourcemap: true,
        //自定义排除项
        jcustExternal :[],
        jonlyImport:  jonlyImport,
    });//name: "bundle" 
      wri.then(b => {
        //console.log(`modules file ${modules.length-jcustExternal.length} sub:${jcustExternal.length} ifile:${ifile}`);

        let s =fs.readFileSync(ifile,"utf8");
        let sign = '}({}));';
        let si = s.indexOf(sign);
        if(si == -1){
            let err = _name + '\n' + s;
            sign= `}());`
            si = s.indexOf(sign);
            if(si == -1){        
                throw err;
            }
        }
        s = s.replace(sign,"}(window));");//导出到window域
        fs.writeFileSync(ifile,s,'utf-8');
        // callBack(s);
        // console.log(s);
        allstr+=s;
        checkFile();
      });
    });
}

function checkFile(){
    if(fileArr.length > 0){    
        // let p = project.replace(/\\/g,'/');
        let file = fileArr.shift();
        createCell(`${project}/bin/js/${file}`);
    }else{
        let url = `${project}/bin/js/${_name}.bin`;
        fs.writeFileSync(url,allstr,'utf-8');
        if(cmd.opts().c){
          uglifyFile(url,url);
        }
        zipSync(url,url);
        let stats = fs.statSync(url);
        console.log("build:",url,stats.size+" bytes",fileCnt);
    }
}

checkFile();
