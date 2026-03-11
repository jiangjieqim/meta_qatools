/** 解析bin */
let fs = require("fs");
let path = require("path");
let execSync = require('child_process').execSync;
let {Byte} = require("./libs/byte.js");
let {uint64,fromValue} = require("./libs/uint64.js");
let {toArrayBuffer,writeBin,xls2JsonSync,xls2Json,resizeImage,jsonMini,uglifyFile,compressPNG,compressJPG,zipSync} = require('./libs/tools');

let {parse,parseAll,getValueByKey} = require("./libs/parseTb.js");

let out =`D:/jjq/game/trunk/resource/res/config/export/cfg_t_house_res.bin`;
// "D:/jjq/game/tools/qatools/cfg_t_action.bin";



// let rs=fs.createReadStream(out);
// let b = rs.read();
// console.log(b);

let s = fs.readFileSync(out,"binary");//"utf-8" "binary"

console.log(s.length);

let bs = new Byte();
// bs.writeUTFBytes(s);
// bs.writeUTFBytes(s);

bs.writeArrayBuffer(toArrayBuffer(s));
// console.log(bs.length);


bs.pos = 0;
//############################################################

let obj =  parse(bs);
// let res = getValueByKey(obj,"f_name","伤心");
// let res = getValueByKey(obj,"f_id",6);

let u ;//= new uint64(0xffffffff,0xffffffff);
// 18446744073

// u = fromValue(18446744073);
// u = fromValue('18446744073709551615',true);
// let res = getValueByKey(obj,"f_flag",u);
// console.log(JSON.stringify(res));

// let l1 = parseAll(obj);
// console.log(l1);