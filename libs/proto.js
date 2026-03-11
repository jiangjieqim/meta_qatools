/**
 * ts proto生成器
 */

var fs = require('fs');
// let url = `C:/Users/Administrator/node_modules/xml-js/index.js`
// url = `C:/Users/Administrator/AppData/Roaming/npm/node_modules/xml-js/index.js`;


let url ="./../npm/node_modules/xml-js/index.js";

var convert = require(url);
function isBaseType(type){
    let arr = ["string","uint8","int16","uint16","uint32","double","int","float","arraybuffer"];
    return arr.indexOf(type)!=-1;
}
/**
 * 
 * 
 * console.log(1);
		let a:Laya.Byte = new Laya.Byte();
		a.writeByte(2);
		a.writeInt32(12);
		a.writeUTFString("aaaBa");
		a.pos = 0;
		console.log(a.readByte(),a.readInt32(),a.readUTFString());
 */
function addDesc(s,_attributes){
    s+="\t/*"+_attributes.desc+"*/\n";
    return s;
}



function getTypeStr(type){
    switch(type){
        case "string":{
            return "string";
        }
        case "double":{
            return "number";
        }
        // case "array":{
        //     return attr.itemtype+"[]";
        // }
        case "int":
        case "uint8":
        case "int16":
        case "uint16":
        case "uint32":
        case "float":
        {
            return "number"
        }
        case "arraybuffer":
        {
            return "ArrayBuffer";
        }
        default:{
            return type;
        }
    }
}



function getType(attr){
    let type = attr.type;

    if(type == "array"){
        return getTypeStr(attr.itemtype)+"[]";
    }
    return getTypeStr(type);
}
//解析一条数据
function parseVar(fromMap,protobuf){
    let attr =  protobuf._attributes;
    let s = "";
    s= addDesc(s,attr);
    if(attr.from!=undefined){
        addImportMap(fromMap,attr)
    }
    let type =  getType(attr);
    let b = "";
    if(type == "string" || type == "number" || type == "ArrayBuffer"){

    }else{
        if(type.indexOf("[]")!=-1){

        }
        else if(type == "array"){

        }
        else{
            // console.log("type");
            b = `=new ${type}()`
        }
    }
    s += "\tpublic " + attr.name + ":" + type + b +";\n";
    return s;
}




function ws(o,_that){
    let s = "";
    let type = o.type;
    switch(type){
        case "uint8":
            s+="b.writeUint8("+_that+");";
            break;
        case "uint16":
            s+="b.writeUint16("+_that+");";
            break;
        case "int16":
            s+="b.writeInt16("+_that+");";
            break;
        case "uint32":
            s+="b.writeUint32("+_that+");";
            break;
        case "int":
            s+="b.writeInt32("+_that+");";
            break;
        case "string":
            s+="b.writeUTFString("+_that+");";
            break;
        case "double":
            s+="b.writeFloat64("+_that+");";
            break;
        case "float":
            s+="b.writeFloat32("+_that+");";
            break;
        case "arraybuffer":
            s+=`{
b.writeInt32(${_that}.byteLength);
b.writeArrayBuffer(${_that});
}`
            break;
        // case "uint64":
        //     s+=`
        //     let low = ${_that}.low;
        //     let high= ${_that}.high;
        //     b.writeUint32(high);
        //     b.writeUint32(low);
        //     `
        //     break;
        case "array":
            let b1 = "";
            if(isBaseType(o.itemtype)){
                b1 = ws({type:o.itemtype},_that+"[i]");
            }else{
                b1 = `${_that}[i].write(b);`;
            }
            s+=`
        ${_that}=${_that}||[];
        len = ${_that}.length;
        b.writeInt32(len);
        for(let i = 0;i < len;i++){
    ${b1}
        }`
            break;
        default:
            s+="\t\t"+_that+".write(b);"
            break;
    }
    return s;
}

function cWrite(a){
    let o = a;//._attributes;
    let s = "";
    let _that = "this." + o.name;
    s+=ws(o,_that);
    return s;
}
/**
 * 	console.log(a.readByte(),a.readInt32(),a.readUTFString());
		a.readUint32()
		a.readUint8();

 */
