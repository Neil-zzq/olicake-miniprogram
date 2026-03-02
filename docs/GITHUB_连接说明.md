# 连接 GitHub 并提交代码

## 一、确保本机已安装 Git

- 若未安装：打开 https://git-scm.com/download/win 下载并安装，安装时勾选 “Add Git to PATH”。
- 在 **Git Bash** 或 **VS Code 终端** 中执行下面命令（这些环境通常已包含 Git）。

---

## 二、在 GitHub 上创建仓库（若还没有）

1. 登录 https://github.com（账号邮箱：neil-zequan@outlook.com）。
2. 右上角 **+** → **New repository**。
3. 仓库名例如：`olicake-miniprogram`，选 Public，**不要**勾选 “Add a README”。
4. 点击 **Create repository**。
5. 复制仓库地址，例如：`https://github.com/neil-zequan/olicake-miniprogram.git`（替换成你的用户名和仓库名）。

---

## 三、在项目目录执行（复制整段到终端）

在 **Git Bash** 或 **VS Code** 里打开项目根目录  
`d:\新建文件夹\微信小程序\新建文件夹\olicake v1.0`，然后执行：

```bash
# 1. 进入项目目录
cd "d:/新建文件夹/微信小程序/新建文件夹/olicake v1.0"

# 2. 配置提交者信息（与 GitHub 账号对应）
git config user.email "neil-zequan@outlook.com"
git config user.name "neil-zequan"

# 3. 若还没有添加远程仓库，先添加（把下面地址换成你在第二步复制的地址）
git remote add origin https://github.com/neil-zequan/olicake-miniprogram.git

# 若已经添加过但地址错了，可先删除再加：
# git remote remove origin
# git remote add origin https://github.com/neil-zequan/你的仓库名.git

# 4. 添加所有文件并提交
git add .
git commit -m "feat: olicake 小程序 iOS 风格改版与功能完善"

# 5. 推送到 GitHub（首次推送并设置上游分支）
git branch -M main
git push -u origin main
```

如果 GitHub 上默认分支是 `master`，最后两行改为：

```bash
git push -u origin master
```

---

## 四、之后每次提交代码

```bash
cd "d:/新建文件夹/微信小程序/新建文件夹/olicake v1.0"
git add .
git commit -m "你的提交说明"
git push
```

---

## 五、使用项目里的批处理脚本（可选）

在项目根目录下已有一个 **GITHUB_PUSH.bat**。  
在 **命令提示符** 或 **资源管理器** 中双击运行前，请先：

1. 在 GitHub 建好仓库；
2. 在项目目录执行一次：  
   `git remote add origin https://github.com/你的用户名/你的仓库名.git`  
然后再运行 **GITHUB_PUSH.bat** 完成提交和推送。

---

推送时若提示需要登录，请使用 GitHub 账号或 **Personal Access Token**（GitHub → Settings → Developer settings → Personal access tokens）作为密码。
