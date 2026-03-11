/**
 * ts proto生成器
 */

var fs = require('fs');
// let url = `C:/Users/Administrator/node_modules/xml-js/index.js`
// url = `C:/Users/Administrator/AppData/Roaming/npm/node_modules/xml-js/index.js`;
let url ="./../npm/node_modules/xml-js/index.js";

var convert = require(url);
function isBaseType(type){
    let arr = ["string","uint8","int16","uint16","uint32","uint64","double","int","float","arraybuffer"];
    return arr.indexOf(type)!=-1;
}
function addDesc(s,_attributes){
    s+="/*"+_attributes.desc+"*/\n";
    return s;
}

function gt(type){
    switch(type){
        case "string":{
            return "string";
        }
        case "uint8":
            return "byte";
        case "uint16":
            return  "UInt16";
        case "int16":{
            return  "Int16";
        }
        case "uint32":{
            return "UInt32"
        }
        case "int":{
            return "int";
        }
        case "uint64":
            return "UInt64";
        case "double":
            return "double";
        case "float":
            return "float";
        case "arraybuffer":
            return "byte[]";
        default:{
            return type;
        }
    }
}
function isBase(curtype){
    let arr = ["string","byte","UInt16","Int16","UInt32","UInt64" ,"double" ,"int","float","byte[]"];
    return arr.indexOf(curtype) != -1;   
}

function getType(attr){
    let type = attr.type;
    if(type == "array"){
        return "List<"+gt(attr.itemtype)+">";
    }
    return gt(type);
}

function parseVar(protobuf,n){
    let attr =  protobuf._attributes;
    let s = "";
    s= addDesc(s,attr);

    let curtype = getType(attr);
    let b = ""
    if(!isBase(curtype)){
        if(attr.type == "array"){
            //let aa = ""; 
            // 'List<string>'
            b = `=new ${curtype}()`;
        }else{
            b = `=new ${attr.type}()`
        }
    }
    else if(curtype == "string"){
        b =`=string.Empty`;
    }
    s += `[ProtoMember(${n+1})] public ${curtype}  ${attr.name} ${b};\n`;
    return s;
}
        /*
    /**
     * Laya.Byte的 writeUTFString实现 laya.core.js line 2167
     *  writeUTFString(value) {
            var tPos = this.pos;
            this.writeUint16(1);
            this.writeUTFBytes(value);
            var dPos = this.pos - tPos - 2;
            this._d_.setUint16(tPos, dPos, this._xd_);
        }
        */
function getwrite(type){
    switch(type){
        case "uint8":
            return "WriteByte";
        case "uint16":
            return "WriteUInt16";
        case "int16":
            return "WriteInt16";
        case "uint32":
            return "WriteUInt32";
        case "uint64":
            return "WriteUInt64";
        case "double":
            return "WriteDouble";
        case "string":
            return "WriteString16";
        case "int":
            return "WriteInt32";
        case "float":
            return "WriteFloat";
        case "arraybuffer":
            return "WriteArrayBuffer";
    }
}

function ws(o,_that){
    let s = "";
    switch(o.type){
        case "uint8":
        case "uint16":
        case "uint32":
        case "int16":
        case "uint64":
        case "double":
        case "string":
        case "int":
        case "float":
        case "arraybuffer":
            let func = getwrite(o.type);
            s += `b.${func}(${_that});`;
            break;
        case "array":
            let b1 = "";
            if(isBaseType(o.itemtype)){
                b1 = ws({type:o.itemtype},_that+"[i]");
            }else{
                // b1 = `${o.itemtype} item = new ${o.itemtype}();item.write(b);\n${_that}.Add(item);                `
                b1=`${_that}[i].write(b);`
            }
            // b.WriteUInt32((uint)len);
            s+=`
        if (${_that} != null){
            int len = ${_that}.Count;
            b.WriteInt32(len);
            for (int i = 0; i < len; i++){
        ${b1}
            }
        }else{
            b.WriteUInt32(0);
        }`
            break;
        default:
            s+=""+_that+".write(b);"
            break;
    }
    return s;
}

/*
            b.WriteByte(id);
            b.WriteInt32(key);
            b.WriteString16(name);



*/
function cWrite(o){
    // let o = a._attributes;
    let s = "";
    let _that = "" + o.name;
    return ws(o,_that);
}

 /*
public void read(NS b)
{
    b.ReadUint32();
    b.ReadString32();
    b.ReadByte();
}
*/

function getread(type){
    switch(type){
        case "uint8":
            return "ReadByte()";
        case "uint16":
            return "ReadUInt16()";
        case "int16":
            return "ReadInt16()";
        case "uint32":
            return "ReadUint32()";
        case "string":
            return "ReadString16()";
        case "double":
            return "ReadDouble()";
        case "uint64":
            return "ReadUint64()";
        case "int":
            return "ReadInt32()";
        case "float":
            return "ReadFloat()";
        case "arraybuffer":
            return "ReadArrayBuffer()";
    }
}

function rs(o,_that){
    let s = "";
    switch(o.type){
        case "uint8":
        case "uint16":
        case "int16":
        case "uint32":
        case "uint64":
        case "string":
        case "int":
        case "double":
        case "float":
        case "arraybuffer":
            s+="\t\t"+_that+" = b."+getread(o.type)+"";
            break;
        case "array":
            let b1 = "";
            if(isBaseType(o.itemtype)){
                b1 = rs({type:o.itemtype},_that);
                b1 = b1.replace(`\t\t${o.name} = `,"");
                b1 = `${o.name}.Add(${b1});`;
            }else{
                b1 = `${o.itemtype} item = new ${o.itemtype}();item.read(b);\n${_that}.Add(item);                `
            }

            s+=`
        ${_that} = new List<${gt(o.itemtype)}>();
        len = b.ReadInt32();
        for (int i = 0; i < len; i++){
            ${b1}
        }`
            break;
        default:
            s+=""+_that+".read(b);"
            break;
    }
    return s;
}