function rs(o,_that){
    let s = "";

    switch(o.type){
        case "uint8":
            // s += "\t\t";
            s+=_that+"=b.readUint8()";
            break;
        case "uint16":
            // s += "\t\t";
            s+=_that+"=b.readUint16()";
            break;
        case "int16":
            // s += "\t\t";
            s+=_that+"=b.readInt16()";
            break;
        case "uint32":
            // s += "\t\t";
            s+=_that+"=b.readUint32()";
            break;
        case "int":
            s+=_that+"=b.readInt32()";
            break;
        case "string":
            // s += "\t\t";
            s+=_that+"=b.readUTFString()";
            // s+=_that+"=f_readUTFString(b)";
            // s+=_that+"=ProtoTools.f_readUTFString(b)";
            break;
        case "double":
            // s += "\t\t";
            s+=_that+"=b.readFloat64()";
            break;
        case "float":
            s+=_that+"=b.readFloat32()";
            break;

        case "arraybuffer":
            s+=`{
let l=b.readInt32();
let ab=b.readArrayBuffer(l);
${_that} = ab;
}`;
            break;
        // case "uint64":
        //     s+=`
        //     let high = b.readUint32();
        //     let low  = b.readUint32();
        //     ${_that} = new unit64(low,high);
        //     `
        //     break;
        case "array":
            let b1 = "";
            if(isBaseType(o.itemtype)){
                // b1 = `\t${_that}=[]\n`;
                b1 = rs({type:o.itemtype},_that);
                let arr = b1.split("=");
                // console.log(arr);
                s+=`${arr[0]}=${arr[0]}||[];`;
                let a = '';//`${arr[0]}=${arr[0]}||[];`;
                b1 = `${a}${arr[0]}.push(${arr[1]})`;
            }else{
                s+= `${_that}=${_that}||[];\n`;
                //b1 = `${_that}=${_that}||[];\n`
                b1 = "";
                b1 += `let item = new ${o.itemtype}()\n`;
                // b1 += `${_that}[i].read(b)`;
                b1 += `item.read(b);\n`;
                b1 += `${_that}.push(item);\n`;
            }
            
            s+=`
        len = b.readInt32();

        for(let i = 0;i < len;i++){
    ${b1}
        }`
            break;

        default:
            s+="\t\t"+_that+".read(b);"
            break;
    }
    return s;
}

function cRead(a){
    let o = a._attributes;
    let s = "";
    let _that = "this." + o.name;
    s+=rs(o,_that);
    return s;
}

function addImportMap(fromMap,attr){
    let src =  attr.from;
    let typeName = attr.type;
    if(attr.itemtype){
        typeName = attr.itemtype;
    }
    if(!fromMap[src]){
        fromMap[src] = [];
    }
    let arr = fromMap[src];
    if(arr.indexOf(typeName)==-1){
        arr.push(typeName);
    }
}

