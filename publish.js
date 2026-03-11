//发布器
let cmd = require('./libs/commander');
let path = require("path");
let fs = require("fs");
let cwd = process.cwd();

let execSync = require('child_process').execSync;
let {tryExecSync,replaceComments,resizeImage,cmdCopy,glupCompressImage,mkdir,compressJPG,compressPNG,fileDisplay,zipSync,uglifyFile,getFileSuffix,getAllFileList,jsonMini} = require('./libs/tools');

// console.log(execSync("layaair2-cmd").toString());
function printOut(dir) {
    let f2 = getAllFileList(`${dir}\\js`);
    for (let i = 0; i < f2.length; i++) {
        let u = f2[i];
        let codeStat = fs.statSync(u);
        console.log(`${u}\t${codeStat.size} bytes`);
    }
}
/**
 * 删除目录下除了文件名为t之外的所有文件
 */
function delExceptAllBin(dir,t){
    let cfile = getAllFileList(dir);
    for(let i = 0;i < cfile.length;i++){
        let u = cfile[i];
        let name = path.basename(u);
        if(t.indexOf(name)==-1){
            fs.unlinkSync(u);
        }
    }
}

let quality;//图片压缩比
let bCompressImage = true;//是否压缩图片
let Imgsize;//图片尺寸缩放比
let justcode;//只发布代码

let isGetAllSuffix = true;
//json类型的文件
let jsonTypes = ["lmat","ltc","ls","json","atlas","lh","efc"];
let allbin = 'all.bin';
let root_out;// || "D:\\jjq\\game\\out";//输出路径
function compressFils(files,resource,out,errlist){
    for(let i = 0;i < files.length;i++){
        let url = files[i];
        let suffix = getFileSuffix(url);
        // console.log(url);

        let outPath = out + url.replace(resource,"");//输出文件地址
        let newOutPath = path.dirname(outPath);
        // mkdir(newOutPath);
        if(jsonTypes.indexOf(suffix)!=-1){
            if(url.indexOf('.ltcb.ls')!=-1){
                cmdCopy(url,outPath);
            }else{
                mkdir(newOutPath);

                console.log(url);
                
                let s = fs.readFileSync(url,{encoding:"utf8"})
                let newStr= jsonMini(s);
                fs.writeFileSync(outPath,newStr,{encoding:"utf8"});
                console.log((newStr.length/s.length*100).toFixed(2)+"% jsonmin",  path.basename(outPath));
            }
            
        }else if(suffix == 'jpg' || suffix == 'png'){
            if(bCompressImage){
                mkdir(newOutPath);
                if(suffix == 'png'){
                    compressPNG(url,outPath,quality,errlist);
                }else if(suffix == 'jpg'){
                    compressJPG(url,outPath,quality);
                }
                if(Imgsize){
                    if(outPath.indexOf(`${root_out}\\resource\\res\\atlas`)!=-1){
                        console.log("dont Imgsize beacuse it is atlas:",outPath);//图集不处理resize width and height
                    }else{
                        resizeImage(outPath,outPath,Imgsize);
                    }
                }
            }else{
                //
            }
        }
        else{
            let suffixArr = path.basename(url).split(".");
            if(suffixArr.length >= 2){
                if(suffixArr[suffixArr.length-1]=="db"){
                    continue;
                }
            }
            cmdCopy(url,outPath);
        }
    }
}


cmd.option("-w <string>","project workspace");
cmd.option("-r <string>","resource workspace");
cmd.option("-o <string>","output fold");
cmd.option("-q <string>","image quality");
cmd.option("-nc","will not be compress image");
cmd.option("-imgsize <string>","img size percentum");//图片的尺寸缩放比率0~1
cmd.option("-justcode","only code");//只发布代码
cmd.option("--dontCompressCode","dontCompressCode");
cmd.option("--dontbuildconfig","dontbuildconfig");//不要生成配置,压缩字体

cmd.parse(process.argv);
console.log(cmd.opts());

let opts = cmd.opts();