function cRead(o){
    // let o = a._attributes;
    let _that = "" + o.name;
    return rs(o,_that)+";";
}


function checkHasLen(s){
    return s.indexOf("len = b.ReadInt32();")!=-1;
}

function exportProtoCShape(xml){
    let protoDef = [];//协议号数组
    // let xml = fs.readFileSync(url,{encoding:"utf8"})

    var result1 = convert.xml2json(xml, {compact: true, spaces: 4});//compact:true 小型结构
    let obj1 = JSON.parse(result1);
    const REQ = "req";//请求
    const REVC = "revc";//接受
    const NTF = "ntf";//客户端解析
    let s = `using System;\nusing System.Collections.Generic;\nusing ProtoBuf;
`;
    if(obj1.proto){
        let proto = obj1.proto;
        if(proto.length == undefined){
            proto = [proto];
        }
        for(let i = 0;i < proto.length;i++){
            let o = proto[i];
            // console.log(o);
            
            let _attributes =  o._attributes;
            let type =  _attributes.type;
            if(type == "enum"){
                //枚举类型
                // console.log(_attributes);
                if (o._attributes.target.indexOf("s")!=-1) {
                    if (o.protobuf) {
                        if (o.protobuf.length == undefined) {
                            o.protobuf = [o.protobuf];
                        }

                        s += `\n/*${o._attributes.desc}*/\npublic enum ${o._attributes.name} {\n`

                        for (let n = 0; n < o.protobuf.length; n++) {
                            let a = o.protobuf[n];

                            // public enum ECounterType {
                            //     Null = 0,
                            //     SignIn = 1,     //签到
                            //     DailyTask = 2,  //日常任务
                            // }

                            let obj = a._attributes;
                            let v = "";
                            if (obj.value) {
                                v = `=${obj.value}`;
                            }
                            console.log(obj);
                            s += `\t/*${obj.desc}*/\n\t${obj.name}${v},\n`;
                        }
                        s += `}\n`;
                    }
                }
            }else{
                //bind class
                let clsName = _attributes.name;
                if(type){
                    clsName +="_"+ type;
                }
                if(_attributes.id){
                    // protoDef[_attributes.id] = clsName;
                    let obj = {id:_attributes.id,"name":clsName};
                    protoDef.push(obj);
                }
                let _writeStr = "";
                let _readStr = "";
                let _varstr = "";
                if (o.protobuf) {
                    if(o.protobuf.length == undefined){
                        o.protobuf=[o.protobuf];
                    }
                    for (let n = 0; n < o.protobuf.length; n++) {
                        let a = o.protobuf[n];
                        _varstr += parseVar(a,n) + "\n";
                        if (type == REVC || type == NTF || type == undefined) {
                            _writeStr += cWrite(a._attributes) + "\n";
                        }
                        if (type == REQ || type == undefined) {
                            _readStr += cRead(a._attributes) + "\n";
                        }
                    }
                }

                let proDesc = "";
                if(_attributes.id){
                    proDesc = " 协议id:" + _attributes.id ;
                }
                if(_attributes.desc){
                    s+="/*"+_attributes.desc+ proDesc + "*/\n";
                }
                s +=`[ProtoContract]\n`;
                let inherit = "";
                let over = "";
                if(type == REVC || type == NTF || type == REQ){
                    inherit = ': BaseProto';
                    over = "override";
                }
                else if(type == undefined){
                    //结构体
                    over = "";
                    inherit = "";
                }

                s += `public class ${clsName}${inherit}{\n`
                if(type == REVC || type == NTF){
                        s+=`public override ushort getProtoid(){return ${_attributes.id};}\n`;//服务器发送的协议号
                    }
                s += _varstr;
                if(type == REQ || type == undefined){
                    // s+="\tpublic override void read(NS b){\n"
                    // s+=_readStr;
                    // s+="\t}\n"
                
                    let sign =  checkHasLen(_readStr) ? "int len;" : "";

                    s+=`public ${over} void read(NS b){\n${sign}\n${_readStr}}\n`;
                }
                if(type == REVC ||type== NTF || type == undefined){
                    s+=`public ${over} void write(NS b){${_writeStr}}\n`;
                }
                // s +="\tconstructor(){}\n";//构造函数
                s+="}\n"
            }
        }
    }
    // console.log(s);
    return {data:s,p:protoDef};
}
// /**
//  * 构造类
//  */
// function buildCShape(protoDef){
//     let gcls = "//协议类映射\nexport let PRO_CLS = {};\n";
//     for(let i = 0;i < protoDef.length;i++){
//         let obj = protoDef[i];
//         gcls+="PRO_CLS[" + obj.id+"]="+obj.name + ";\n"; 
//     }
//     // console.log(gcls);
//     return gcls;
// }

// function exportUserData(url){
//     let xml = fs.readFileSync(url,{encoding:"utf8"})
//     var result1 = convert.xml2json(xml, {compact: true, spaces: 4});
//     let obj1 = JSON.parse(result1);
// }
// console.log(protoDef);
// fs.writeFileSync("userdata_ts.ts",s,{encoding:"utf8"});

// console.log(s);


// let s = exportProtoTs("userdata.xml");// "proto.xml"
// let s2 = exportProtoTs("proto.xml");// "proto.xml"
// fs.writeFileSync("proto_ts.ts",s+"//#######################################\n"+s2+"\n"+buildCls(),{encoding:"utf8"});

module.exports = { exportProtoCShape };