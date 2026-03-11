//拆包工具
let path = require("path");
let cwd = process.cwd();
let rollup = require(`${cwd}/npm/node_modules/layaair2-cmd/node_modules/rollup`);
let {execSync,exec} = require("child_process");
let {visualizer} = require(`${cwd}/npm/node_modules/rollup-plugin-visualizer`);

let fs = require("fs");

let {replaceComments,uglifyFile ,zipSync,mkdir,getAllFileList} = require('./libs/tools');
// const { compression } = require("./libs/jszip");
function filter(url){
    let arr = path.basename(url).split(".");
    let suffix = arr[arr.length - 1];
    return suffix == 'js';
}

function replaceSpash(project,arr){
    let narr = [];
    let p = project.replace(/\\/g,'/');
    for(let i = 0;i < arr.length;i++){
        let id = arr[i];
        id = id.replace(/\\/g,'/');
        id = id.replace(`${p}/bin/js/`,'');
        narr.push(id);
    }
    return narr;
}

function getExternal(project){
    let obj = {flist:[],data:{},subList:[]};
    let module1 =  JSON.parse(replaceComments(fs.readFileSync(`${project}/module.json`,{encoding:"utf8"})));
    let flist = [];
    for(let i in module1){
        let cell = module1[i];
        // console.log(cell);
        let l2 = [];
        for(let n = 0;n < cell.length;n++){
            let node = cell[n];
            // console.log(node);
            let l4 = getAllFileList(`${project}/bin/js/${node}`,filter);

            let l3 = replaceSpash(project,l4);
            l2 = l2.concat(l3);
            flist = flist.concat(l3);
        }
        // if(!obj.data[i]){
            // obj.data[i]=[];
        // }
        // obj.data[i].push(l2);
        obj.data[i] = l2;
        obj.subList.push(i);
    }
    // console.log(flist);
    obj.flist = flist;
    return obj;
}

/**
 * 开始tsc编译
 */
function startCompile(project,callBack){
    let tsccmd = `cd "${project}" & tsc --outDir bin/js --removeComments true`;//--sourceMap true  --target es3
    // console.log(tsccmd+'\n'+execSync(tsccmd).toString());//tsc 编译

    exec(tsccmd,(err,stdout,stderr)=>{
        if(err){
            console.log("编译错误:["+stdout+"]");
            console.log("["+stderr+"]");
            process.exit(1);
            return;
        }
        callBack();
    });
}

/**
 * 主包
 * let project = "D:/jjq/game/trunk/gameclient";
 * 排除项列表
 * @param {*} jcustExternal 
 */
function exportCode(project,compression,jcustExternal,endCallBack){
    let jonlyImport = "";//只导出当前的类路径
    let tree = [];

    jcustExternal = jcustExternal || [];
    project = project.replace(/\\/g,'/');
    
    //let outfile=`${project}/bin/js/bundle.js`;
    let _roll= rollup.rollup({
        input:`${project}/bin/js/Main.js`,//主包入口
        onwarn:(waring,warn)=>{
			//这里注释掉，是为了打包时先忽略循环依赖提示
		},
        
        plugins:[
          visualizer({
            emitFile: true,
            file: 'stats.html'
          }),
        ],
        
        
    }).then(bundle => {
      let modules = bundle.cache.modules;
      for(let i = 0;i < modules.length;i++){
            let id = modules[i].id;
            id = id.replace(/\\/g,'/');
            id = id.replace(`${project}/bin/js/`,'');
            tree.push(id);
      }
      let treestr = JSON.stringify(tree);
      fs.writeFileSync(`${project}/bin/tree.json`,treestr,"utf-8");
      let fileName = 'bundle';
      let ifile = `${project}/bin/js/${fileName}.js`;
      let zipfile =  `${project}/bin/js/${fileName}.bin`;
      let wri = bundle.write({ file: ifile, format: "iife", sourcemap: true,
        //自定义排除项
        jcustExternal :jcustExternal,
        jonlyImport:  jonlyImport,
    });//name: "bundle" 
      wri.then(b => {
        console.log(`modules file ${modules.length-jcustExternal.length} sub:${jcustExternal.length} ifile:${ifile}`);
        if(compression){
            uglifyFile(ifile,ifile);
        }
        zipSync(ifile,zipfile);
        if(endCallBack){
            endCallBack(tree);
        }
    //   if(!isExportMain){
    //     let s =fs.readFileSync(ifile,"utf8");
    //     s = s.replace("}({}));","}(window));");//导出到window域
    //     fs.writeFileSync(ifile,s,'utf-8');
    //   }

      });
    });
}
// let subList= getExternal(workspace);


function getNewList(tree,arr){
    let oldlen = arr.length;
    let newArr = [];
    for(let i = 0;i < arr.length;i++){
        let n = arr[i];
        if(tree.indexOf(n) == -1){
            console.log('['+n+']not used');
        }else{
            newArr.push(n);
        }
    }
    if(oldlen != newArr.length){
        console.log("# del",oldlen-newArr.length);
    }

    newArr = newArr.sort((a,b)=>{
        let a1 = tree.indexOf(a);
        let b1 = tree.indexOf(b);
        if(a1 > b1){
            return 1;
        }
        else if(a1 < b1){
            return -1;
        }
        return 0;
    })
    return newArr;
}

function cellExport(project,compression){
    // let project = "D:/jjq/game/trunk/gameclient";

    startCompile(project,()=>{
        let obj = getExternal(project);
        // let str = obj.subList
        let trunk = path.dirname(project);
        fs.writeFileSync(`${trunk}/resource/o/config/module.json`,JSON.stringify(obj.subList),"utf8");
        //########################## 导出子模块
    
        function exportSub(tree){
            mkdir(`${project}/bin/rollup`);//构建rollup缓存目录
    
            // function sortHandler(){
    
            // }
    
    
    
    
    
    
            for(let i in obj.data){
                let k = obj.data[i];
                k = getNewList(tree,k);
    
                let cellName = i;
                let p = '';
                for(let n = 0;n < k.length;n++){
                    p+=k[n];
                    if(n < k.length -1){
                        p+=';';
                    }
                }
                let c = "";
                if(compression){
                    c = "-c";
                }
                let cmd1 = `node cellitem.js -p ${project} -n ${cellName} ${c} -i ${p}`;
                console.log(cmd1+'\n'+execSync(cmd1).toString());
                // console.log(k);
            }
    
            console.log('end');
        }
    
        //########################## 导出主模块
        let nlist = [];
        for(let  i = 0;i <obj.flist.length;i++){
            let s1 = obj.flist[i];
            let s2 = `${project}/bin/js/${s1}`;
            s2 = s2.replace(/\//g,'\\');
            nlist.push(s2)
        }
        exportCode(project,compression, nlist,exportSub);//exportSub


    });
   
}

module.exports = {
    cellExport
}
//#############################################################