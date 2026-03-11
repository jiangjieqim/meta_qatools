var fs = require('fs');

let convert = require("./npm/node_modules/xml-js/index.js")
// D:/jjq/game/design/qatools

let {exportProtoTs,buildCls} = require('./libs/proto.js');

// console.log(convert);



let fileURL = "game.xml";
let o1 = "game.ts";
let o2 = "game.cs"
let str = fs.readFileSync(fileURL,{encoding:"utf8"})
let s2 = exportProtoTs(str);// "proto.xml"
let head =  `import { uint64 } from "./uint64";\n`;
head +=`import { ProtoTools } from "./prototools";`
// head+=`
// function f_readUTFString(b:Laya.Byte){
//     //let len = b.readUint16();
//     //return b.readUTFBytes(len);
//     return b.readUTFString();
// }
// `
fs.writeFileSync(o1,head+s2.data+"\n"+buildCls(s2.p),{encoding:"utf8"});


function cschape() {
    let { exportProtoCShape, buildCShape } = require('./libs/protoCShape.js');
    let curstr = fs.readFileSync(fileURL,{encoding:"utf8"});
    let s2 = exportProtoCShape(curstr);// "proto.xml"
    // console.log(exportProtoCShape);


 
// public static class GetProtoUtility{
//     public static BaseProto getByid(int id){
//         switch (id){
//             case 3003:WebClientRegist_req ws = new WebClientRegist_req();return ws;
//         }
//         return null;
//     }
// }   

let getFuncs = `
public static class GetProtoUtility{
    public static BaseProto getByid(int id){
        switch (id){\n`
    for(let i  = 0;i< s2.p.length;i++){
        let o = s2.p[i];
        let f = o.name;
        // getFuncs+=`\t\t\tcase ${o.id}:${f} ws = new ${f}();return ws;\n`

        // case 1001: return new Heartbeat_req();
        getFuncs+=`\t\t\tcase ${o.id}:return new ${f}();\n`

    }
getFuncs+= `\t\t}
        return null;
    }
}`


fs.writeFileSync(o2, "/********************************/\n" + s2.data + getFuncs, { encoding: "utf8" });




}

cschape();