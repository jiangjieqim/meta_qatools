// node ui_export.js -ui "D:/jjq/game/ui" -out "D:/jjq/game/resource"

let time = Date.now();

const TEST = false;

//ui工程发布
let fs = require("fs");
let execSync = require('child_process').execSync;
let path = require("path");
let {mkdir,copy,getFile,fileDisplay,cmdCopy,replaceAll} = require('./libs/tools');

let cmd = require('./libs/commander');
cmd.option("-ui <string>","this is ui project path");
cmd.option("-out <string>","this is resource path");
cmd.option("-atlas","generate Atlas");
cmd.option("-client <string>","this is client path");

cmd.parse(process.argv);

let uiproject = cmd.opts().Ui;
let resource = cmd.opts().Out;
resource = `${resource}`;//\\ui
mkdir(resource);
let atlas = cmd.opts().Atlas;//
let client = cmd.opts().Client;//


// console.log(uipath);

// "program": "ui_export.js",
//             "args": [
//                 "-ui","D:/jjq/game/ui",
//                 "-out","D:/jjq/game/resource"
//             ]
if(!fs.existsSync(uiproject)){
    throw Error(uiproject+' not exist!');
}

let fileState = fs.existsSync(resource);
if(!fileState){
    throw Error(resource+' not exist!');
}

// node layaair2-cmd.js customui -c -a -d -m normal -w "D:/LayaTest/a1"
// let up = `cd ${resource} & svn up`;
// let s = execSync(up);
// console.log(up, s.toString());

if (TEST == false) {

    // let exUiCmd = `layaair2-cmd customui -c -a -d -m normal -w "${uiproject}"`;
    let exportAtlas = "";
    if(atlas){
        exportAtlas = "-a";
    }
    let exUiCmd = `layaair2-cmd customui -c -d -m normal -w "${uiproject}" ${exportAtlas}`;

    console.log(exUiCmd);

    s = execSync(exUiCmd);
    console.log(exUiCmd, s.toString());
}

console.log(`used ${(Date.now() - time)} ms`);


let filelist = fs.readFileSync(`${uiproject}/filelist.json`,{encoding:"utf8"})
let json = JSON.parse(filelist);
let _checkFileList = json.exportfiles;

function checkCanExport(url){
    for(let i = 0;i < _checkFileList.length;i++){
        let f = `${uiproject}\\bin\\${_checkFileList[i]}`;
        // console.log(f);
        if(url.indexOf(f)!=-1){
            return true;
        }
    }
}

let allfile = [];
fileDisplay(`${uiproject}/bin`,(url)=>{
    if(checkCanExport(url)){
        allfile.push(url);
    }
    // console.log(l1.length);
});

// console.log(allfile);
for (let i = 0; i < allfile.length; i++) {
    let f1 = allfile[i];
    let newFile = f1.replace(`${uiproject}\\bin`, '');
    newFile = `${resource}${newFile}`;
    cmdCopy(f1, newFile);
}

// https://10.0.0.4/svn/meta/gameclient/src/ui/layaMaxUI.ts
// https://10.0.0.4/svn/meta/ui/src/ui/layaMaxUI.ts


// this.loadScene("views/common/ui_loading");
// InitConfig.loadScene(this,"views/common/ui_loading");

let maxUI = fs.readFileSync(`${uiproject}/src/ui/layaMaxUI.ts`,{encoding:"utf8"});
/*
maxUI = replaceAll(maxUI,"this.loadScene(","InitConfig.loadScene(this,");
maxUI = `import { InitConfig } from "../InitConfig";\n${maxUI}`;
*/

// copy(`${uiproject}/src/ui/layaMaxUI.ts`,`${client}/src/ui/layaMaxUI.ts`);
fs.writeFileSync(`${client}/src/ui/layaMaxUI.ts`,maxUI,{encoding:"utf8"});
console.log(`out: ${client}/src/ui/layaMaxUI.ts`);