let workspace = opts.w;//工作区
let resource = opts.r;//资源路径
root_out = opts.o;
quality = opts.q;
// let resize = cmd.opts().resize;

if(opts.Imgsize){
    Imgsize = parseFloat(opts.Imgsize);
}



if(opts.Nc == true){
    bCompressImage = false;
}
if(opts.Justcode == true){
    justcode = true;
}


// workspace = workspace ||"D:\\jjq\\game\\gameclient";
// resource = resource || "D:\\jjq\\game\\resource";
let out = `${root_out}\\resource`;

quality = quality || 50;//图像质量比(0-100)

console.log("workspace",workspace);
console.log("resource",resource);
console.log("root",root_out);

if(!workspace || !resource || !root_out){
    return;
}
//前置准备
function preWork(trunk){
    //更新代码
    // tryExecSync(`cd ${trunk}/gameclient & svn up`);

    //更新资源
    // tryExecSync(`cd ${trunk}/resource & svn up & svn log -l 1`);

    //更新协议
    // tryExecSync(`cd ${trunk}/protos & svn up & svn log -l 1`);

    //更新配置表
    // tryExecSync(`cd ${trunk}/configs & svn up & svn log -l 1`);

    //更新UI
    // tryExecSync(`cd ${trunk}/gameclient_ui & svn up & svn log -l 1`);

    //构建相关
    tryExecSync(`cd ${trunk}/gameclient/cmd & exportUI_Atlas.bat`);
    // tryExecSync(`cd ${trunk}/gameclient/cmd & buildxlsx.bat`);
    tryExecSync(`cd ${trunk}/gameclient/cmd & buildproto.bat`)
}
function getExternal(project){
    let s = replaceComments(fs.readFileSync(`${project}/module.json`,{encoding:"utf8"}));
    let module1 =  JSON.parse(s);
    let subList = [];
    for(let i in module1){
        subList.push(i);
    }
    return subList;
}
//分包
let subList= getExternal(workspace);
console.log("分包:",subList);

let time = Date.now();
let trunk = path.dirname(workspace);//trunk
let excel = `${trunk}\\configs\\excels`;
let jsondir = `${resource}\\o\\config\\export`

mkdir(jsondir);

preWork(trunk);

let codedir = `${workspace}\\src\\game\\static\\json\\struct`;
// "D:/jjq/game/trunk/gameserver/ServerLib/StaticData/cfg"


// -cshapedir "%trunk%\gameserver\ServerLib\StaticData\struct"
let cshapedir = `${trunk}\\gameserver\\ServerLib\\StaticData\\struct`;


//编译代码########################################################################

function startCompile(){
    console.log("################################################## 编译代码");
    let sign = '-c';
    if(opts.dontCompressCode){
        sign = '';
    }

    let c1 = `node compile.js -w ${workspace} ${sign} --tsc`;
    try{
        let status = execSync(c1);
        console.log(status.toString());
    }catch(e){
        // console.log(e);
        for(let i = 0;i < e.output.length;i++){
            let msg = e.output[i];
            if(msg){
                console.log(msg.toString());  
            }
        }
        throw Error('Stop startCompile');
    }
    // D:\jjq\game\gameclient\bin\js\bundle.zip
}

startCompile();
if (opts.dontbuildconfig) {

} else {
    //生成配置########################################################################
    console.log("################################################## 生成配置");

    console.log(execSync(`node json2bAll.js -excels ${excel} -jsondir ${jsondir} -codedir ${codedir} -cshapedir ${cshapedir}`).toString());
    cmdCopy(`${trunk}\\resource\\o\\config\\export\\${allbin}`, `${trunk}\\release\\resource\\o\\config\\export\\${allbin}`)

    //压缩字体########################################################################
    execSync(`node fontcompress.js -i "${trunk}"`).toString();
}
let suffixArr = [];//所有的文件类型
function getFileType(url){
    let name = path.basename(url);
    let arr = name.split(".");
    let s = arr[arr.length - 1];
    if (suffixArr.indexOf(s) == -1) {
        suffixArr.push(s);
    }
}
let allfile = getAllFileList(resource);

