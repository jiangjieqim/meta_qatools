/**xlsx -> JSON -> bin  */

let fs = require("fs");
let path = require("path");
let execSync = require('child_process').execSync;
let {Byte} = require("./libs/byte.js");
let {uint64,fromValue} = require("./libs/uint64.js");

let {writeSyncBin,xls2JsonSync,xls2Json,resizeImage,jsonMini,uglifyFile,compressPNG,compressJPG,zipSync} = require('./libs/tools');
let {parse,parseAll,getValueByKey} = require("./libs/parseTb.js");
let cmd = require('./libs/commander');

let fieldList = [];//字段数组
let typeList = [];//类型数组
let openList = [];//开关状态数组

let mByte = new Byte();//字节流对象
mByte.endian = Byte.LITTLE_ENDIAN;

// let strByte = new Byte();//字符串池
// strByte.endian = Byte.LITTLE_ENDIAN;

let strlist = [];
let comment = [];

const STATUS_OPEN_OPEN = 1;
const STATUS_OPEN_CLOSE = 0;
//类型映射
const TYPE = {
    "string" : 1,//==>2字节
    "uint32" : 2, //==>4字节
    "uint":3,    //==>4字节
    "ulong":4,   //==>8字节
    "int":5,     //==>4字节
    "float":6,   // ==>4字节
    "byte":7,    // ==>1字节
    "long":8,    //==>8字节
    "ushort":9   //==>2字节
}

function getVarByString(str){
    if(str == "string"){
        return "string";
    }else if(str == "ulong" || str == "long"){
        return "any";
    }
    return "number";
}

function getCShapeString(str){
    switch(str)
    {
        case "string":return "string";
        case "uint32":return "UInt32";
        case "uint":return "uint";
        case "ulong":return "ulong";
        case "int":return "int";
        case "float":return "float";
        case "byte":return "byte";
        case "long":return "long";
        case "ushort":return "ushort";
    }
    throw Error("生成C#配置类报错");
}

function saveFiled(arr,obj){
    for(let o in obj){
        arr.push(obj[o]);
    }
}

function getStatus(i){
    let status = openList[i];
    return status;
}

function getFiledLen(){
    let len = 0;
    for(let i = 0;i < openList.length;i++){
        if(openList[i]==1){
            len++;
        }
    }
    return len;
}


//该列是否激活
function isOpen(i){
    let status = getStatus(i);
    if(status == STATUS_OPEN_OPEN){
        return true;
    }
    return false;
}

function strToNum(o){
    if(o  == ""){
        o = 0;
    }
    return o;
}

function save(type,o){
    // console.log(type,o);

    switch(type){
        case "string":
            let index = strlist.indexOf(o);
            if(index==-1){
                strlist.push(o);
            }
            index = strlist.indexOf(o);
            mByte.writeUint16(index);//存储字符串索引
            // strByte.writeUTFString(o);
            break;
        case "uint32":
            o = strToNum(o);
            mByte.writeUint32(o);
            break;
        case "uint":
            o = strToNum(o);
            mByte.writeInt32(o);
            break;
        case "ulong"://uint64
            o = strToNum(o);
            let u64 = fromValue(o,true);
            mByte.writeUint32(u64.high);
            mByte.writeUint32(u64.low);
            break;
        case "int":
            o = strToNum(o);
            mByte.writeInt32(o);
            break;
        case "float":
            o = strToNum(o);
            mByte.writeFloat32(o);
            break;
        case "byte":
            o = strToNum(o);
            mByte.writeByte(o);
            break;
        case "long"://int64
            o = strToNum(o);
            let _u64 = fromValue(o,false);
            mByte.writeUint32(_u64.high);
            mByte.writeUint32(_u64.low);
            break;
        case "ushort":
            o = strToNum(o);
            mByte.writeUint16(o);
            break;
    }

}

