
let fs = require("fs");
let path = require("path");
let {copy,getFile} = require('./libs/tools');
let {exportProtoTs,buildCls} = require('./libs/proto.js');
let { exportProtoCShape } = require('./libs/protoCShape.js');
let cmd = require('./libs/commander');
cmd.option("-server <string>","this is server path");
cmd.option("-client <string>","this is client path");
cmd.option("-out <string>","this is output path");

cmd.parse(process.argv);



let csPath = cmd.opts().Server;//`D:/jjq/game/gameclient/src/game/network`;//ts输出目录

let tsPath= cmd.opts().Client;//`D:/jjq/game/gameserver/Protocols/ProtoBody`;//C#输出目录

let fold  = cmd.opts().Out;//"D:/jjq/game/mainproto";//协议配置文件夹
let cwd = process.cwd();//= process.execPath;

function getProjectRoot(cwd){
    let arr = cwd.split("\\");
    let s = "";
    for(let i = 0;i < arr.length-2;i++){
        s+=arr[i];
        if(i < arr.length - 3){
            s+="\\";
        }
    }
    return s;
}

let rootPath =  getProjectRoot(cwd);    //获取项目根目录 D:/jjq/game


// if(!fs.existsSync(`${cwd}\\proto\\testPath`)){
//     fs.mkdirSync(`${cwd}\\proto\\testPath`);
// }

let tsoutList = [];

function addNode(url,o){
    for(let i = 0;i < tsoutList.length;i++){
        let item = tsoutList[i];
        if(item.url == url){
            return;
        }
    }
    let obj = {url:url,o:o};
    tsoutList.push(obj);
}

// let clsList = [];

function cshapeOut(url,str){
    let outUrl = url.replace(".xml",".cs");
    let curstr = fs.readFileSync(url,{encoding:"utf8"});
    let s2 = exportProtoCShape(curstr);// "proto.xml"
    // console.log(s2);
    fs.writeFileSync(outUrl, s2.data, { encoding: "utf8" });

    let basename = path.basename(outUrl);
    // console.log(basename);
    copy(outUrl,csPath + "//" + basename);
}
function tsOut(url,str){
      //TS
    let s2 = exportProtoTs(str);// "proto.xml"
    
    let im = "";//头部引用

    for(let o in s2.from){
        let arr = s2.from[o];
        // console.log(arr.length);
        let str = `import {`
        for(let n = 0; n < arr.length;n++){
            str+=arr[n];
            if(n < arr.length -1){
                str+=",";
            }
        }
        str+=`} from "./${o}";\n`;
        im+=str;
    }

    let head =  `import { uint64 } from "./../uint64";\n`;
    //head +=`import { ProtoTools } from "./../prototools";`
    head +=`\n${im}`;
    let outfileStr = head + s2.data;

    let outUrl = url.replace(".xml",".ts");
    fs.writeFileSync(outUrl, outfileStr, { encoding: "utf8" });

    let basename = path.basename(outUrl);

    copy(outUrl,tsPath + "//" + basename);

    return s2;
}

function decode(url,str){
    console.log("解析\t"+url);
    //TS
    let s2 = tsOut(url,str);
    //C#
    // let coutUrl = url.replace(".xml",".cs");
    cshapeOut(url,str);
    addNode(url,s2.p);
}
getFile(fold,decode);


let alllist = [];

function buildTsHead(o){
    let arr = o.o;
    let head = "";
    // o,arr
    // let arr = tsoutList[o];
    let name = path.basename(o.url);
    let mName = name.split(".")[0];
    let s = "";
    for(let i = 0;i < arr.length;i++){
        head +=arr[i].name;
        if(i < arr.length - 1){
            head+=',';
        }
    }
    let s0 = `import { ${head}} from "./${(mName)}"`;
    return s0;
}

function buildCsFunc(obj){
    let s = "";
    let arr = obj.o;
    for(let i  = 0;i < arr.length;i++){
        let item = arr[i];
        let name = item.name;
        let id = item.id;
        s+= `case ${id}:return new ${name}();\n`
    }
    return s;
}

let importStr = "";
let csFuncStr =  `
public static class GetProtoUtility{
public static BaseProto getByid(int id){
switch (id){\n`;

for(let i = 0;i < tsoutList.length;i++){
    let obj = tsoutList[i];
    // console.log(obj);
    // console.log(tsoutList[o]);
    // let l2 = tsoutList[o];
    // alllist.push(l2)
    alllist = alllist.concat(obj.o);
    importStr += buildTsHead(obj) + "\n";
    csFuncStr+=buildCsFunc(obj);
}
csFuncStr+= `}return null;}}`;

let csFuncPath =fold+"//GetProto.cs";

fs.writeFileSync(csFuncPath,csFuncStr,{encoding:"utf8"});

//导出TS协议定义
let tsDefStr = buildCls(alllist);
let defUrl = fold+"//ProtoDef.ts";
fs.writeFileSync(defUrl,importStr + tsDefStr,{encoding:"utf8"});

copy(defUrl ,tsPath+"//"+path.basename(defUrl));
copy(csFuncPath ,csPath+"//"+path.basename(csFuncPath));

//清理文件
getFile(fold,(url)=>{
    // console.log("del",url);
    fs.unlinkSync(url);
},[".cs",".ts"]);