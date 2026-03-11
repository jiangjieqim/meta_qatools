# 命令行文件说明  
`D:\jjq\game\gameclient\cmd`  
buildproto.bat 生成协议   
clear.bat 清理缓存  
exportUI.bat 导出ui资源  
exportUI_Atlas.bat 生成ui图集和导出ui资源  
publish.bat 发布release 会生成至 D:\jjq\game\gameclient\release\web  
publishCode.bat 只发布代码  
tsccheck.bat 检测编译是否有错误 

# initconfig.js说明
```js
var initConfig={
	"asset":"http://127.0.0.1:9001/jjq/game/resource/", //资源地址
	"server_ip": "ws://127.0.0.1:20000",                 //服务器

    /*
        开发模式开启,用于debug断点,注释掉加载的是zip过的代码
    */
    //DEBUG : true    

    /*
        是否使用json格式的配置
        默认使用的是加载all.bin配置,流对象后zip的
        
        会将下面的前置加载配置压缩打包到all.bin文件中
        if (InitConfig.isJson) {
            this.DefaultRes
                //手动配置信息
                .Add(ResPath.Cfg.serverCfg, Laya.Loader.JSON)
                .Add(ResPath.Cfg.comCfg, Laya.Loader.JSON)
                .Add(ResPath.Cfg.ruleCfg, Laya.Loader.JSON)
                .Add(ResPath.Cfg.guideCfg, Laya.Loader.JSON)
                .Add(ResPath.Cfg.skinCfg, Laya.Loader.JSON)
                .Add(ResPath.Cfg.mapCfg, Laya.Loader.JSON)
                .Add(ResPath.Cfg.noticeCfg, Laya.Loader.JSON)
                 //语言包信息
                .Add(ResPath.Font.Chinese, Laya.Loader.JSON)
                .Add(ResPath.Font.English, Laya.Loader.JSON)
        }
    */
    // json : true,
}
```

D:\jjq\game\softsetp\nginx-1.18.0.rar 加个http服务配置资源服务器地址    
nginx-1.18.0\conf\nginx.conf  
```
server {
    listen  9001;
    location /
    {
        root D:/;
        autoindex on;
        autoindex_exact_size on;
        autoindex_localtime on;
        add_header Access-Control-Allow-Origin * ;
        add_header Access-Control-Allow-Credentials true;
        add_header Access-Control-Allow-Methods 'GET,POST,OPTIONS';
    }
}
```

# 发布脚本publish.js
1.对jsonTypes = ["lmat","ltc","ls","json","atlas","lh","efc"]进行空格，换行去除  
2.对resource中的png,jpg压缩  
3.主程序jsmin后压缩成zip格式  
4.release从`tools\qatools\releaseTemplate`生成  
5.发布模式会用bundle.zip模式加载代码  

`平台差异,release,debug用initConfig.js中的配置来区分,所以发布的版本的时候不会从模板文件(D:\jjq\game\tools\qatools\releaseTemplate)中copy`  
```
node publish.js -w D:\jjq\game\gameclient -r D:\jjq\game\resource -o D:\jjq\game\out -q 50
```
`-w` 客户端目录  
`-r` 资源目录  
`-o` 输出目录  
`-q` 资源压缩比 (0-100) 默认不填为50  
`-nc` 不执行压缩image操作,不填默认压缩  
`-imgsize` 图片的尺寸缩放比率0~1 ,假设之前的image大小为1024x768 imgsize=0.3的时307.2x153.6,不设置默认不缩放比例  
`-justcode` 是否只发布代码  
`--dontCompressCode`不压缩代码  
`--dontbuildconfig`不生成配置  

`node publish.js -w D:\jjq\game\gameclient -r D:\jjq\game\resource -o D:\jjq\game\out -imgsize 0.3`

整个发布文件会在`D:\jjq\game\out`目录下

# compile.js编译
```
-w 工作目录

-c 是否压缩js 调试断点的时候不要加

--tsc 会在bin/js目录下生成 stat.html js模块分析文件,这个模式开启的时候断点时候在模块js中的,trunk/gameclient/bin/js/stats.html
```
# json2bAll配置生成工具
```
node json2bAll.js -excels "D:\jjq\game\trunk\configs\excels" -jsondir "D:\jjq\game\trunk\resource\res\config\export" -codedir "D:\jjq\game\trunk\gameclient\src\game\static\json\struct"
```
-excels xlsx目录  
jsondir json输出目录  
codedir 配置代码目录  

说明
```
this.Cfg.mDataMap触发get会执行解析整表逻辑,不走mDataMap都是局部获取单条数据
```
ByteCfg.ts
```js
public get mDataMap(){
    if(!this._mDataMap){
        this.initDataMap();
    }
    return this._mDataMap;
}
```
配置类继承自BaseCfg.ts

# 字体缩减
```
 node fontcompress.js -i "D:\jjq\game\trunk"
```
素材字体在`D:\jjq\game\trunk\gameclient_ui\BOLD.ttf`

# 子模块化加载方式

注意:  
1.不要用 export default class这种方式导出子模块类  
2.initconfig中的`DEBUG:false` `执行publishCode.bat`的时候生效  
3.删除掉module.json中的配置内容就是整包模式

相关配置:
D:\jjq\game\trunk\gameclient\module.json
```json
{
    "bank":[
        "game/view/handle/bank/ctrl",
        "game/view/handle/bank/model",
        "game/view/handle/bank/view",
        "game/view/handle/bank/vos"
    ]
}
```
会生成  
trunk\gameclient\bin\js\bank.bin  
trunk\resource\res\config\module.bin

```ts
 /**
 * 打開銀行
 */
private onBankClick(): void {
    E.ViewMgr.OpenModule("bank",EViewType.Bank,new Laya.Handler(this,this.bankCallBack),new Laya.Handler(this,this.onBankInit));
}

private onBankInit():void{
    E.ViewMgr.Reg(new CtrlBank(EViewType.Bank, ResPath.View.Bank, ELayerType.frameLayer));
}

private bankCallBack():void{
    BankModel.getIns().open();
}
```

# 资源版本控制 resver.js
```
--base 基础资源路径
--cur 新路径
```
```
cd D:\jjq\game\tools\qatools

node resver.js --base D:\jjq\game\trunk\release_base\resource --cur D:\jjq\game\trunk\releaseVer2\resource
```
1.会生成`trunk\releaseVer2\resource\manifest.bin`文件  
2.`trunk\release_base\resource\g`增量文件夹  
3.publish的时候会在生成小包`trunk\little\20220811171124`  