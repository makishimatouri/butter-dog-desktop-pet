# Changelog

## v0.1.0 - 2026-07-14

首个可用版本。

### Added

- 独立 Electron 桌面黄油小狗应用。
- 支持拖入文件或文件夹并移入系统回收站。
- 支持 Windows Recycle Bin 和 macOS Trash。
- 投喂等待和吃掉反馈动作。
- 鼠标悬停随机回应动作。
- 拖动小狗时按方向播放左右跑步动作。
- 右键菜单支持打开回收站、调整大小、退出。
- 大小设置支持小、标准、大、特大，并写入本机设置。
- GitHub Actions Windows x64 构建 workflow。

### Verified

- `npm run check`
- `npm audit --audit-level=high`
- macOS 本机短启动
- macOS x64 打包
- Windows x64 打包
