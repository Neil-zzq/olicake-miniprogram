@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========== 1. 配置 Git 用户（仅首次需要）==========
git config user.email "neil-zequan@outlook.com"
git config user.name "neil-zequan"

echo.
echo ========== 2. 查看当前状态 ==========
git status
git remote -v

echo.
echo ========== 3. 添加并提交所有更改 ==========
git add .
git commit -m "feat: olicake 小程序 iOS 风格改版与功能完善" 2>nul || git commit -m "update: 同步本地修改"

echo.
echo ========== 4. 推送到 GitHub ==========
echo 若尚未添加远程，请先执行：
echo   git remote add origin https://github.com/你的用户名/你的仓库名.git
echo.
git branch -M main 2>nul
git push -u origin main 2>nul || git push -u origin master 2>nul || echo 请先在 GitHub 创建仓库并执行: git remote add origin 仓库地址
echo.
pause