//存储数据
function parseOnLine(obj){
    // console.log(obj);
    let i = 0;
    for(let o in obj){
        // arr.push(obj[o]);
        // let status = getStatus(i);
        // console.log(i,obj[o]);
        if(isOpen(i)){
            //打开的
            let type = typeList[i];
            save(type,obj[o]);
        }else{
            // console.log(i);
            //关闭的字段,不存储
        }
        i++;
        // console.log('***********************************');
    }
    // console.log('####################');
}
/**
 * 重新生成新的json结构数据
 */
function rebuildJson(mByte){
    let mDataMap = {};
    let nobj =  parse(mByte);
    // let res = getValueByKey(obj,"f_name","伤心");
    // let res = getValueByKey(obj,"f_id",6);
    // console.log(JSON.stringify(res));

    let l1 = parseAll(nobj);
    for(let i = 0; i < l1.length;i++){
        let node = l1[i];
        mDataMap[node.f_id] = node;
    }
    let jsonMap = {};
    jsonMap['mDataMap']=mDataMap;
    let str1 = JSON.stringify(jsonMap);
    return str1;
}
function clear(){
    //clear
    fieldList = [];//字段数组
    typeList = [];//类型数组
    openList = [];//开关状态数组

    mByte.clear();
    mByte.pos = 0;

    // let strByte = new Byte();//字符串池
    // strByte.endian = Byte.LITTLE_ENDIAN;

    strlist = [];
    comment = [];
}
/**
 * 
 * @param {*} xlsxPath xlsx目录
 * @param {*} JsonDir json目录
 * @param {*} clsOut TS接口定义输出目录
 * @param {*} cshapeOut CShape接口接口定义输出目录
 */
