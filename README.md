# Butter Dog Trash Pet

一个独立的黄油小狗桌面应用。把文件拖到小狗身上，小狗会做“吃掉”的反馈，并把文件移入系统回收站。

## 功能

- 拖入文件或文件夹：移入系统回收站。
- 拖入时：小狗进入等待投喂状态。
- 放开后：小狗播放吃掉反馈。
- 右键小狗：打开扩展菜单。
- 菜单第一项：打开回收站。
- 菜单里可以调整小狗大小，选择会自动记住。

## 运行

```bash
npm install
npm start
```

## Windows 打包

```bash
npm run package:win
```

产物会输出到 `dist/ButterDogTrash-win32-x64/`。Windows 上拖入文件时使用系统 Recycle Bin，不会直接永久删除。

## 说明

当前 Codex custom pet 包只包含 `pet.json` 和 `spritesheet.webp`，没有拖拽、右键菜单或文件系统扩展点。所以这个项目是一个独立桌面小狗应用，复用已完成的 Butter Dog 图集。
