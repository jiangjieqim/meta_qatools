1.svn安装命令行选项的版本

2.命令行说明
```
node ui_export.js -ui "D:/jjq/game/ui" -out "D:/jjq/game/resource" -client "D:/jjq/game/gameclient" -atlas
```

 -ui ui工程根目录  
 -out 输出的资源文件夹  
 `-atlas` 是否生成图集  
`-client` "D:/jjq/game/gameclient"客户端目录   

 注意  `-atlas导出时间比较久，以本机情况为例,50s左右,所以普通情况下去掉-atlas参数直接生成layaMaxUI.ts,ui相关的json大概3s左右`
下面是不构建图集的脚本  
```
node ui_export.js -ui "D:/jjq/game/ui" -out "D:/jjq/game/resource" -client "D:/jjq/game/gameclient"
```

3.ui工程下的filelist.json说明  
```
{
    "exportfiles":[
        "anims",
        "efcs",
        "remote",
        "res",
        "scenes",
        "views"
    ]
}
```
exportfiles是导出到resource目录下的文件夹。