function jtob(xlsxPath,JsonDir,clsOut,cshapeOut){

    clear();

    // let xlsxPath = 'D:/jjq/game/tools/qatools/t_action.xlsx';//xlsx文件
    // let JsonDir = 'D:/jjq/game/tools/qatools';//json输出路径
    // let clsOut = "D:/jjq/game/tools/qatools/";//接口输出文件路径

    // let binPath = `D:/jjq/game/tools/qatools`;
    let binPath = JsonDir;


    let tabelName = path.basename(xlsxPath).split('.')[0];//表名

    let jsonPath = `${JsonDir}/cfg_${tabelName}.json`;//json目录

    xls2JsonSync(xlsxPath,jsonPath);

    let s = fs.readFileSync(jsonPath,{encoding:"utf8"});//json字符串
    let out = `${binPath}/cfg_${tabelName}.bin`;//单个输出bin文件


    let obj = JSON.parse(s);
    // console.log(obj);
    // obj.length
    let headLen = 3;//头部长度

    /**
     * 0 字段名 f_anim
     * 1 type uint32
     * 2 1打表 0不打表
     * 3 数据段
     */
    mByte.writeUint32(0);//字符串池pos
    mByte.writeUint16(0);//数据pos
    mByte.writeUTFString(tabelName);//存储表名

    if (obj.length > 0) {
        for (let o in obj[0]) {
            comment.push(o);
        }
    }

    saveFiled(fieldList, obj[0]);
    saveFiled(typeList, obj[1]);
    saveFiled(openList, obj[2]);
    //#region 生成配置类
    //////////////////////////////////////////////////////////////////////////////////////
    //TS class
    let clsFile = `cfg_${tabelName}`;
    //Cshape class
    let _cshapeStr = `using System;\npublic partial class ${tabelName}{\n`;

    let _tsClsstr = 
    `namespace Configs{\n`
    _tsClsstr+=
`export class cfg_${tabelName}{
\tpublic mDataMap:{ [key:string] :${tabelName}_dat };
}\n`;
    _tsClsstr+=`export class ${tabelName}_dat{\n`;

    clsOut +=`/${clsFile}.ts`;

    // console.log(fieldList);
    // console.log(typeList);
    // console.log(openList);

    //存储字段名
    mByte.writeByte(getFiledLen());//字段名长度
    for(let i = 0;i < fieldList.length;i++){
        let str = fieldList[i];
        if(isOpen(i)){
            // let type = TYPE[]
            mByte.writeUTFString(str);
        }
    }

    //存储字段类型
    for(let i = 0;i < typeList.length;i++){
        let str = typeList[i];
        if(isOpen(i)){
            let type = TYPE[str];
            if(type == undefined){
                let err = xlsxPath+' 字段列索引:['+i+'],字段类型命名错误'+str;
                if(str == "uint16"){
                    err+="可使用ushort";
                }
                throw err;
            }
            mByte.writeByte(type);
        }
    }

    for(let i = 0;i < fieldList.length;i++){
        let str = fieldList[i];
        if(isOpen(i)){
            _tsClsstr+=`/*${comment[i]}*/\npublic ${str}:${getVarByString(typeList[i])};\n`;
            _cshapeStr+=`/*${comment[i]}*/\npublic ${getCShapeString(typeList[i])} ${str};\n`;
        }
    }
    _tsClsstr+=`}\n}`
    _cshapeStr+=`}`
    // console.log(_cshapeStr);
    //////////////////////////////////////////////////////////////////////////////////////
    //#endregion

    //  cfg_t_action
    let row = obj.length-headLen;
    mByte.writeUint32(row);//数据长度

    let pos = mByte.pos;
    mByte.pos = 4;
    mByte.writeUint16(pos);
    mByte.pos = pos;

    for(let i = headLen;i < obj.length;i++){
        // console.log(obj[i]);
        let o = obj[i];
        // console.log(o);
        // console.log(">>>",i,mByte.pos);
        parseOnLine(o);
    }


    pos = mByte.pos;
    mByte.pos = 0;
    mByte.writeUint32(pos);
    mByte.pos = pos;

    mByte.writeUint32(strlist.length);//字符串长度
    // console.log('strlen:',strlist.length);

    //存储字符串
    for(let i = 0;i < strlist.length;i++){
        mByte.writeUTFString(strlist[i]);
    }
    //##########################################################
    let str1 = rebuildJson(mByte);
    //##########################################################
    fs.writeFileSync(jsonPath,str1,"utf-8");

    writeSyncBin(out,mByte);

    let binStat = fs.statSync(out);
    console.log(out+  "," + binStat.size + " bytes"+` row ${row}`)

    fs.writeFileSync(clsOut,_tsClsstr,"utf-8");//存储类文件
    fs.writeFileSync(`${cshapeOut}/${tabelName}.cs`,_cshapeStr,"utf-8");//存储类文件
    // console.log(1);
}
module.exports = { jtob };

// jtob(`D:/jjq/game/trunk/configs/excels/t_npc.xlsx`,'D:/jjq/game/trunk/resource/o/config/export',"D:/jjq/game/trunk/gameclient/src/game/static/json/struct");
// jtob(
// `D:/jjq/game/trunk/configs/excels/t_item.xlsx`,
// 'D:/jjq/game/trunk/resource/o/config/export',
// "D:/jjq/game/trunk/gameclient/src/game/static/json/struct",
// "D:/jjq/game/trunk/gameserver/ServerLib/StaticData/cfg"
// );


// D:/jjq/game/design/配置表/excels

// 'D:/jjq/game/tools/qatools/t_action.xlsx'

/*

cmd.option("-excels <string>","this is excels path");
cmd.option("-jsondir <string>","this is jsondir project path");
cmd.option("-codedir <string>","this is codedir project path");

cmd.parse(process.argv);
let opt =  cmd.opts();
console.log(opt);
if(opt.Excels){
    jtob(opt.Excels,opt.Jsondir,opt.Codedir);
}
*/

//jtob("D:/jjq/game/trunk/configs/excels/t_house_tags.xlsx",'D:/jjq/game/trunk/resource/res/config/export',"D:/jjq/game/trunk/gameclient/src/game/static/json/struct");

