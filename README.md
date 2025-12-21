# 拼音练习工具 (Pinyin Practice Tool)

这是一个基于 React + TypeScript + Vite 构建的现代化拼音学习与练习应用。旨在通过多种互动方式帮助用户提升拼音输入准确度，同时提供便捷的汉字转拼音工具。

## ✨ 主要功能

### 1. 拼音练习 (Practice)

提供沉浸式的拼音打字练习体验：

- **丰富的练习内容**：内置古诗、绕口令、常用句、成语、经典古文等多种练习素材。
- **实时反馈**：打字过程中实时校验拼音输入，即时反馈对错。
- **智能辅助**：配备虚拟键盘，辅助初学者熟悉键位。
- **自定义练习**：支持通过 URL 参数自定义练习文本。

### 2. 汉字转拼音 (Convert)

功能强大的汉字注音工具，适用于学习和校对：

- **多音字支持**：能够识别并处理多音字情况。
- **高度自定义**：
  - 声调样式：支持符号声调 (ā)、数字声调 (a1) 或无声调。
  - 分隔符：自定义拼音之间的分隔符。
- **一键复制**：方便快捷地复制转换结果。

### 3. 错题本 (Mistake Review)

智能错题管理系统，帮助查漏补缺：

- **自动记录**：练习过程中的错误会自动加入错题本。
- **详细分析**：展示错误字符、您的输入以及正确拼音，并统计错误次数。
- **强化训练**：支持一键将错题生成新的练习内容，进行针对性复习。

## 🛠 技术栈

- **前端核心**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 框架**: [Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**: 基于 Shadcn UI 设计理念
- **图标库**: [Lucide React](https://lucide.dev/)
- **拼音引擎**: [pinyin-pro](https://github.com/zh-lx/pinyin-pro)
- **后端/部署**: [Cloudflare Workers](https://workers.cloudflare.com/)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd pinyin
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 4. 构建生产版本

```bash
npm run build
```

### 5. 部署

本项目配置了 Cloudflare Wrangler，可以通过以下命令部署：

```bash
npm run deploy
```

## 📂 目录结构

```
.
├── src/
│   ├── components/     # 通用组件及业务组件 (键盘, 练习引擎等)
│   ├── lib/            # 核心逻辑库 (拼音处理, 存储管理)
│   ├── pages/          # 页面视图 (练习页, 转换页, 错题页)
│   ├── worker/         # Cloudflare Worker 后端代码
│   └── App.tsx         # 路由配置与主应用
├── worker/             # 后端 API 实现
└── public/             # 静态资源
```

## 📄 许可证

MIT License
