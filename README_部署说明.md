# RF Path Lab GitHub Pages 部署说明

本压缩包已经是可直接发布的静态网站，不需要安装 Node.js，也不需要执行构建命令。

## 发布到新仓库

1. 在 GitHub 新建一个 Public 仓库，例如 `rf-path-lab`。
2. 解压本压缩包。
3. 将解压目录中的全部文件和 `src` 文件夹上传到仓库根目录。
4. 打开仓库的 `Settings → Pages`。
5. 在 `Build and deployment` 中选择 `Deploy from a branch`。
6. Branch 选择默认分支（通常为 `main`），目录选择 `/ (root)`，然后保存。
7. 等待约 1–5 分钟，访问：

   `https://你的GitHub用户名.github.io/rf-path-lab/`

## 发布到用户主页仓库

如果仓库名称是 `你的GitHub用户名.github.io`，上传方法相同，网址为：

`https://你的GitHub用户名.github.io/`

## 文件说明

- `index.html`：主页面
- `styles.css`：基础界面样式
- `formulas.css`：公式、图表与诊断区样式
- `src/app.mjs`：交互和 SVG 图表逻辑
- `src/calculator.mjs`：链路预算与传播模型计算内核

请保持目录结构不变。网页不依赖服务器后端或数据库。
