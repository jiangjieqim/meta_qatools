// let cmd = require('./commander');
let cwd = process.cwd();//'d:\\jjq\\game\\tools\\qatools\\npm\\node_modules\\layaair2-cmd'
let path = require("path");
let fs = require("fs");
// cmd.option("-i <string>","resource workspace");
// cmd.option("-o <string>","output fold");
// cmd.parse(process.argv);
let ideModuleDir = `${cwd}\\node_modules\\`;//`${cwd}/npm/node_modules/layaair2-cmd/node_modules/`;
const gulp = require(ideModuleDir + "gulp");
const image = require(ideModuleDir+'gulp-image');
// let input = process.argv[3];
// let out = process.argv[4];
// console.log(process.argv);

function getKey(key){
    for(let i = 0;i < process.argv.length;i++){
        let o = process.argv[i];
        let index = o.indexOf(`-${key}=`)
        // console.log(index);
        if(index == 0){
            let s = o.replace(`-${key}=`,"");
            return s;
        }
    }
}

let input = getKey("i");
let out = getKey("o");

// console.log('['+input+']');
// console.log('['+out+']');


// let workspace = cmd.opts().w;//工作区
// console.log(cmd.opts());

// console.log(cmd);


gulp.task('minify', function () {
    // console.log("1");
    // return gulp.src(['d:/jjq/game/tools/qatools/json/*.json'])
    //     .pipe(jsonminify())
    //     .pipe(gulp.dest('d:/jjq/game/tools/qatools/dist'));
    gulp.src(`${input}`)
    .pipe(
        
        image({
            
            pngquant: true,			//PNG优化工具
            optipng: false,			//PNG优化工具
            zopflipng: true,		//PNG优化工具
            jpegRecompress: false,	//jpg优化工具
            mozjpeg: true,			//jpg优化工具
            guetzli: false,			//jpg优化工具
            gifsicle: false,		//gif优化工具
            svgo: false,			//SVG优化工具
            concurrent: 10,			//并发线程数
            quiet: true 			//是否是静默方式

/*
            optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
            pngquant: ['--speed=1', '--force', 256],
            zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
            jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
            mozjpeg: ['-optimize', '-progressive'],
            guetzli: ['--quality', 85],
            gifsicle: ['--optimize'],
            svgo: ['--enable', 'cleanupIDs', '--disable', 'convertColors']
*/








            // optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
            // pngquant: ['--speed=1', '--force', 256],
            // zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
            // jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
            // mozjpeg: ['-optimize', '-progressive'],
            // guetzli: ['--quality', 85]
        })
    )
    .pipe(gulp.dest(out));
});
gulp.task('default',["minify"]);