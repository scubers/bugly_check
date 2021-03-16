#!/bin/bash



echo ">>>>>>>>>> 更新代码"
git pull

echo ">>>>>>>>>> 删除文件夹"
rm -rf build/

echo ">>>>>>>>>> 安装依赖"
npm install

echo ">>>>>>>>>> 编译"
tsc

echo ">>>>>>>>>> 运行"
npm start