function exportProtoTs(xml){
    let protoDef = [];//协议号数组
    //let xml = fs.readFileSync(url,{encoding:"utf8"})
    let fromMap = {};
    var result1 = convert.xml2json(xml, {compact: true, spaces: 4});//compact:true 小型结构
    let obj1 = JSON.parse(result1);
    const REQ = "req";//请求
    const REVC = "revc";//接受
    const NTF = "ntf";//客户端解析
    let s = "";
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

                
                if (o._attributes.target.indexOf("c")!=-1) {
                    if (o.protobuf) {
                        if (o.protobuf.length == undefined) {
                            o.protobuf = [o.protobuf];
                        }

                        s += `\n/*${o._attributes.desc}*/\nexport enum ${o._attributes.name} {\n`

                        for (let n = 0; n < o.protobuf.length; n++) {
                            let a = o.protobuf[n];

                            // export enum EBankVoType{
                            //     /**
                            //      * 存记录
                            //      */
                            //     SaveHis = 1,
                            //     /**
                            //      * 取记录
                            //      */
                            //     GetHis = 2,
                            // }

                            let obj = a._attributes;
                            // console.log(o.name,o.desc);
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
                let obj = {id:_attributes.id,name:clsName,desc:"协议id:"+_attributes.id+" 描述:"+_attributes.desc};
                protoDef.push(obj);
            }

            // import {stSimpleUser} from "./BaseProto";
            
            let _writeStr = "";
            let _readStr = "";
            let _varstr = "";
            if (o.protobuf) {
                if(o.protobuf.length == undefined){
                    o.protobuf=[o.protobuf];
                }
                for (let n = 0; n < o.protobuf.length; n++) {
                    let a = o.protobuf[n];
                    // if(a.from!=undefined){
                    //     addNode(fromMap,a.from,a.type)
                    // }
                    _varstr += parseVar(fromMap,a) + "\n";
                    if (type == REVC || type == NTF || type == undefined) {
                        _readStr += cRead(a) + "\n";
                    }
                    if (type == REQ || type == undefined) {
                        //write
                        _writeStr += cWrite(a._attributes) + "\n";
                    }
                }
            }

            let proDesc = "";
            if (_attributes.id) {
                proDesc = " 协议id:" + _attributes.id ;
            }
            if(_attributes.desc){
                s+="/*"+_attributes.desc+ proDesc + "*/\n";
            }
            s += "export class "+clsName+"{\n"
            if(type == REQ || type == NTF){
            //    s+="\tpublic b;\n"
                // s+=`\tpublic protoid:number =  ${_attributes.id};\n`;//协议号
                s+=`public getProtoid(){return ${_attributes.id}}\n`;
            }
            s += _varstr;
            if(type == REQ || type == undefined){
                // s+="\tpublic write(b){\n"
                // s+=_writeStr;
                // s+="\t}\n"

                s+=`\tpublic write(b){
                    let len;
            ${_writeStr}
                }\n`

            }
            if(type == REVC ||type== NTF || type == undefined){
                // s+="\tpublic read(b){\n"
                // s+=_readStr;
                // s+="\t}\n"


                s+=`\tpublic read(b){
        let len;
${_readStr}
    }\n`
            }
            s +="\tconstructor(){}\n";
            s+="}"
            
        }


    }

    }
    // console.log(s);
    return {data:s,p:protoDef,from:fromMap};
}
/**
 * 总协议定义构造器
 */
// export enum GameProtoID{
	// WebClientRegist_req = 3003,
	// WebClientRegist_re1 = 1,
// }
function buildCls(protoDef){
    // let gcls = "//协议类映射\nexport let PRO_CLS = {};\n";
    // for(let i = 0;i < protoDef.length;i++){
    //     let obj = protoDef[i];
    //     gcls+="PRO_CLS[" + obj.id+"]="+obj.name + ";\n"; 
    // }
    // // console.log(gcls);
    // return gcls;


    // let gcls = `/*协议ID枚举*/\nexport enum GameProtoID{\n`;
    // for(let i = 0;i < protoDef.length;i++){
    //     let obj = protoDef[i];
    //     // gcls+="PRO_CLS[" + obj.id+"]="+obj.name + ";\n"; 
    //     gcls += `\t/*${obj.desc}*/\n\t${obj.name}=${obj.id},\n`;
    //     console.log(obj);
    // }
    // gcls += "}"
    // // console.log(gcls);
    // return gcls;

    // export function getParseObj(id:number){
    //     switch (id) {
    //         case 3002:return  new WebClientRegist_revc();
    //         default:	return null;
    //     }
    // }




    let head  = "";

    for(let i = 0;i < protoDef.length;i++){
        let obj = protoDef[i];
        head +=obj.name;
        if(i < protoDef.length - 1){
            head+=",";
        }
    }
    // import { Heartbeat_req ,Heartbeat_revc} from "./gameproto";
    // let s0 = `import { ${head}} from "./${(fileName||"")}"\n`;
    s0 = "";


    let s =`
export function getParseObj(id:number){
switch (id) {\n`
        for(let i = 0;i < protoDef.length;i++){
            let obj = protoDef[i];
            // gcls+="PRO_CLS[" + obj.id+"]="+obj.name + ";\n"; 
            // s += `\t/*${obj.desc}*/\n\t${obj.name}=${obj.id},\n`;
            // console.log(obj);
            s+=`\tcase ${obj.id}:return  new ${obj.name}();\n`;
            // head +=obj.name+",";
        }

         s+=`\tdefault:	return null;
}
}`
    return s0+s;
}












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

module.exports = { exportProtoTs, buildCls };