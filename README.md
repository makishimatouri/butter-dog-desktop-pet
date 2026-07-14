# Butter Dog Trash Pet

Butter Dog Trash Pet 是一个独立桌面宠物应用。把文件或文件夹拖到黄油小狗身上，小狗会做投喂反馈，并把项目移入系统回收站。

当前版本：`v0.1.0`

## 功能

- 拖入文件或文件夹：移入系统回收站。
- 投喂反馈：拖入时进入简洁等待动作，放开后播放吃掉动作。
- 鼠标悬停：随机播放招手或举手蹦跳回应。
- 拖动小狗：向左或向右拖动时播放对应跑步动作。
- 右键菜单：打开回收站、调整大小、退出小狗。
- 大小设置：小、标准、大、特大，选择后会记住。

## 平台

- macOS：已在本机打包验证 Intel 版。
- Windows：代码使用系统 Recycle Bin，仓库 workflow 会构建 Windows x64 包。

## 使用

本地运行：

```bash
npm install
npm start
```

检查项目：

```bash
npm run check
npm audit --audit-level=high
```

打包 macOS Intel 版：

```bash
npm run package:mac
```

打包 Apple Silicon 版：

```bash
npm run package:mac:arm64
```

打包 Windows x64 版：

```bash
npm run package:win
```

本地打包产物会输出到 `dist/`。`dist/` 和 `node_modules/` 不提交到 GitHub。

## 版本

- 当前稳定版本：`v0.1.0`
- 版本记录：[CHANGELOG.md](./CHANGELOG.md)
- 当前版本说明：[docs/releases/v0.1.0.md](./docs/releases/v0.1.0.md)

## 项目结构

```text
assets/
  spritesheet.webp        Butter Dog v2 图集
src/
  main.js                 Electron 主进程、菜单、回收站、大小设置
  preload.js              安全暴露给渲染层的 IPC API
  renderer.html           桌面宠物页面
  renderer.js             动画、拖拽、投喂、悬停交互
  styles.css              透明窗口和小狗视觉样式
scripts/
  smoke-test.js           基础文件检查
.github/workflows/
  build-windows.yml       GitHub Actions Windows 打包
```

## 设计说明

当前 Codex custom pet 包只包含 `pet.json` 和 `spritesheet.webp`，没有拖拽、右键菜单或文件系统操作扩展点。所以这个项目是一个独立 Electron 桌面应用，复用已完成的 Butter Dog 图集。
