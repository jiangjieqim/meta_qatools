let cmd = require('./libs/commander');
let path = require("path");
let fs = require("fs");
let cwd = process.cwd();
let Fontmin = require(`${cwd}\\npm\\node_modules\\fontmin\\index.js`);
let rename = require(`${cwd}\\npm\\node_modules\\layaair2-cmd\\node_modules\\gulp-rename`)
cmd.option("-i <string>","this is path");

cmd.parse(process.argv);
//  node fontcompress.js -i "D:\jjq\game\trunk"
let trunk = cmd.opts().i // `D:\\jjq\\game\\trunk`

let filename = 'BOLD.ttf';

// D:\jjq\game\trunk\resource\res\font
let jsonParent = `${trunk}\\resource\\o\\font`;

if(!fs.existsSync(jsonParent)){
    let err = '['+jsonParent + " not exist!]";
    throw err;
}
let _list3 = fs.readdirSync(jsonParent);
let allStr = '';
for(let i = 0;i < _list3.length;i++){
    let url =  `${jsonParent}/${_list3[i]}`;
    let stats = fs.statSync(url);
    let isFile = stats.isFile();
    if(isFile){
        // configFileList.push(url);
    
        let str = fs.readFileSync(url);
        // allStr += str;
        let o = JSON.parse(str);
        // console.log(o);
        for(let n in o){
            let v = o[n];
            // console.log(v);
            for(let m in v){
                // console.log(v[m]);
                allStr+=v[m];
            }
        }

    }
}

// console.log(allStr);
// allStr = "賬";
// allStr = 'a';
// allStr = '中';
let fontpath = `${trunk}\\resource\\remote\\font\\`;
const fontmin = new Fontmin()
    .src(`${trunk}\\gameclient_ui\\BOLD.ttf`)
    .dest(fontpath)
    .use(Fontmin.glyph({
        text:allStr,
        hinting:false
    }))
    // .use(Fontmin.ttf2woff({deflate:true}))
    .use(rename(filename))
    ;

fontmin.run((err) => {
    if (err) {
        throw err;
    } else {
        let url = fontpath + filename;
        let status = fs.statSync(url);

        console.log(url + ',' + status.size + " bytes");
    }
})