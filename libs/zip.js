let JSZip = require("./jszip.js");
let cmd = require('./commander');
let {replaceComments} = require('./tools');
let path = require("path");
let fs = require("fs");
cmd.option("-i <string>","input file");
cmd.option("-o <string>","output file");
cmd.parse(process.argv);

function zip(urlArr,o,end){
    // console.log(JSZip);
    let arr = urlArr.split(';');
    let zip = new JSZip();
    console.log('**********************');
    console.log('save '+o)
    for(let i = 0;i < arr.length;i++){
        let url = arr[i];
        let str = fs.readFileSync(url);
        let filename = path.basename(url);
        let f2 = filename.split('.')
        if(f2.length >=2 && f2[f2.length-1]=='json'){
            str = replaceComments(str.toString());
        }
        zip.file(filename, str);
        console.log(url);
    }
    console.log('**********************');

    let s = zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }
    }).then(function (content) {
        fs.writeFileSync(o, content, { encoding: "utf-8" });
        console.log("zip file:" + o);
        end();
    });
}
let i = cmd.opts().i;
let o = cmd.opts().o;
// console.log(cmd.opts());
// console.log(i);
// console.log(o);
zip(i,o,()=>{
    // console.log('zip end!');
});