注意：

由于example中使用了第三方包module-alias，该包对window不兼容，如window使用使用example样例使用下方三种方式的一种：

1. 全局安装sdenv: `npm i sdenv -g`
2. 安装sdenv到example目录中：`cd example && npm i sdenv`
3. 替换包路径地址的`sdenv`为相对路径`../../`，如代码`require('sdenv')`改为`require('../../')`