if (isGetAllSuffix) {
    for (let i = 0; i < allfile.length; i++) {
        getFileType(allfile[i]);
    }
    let s1 = '';
    for(let i = 0;i < suffixArr.length;i++){
        s1+=suffixArr[i];
        if(i< suffixArr.length -1){
            s1+=','
        }
    }
    console.log('['+s1+']');
}


function compImage(call){
    let errlist = [];
    //压缩文件
    compressFils(allfile,resource,out,errlist);

    console.log(`used ${(Date.now() - time)} ms`);

    console.log("glupCompressImage",errlist);

    function comp(callBack){
        if(errlist.length > 0){
            let obj = errlist.pop();
            let o = path.dirname(obj.o);
            let i = obj.i;
            console.log("############",i,o);
            glupCompressImage(i, o+'\\', () => {
                // console.log("finish");
                comp(callBack);
            });
        }else{
            callBack();
        }
    }

    comp(()=>{
        
        call();
    });
}


// glupZip('D:\\jjq\\game\\1\\parts.png','D:\\jjq\\game\\1\\parts2.png');
// glupCompressImage('D:\\jjq\\game\\1\\business.png','D:\\jjq\\game\\1\\out\\',()=>{
//     console.log("finish");
// });



// `ventional/Assets/Crystal Mine/Crystals/Materials/cube/Crystal_cube_NegativeX.png`


// `D:/jjq/game/out/Crystal_cube_NegativeX.png`
// compressPNG(`D:/jjq/game/out/Crystal_cube_NegativeX.png`,`D:/jjq/game/out/Crystal_cube_NegativeXXXXX.png`,quality);




//  glupCompressImage('D:\\jjq\\game\\resource\\**\\*.{png,jpg}','D:\\jjq\\game\\out\\resource\\',()=>{
//         console.log("finish");
//         console.log(`used ${(Date.now() - time)} ms`);
//     });


if (!justcode) {
    compImage(() => {
        console.log("end!");
        console.log(`used ${(Date.now() - time)} ms`);
    });
}

// D:\jjq\game\tools\qatools\releaseTemplate
let temp=`${cwd}\\releaseTemplate`;
let releaseTemplateList = getAllFileList(temp);

// console.log(releaseTemplateList);

// let upsvn = `cd ${workspace} & svn up`;
// console.log(execSync(upsvn).toString());



for(let i = 0;i < subList.length;i++){
    let _name = subList[i];
    let code = `${workspace}\\bin\\js\\${_name}.bin`;
    let outcode = `${root_out}\\js\\${_name}.bin`;
    cmdCopy(code,outcode);
}

let code = `${workspace}\\bin\\js\\bundle.bin`;
let outcode = `${root_out}\\js\\bundle.bin`;
cmdCopy(code,outcode);

//删除config除了all.bin的文件 #####################################################
delExceptAllBin(`${root_out}\\resource\\o\\config`,[allbin]);

//copy releaseTemplate ###########################################################
for (let i = 0; i < releaseTemplateList.length; i++) {
    let url = releaseTemplateList[i];
    let r = url.replace(temp, "");
    let fileName = path.basename(url);

    if (fileName == `initconfig.js`) {
        // console.log(1);
        //不处理
    } else {
        let out1 = `${root_out}${r}`;
        //console.log(url);
        cmdCopy(url, out1)
    }
}
// let codeStat = fs.statSync(outcode);
// console.log(outcode,codeStat.size+" bytes");
printOut(root_out);
if(!justcode){
    let cmd1 = execSync(`node resver.js --base "${trunk}\\release_base\\resource" --cur "${trunk}\\release\\resource"`).toString();

    // "--base","D:\\jjq\\game\\trunk\\release_base\\resource",
    // "--cur","D:\\jjq\\game\\trunk\\release\\resource",

    console.log(cmd1);
}
console.log("finish!");
console.log(`# used ${(Date.now() - time)} ms`);