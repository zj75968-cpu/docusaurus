# ZJ 技术知识库

[ZJ 技术知识库](https://kb.n8nmydomain.com/) 是一个默认中文、提供英文翻译的实践型知识站点，长期整理 AI 自动化、软件工程、n8n、知识管理与开源经验。本仓库基于 Docusaurus monorepo 定制，包含 Markdown/Obsidian 写作、WikiLink、知识图谱、Decap CMS、安全 GitHub OAuth 和跨项目发布流程。

## 线上入口

- [中文首页](https://kb.n8nmydomain.com/)
- [中文知识库](https://kb.n8nmydomain.com/docs/knowledge-base/general/knowledge-base)
- [English site](https://kb.n8nmydomain.com/en/)
- [English knowledge base](https://kb.n8nmydomain.com/en/docs/knowledge-base/general/knowledge-base)
- [Decap CMS](https://kb.n8nmydomain.com/admin/)

## 主要能力

- 使用标准 Markdown 维护中文源文章和同文档 ID 的英文翻译。
- 兼容 Obsidian 工作流及 `[[WikiLink]]` 文档链接。
- 根据文档链接生成知识图谱。
- 通过 Decap CMS 创建、编辑和管理知识库内容及图片。
- 通过服务端 GitHub OAuth API 为 CMS 提供认证。
- 使用仓库级 Skill 执行校验、构建、Git 发布和可选生产部署。
- 使用全局 Skill 从其他项目提取、审阅并沉淀可公开的知识。

CMS 只管理 Knowledge Base，不用于维护整套 Docusaurus 上游文档。

## 上游关系

本仓库是 [`facebook/docusaurus`](https://github.com/facebook/docusaurus) 的定制 fork，仍包含上游的 packages、website、测试和构建系统：

- `fork`：[`zj75968-cpu/docusaurus`](https://github.com/zj75968-cpu/docusaurus)，本项目唯一允许推送的远程仓库。
- `origin`：[`facebook/docusaurus`](https://github.com/facebook/docusaurus)，只作为上游来源，禁止推送。

## 核心目录

| 路径 | 用途 |
| --- | --- |
| `website/docs/knowledge-base/` | 中文知识库源文档 |
| `website/i18n/en/docusaurus-plugin-content-docs/current/knowledge-base/` | 英文翻译文档 |
| `website/static/img/uploads/` | 知识库上传图片 |
| `website/static/admin/` | Decap CMS 页面和配置 |
| `api/_oauth.mjs` | OAuth 公共实现 |
| `api/auth.mjs` | GitHub OAuth 授权入口 |
| `api/callback.mjs` | GitHub OAuth 回调入口 |
| `api/_oauth.test.mjs` | OAuth Node.js 测试 |
| `.cursor/skills/publish-knowledge-base/` | 当前仓库的权威发布流程及校验器 |
| `tools/cursor-skills/publish-project-knowledge/` | 跨项目全局 Skill 的安装源 |
| `tools/cursor-skills/install-publish-project-knowledge.ps1` | 全局 Skill 安装器 |
| `vercel.json` | Vercel 构建和路由配置 |

## 本地开发

### 环境要求

- Node.js `>= 24.14`
- pnpm `>= 11.5`
- Git

以下示例固定使用 `pnpm@11.10.0`，因此 Windows 电脑不需要预先全局安装 pnpm。如果本机已有兼容版本，也可以把 `npx --yes pnpm@11.10.0` 替换为 `pnpm`。

### 安装依赖

在仓库根目录运行：

```powershell
npx --yes pnpm@11.10.0 install --frozen-lockfile
```

安装过程会构建 monorepo packages，首次执行可能需要一些时间。

### 启动开发站点

```powershell
npx --yes pnpm@11.10.0 start:website
```

### 类型检查与生产构建

```powershell
npx --yes pnpm@11.10.0 --filter website typecheck
npx --yes pnpm@11.10.0 --filter website build --locale zh-CN
npx --yes pnpm@11.10.0 --filter website build --locale en
```

中文和英文生产构建会验证文档解析、WikiLink 转换和知识图谱产物。发布文章前应同时运行两种语言的构建。

### 预览生产构建

```powershell
npx --yes pnpm@11.10.0 serve:website
```

### OAuth 测试

```powershell
node --test api/_oauth.test.mjs
```

### 知识库专用校验

```powershell
node .cursor/skills/publish-knowledge-base/scripts/validate.mjs
```

校验器会检查 UTF-8、文件扩展名、Front Matter、可选分类与 slug 的路径一致性、英文翻译与中文源文档的对应关系、本地图片、Markdown 链接、WikiLink，以及不受支持的 Obsidian 图片嵌入。

## 编写知识库文章

### 文件位置

中文源文章放在：

```text
website/docs/knowledge-base/<category>/<slug>.md
```

英文翻译放在：

```text
website/i18n/en/docusaurus-plugin-content-docs/current/knowledge-base/<category>/<slug>.md
```

`<category>` 只能是 `general`、`guides` 或 `reference`。`<slug>` 使用小写字母、数字和连字符，并与文件名保持一致。

知识库文章必须是 UTF-8 标准 Markdown `.md`，不要使用 `.mdx`。

### Front Matter

新文章推荐至少提供以下信息：

```yaml
---
title: 清晰的文章标题
description: 一句话说明文章内容与读者收益。
sidebar_position: 100
---
```

`title`、`description` 和 `sidebar_position` 是基础必填字段，`sidebar_position` 必须是正整数。通过 CMS 创建文章时还会写入 `slug` 与 `category`；它们必须分别匹配文件名和父目录。正文从 `##` 开始，不要重复写一个与 Front Matter 标题相同的 `#` 标题。

### 图片

图片统一放在 `website/static/img/uploads/`，使用描述性的小写文件名，并通过站点绝对路径引用：

```markdown
![知识图谱界面](/img/uploads/knowledge-graph-view.png)
```

不要提交 `.obsidian/` 元数据，也不要使用 Obsidian 的 `![[image.png]]` 图片语法。

### WikiLink

站点支持文档 WikiLink。同目录文章可使用 slug；跨分类链接使用知识库内容根目录相对的文档 ID（`<category>/<slug>`）：

```markdown
[[knowledge-base]] [[general/knowledge-base|知识库概览]] [[guides/getting-started|开始使用]]
```

目标必须是同一语言下已经存在的知识库 `.md` 文档。图片仍需使用标准 Markdown 语法。

### 中英文规则

中文是默认语言，`website/docs/knowledge-base/` 是唯一源内容树，对应公开路径 `/docs/...`。英文位于 Docusaurus 的 `en` 翻译树，对应 `/en/docs/...`。

英文翻译必须有相同相对路径和 document ID 的中文源文档，并保持分类、文件名和 slug 一致。中文源文章可以在英文翻译完成前独立发布；不要在英文翻译树中创建没有中文来源的文章，也不要使用占位机器翻译冒充完成内容。

## 内容管理与 OAuth

Decap CMS 位于 `/admin`，配置文件为 `website/static/admin/config.yml`。它通过以下服务端入口完成 GitHub OAuth：

- `/api/auth`
- `/api/callback`

OAuth 凭据只应保存在 Vercel Production 环境变量中。禁止把 GitHub Client Secret、OAuth token、Vercel token、cookie 或其他凭据写入文章、配置示例、日志或 Git 历史。

## 发布 Skills

### 仓库级 `publish-knowledge-base`

在本仓库中，可通过 Cursor 的 `/publish-knowledge-base` 使用 `.cursor/skills/publish-knowledge-base/SKILL.md`。这是知识库发布流程的唯一权威层，负责：

1. 检查仓库、分支、远程地址和已有工作区改动。
2. 准备文章、翻译和图片。
3. 运行知识库校验、格式化、类型检查及中英文生产构建。
4. 只暂存本次发布文件，执行 Git hook 后提交。
5. 只推送到 `fork/main`。
6. 仅在用户明确授权生产部署后执行 Vercel 手工部署和线上验证。

任何校验、构建、Git hook、推送、部署或线上验证失败都会中止流程。发布内容不等于自动授权生产部署。

### 全局 `publish-project-knowledge`

从知识库仓库根目录安装或更新全局 Skill：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\cursor-skills\install-publish-project-knowledge.ps1
```

重新加载 Cursor 后，可以在任意项目中调用 `/publish-project-knowledge`。该流程会：

1. 只读取用户明确选择的文档、笔记或代码。
2. 检查并移除不适合公开的凭据、内部地址和本机路径。
3. 整理知识库草稿，并在跨仓库写入前让用户审阅。
4. 通过本地配置解析知识库仓库位置。
5. 复制确认后的文章和必要图片。
6. 把后续校验、Git 和可选部署交给仓库级 `publish-knowledge-base`。

安装器只保存知识库仓库路径，不复制或保存凭据。

### 在另一台电脑安装

```powershell
git clone -o fork https://github.com/zj75968-cpu/docusaurus.git
Set-Location .\docusaurus
git remote add origin https://github.com/facebook/docusaurus.git
git branch --set-upstream-to=fork/main main
npx --yes pnpm@11.10.0 install --frozen-lockfile
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\cursor-skills\install-publish-project-knowledge.ps1
```

另一台电脑需要自行配置 Git/GitHub 认证。若需要生产部署，还必须自行登录 Vercel，并把仓库链接到已有项目；不要把认证数据复制进仓库。

## Git 安全边界

- 开始修改前先运行 `git status --short --branch`，保护所有已有改动。
- `main` 必须跟踪 `fork/main`。
- 只按明确路径暂存本次文件，不使用 `git add .` 混入无关内容。
- 只允许 `git push fork main:main`。
- 禁止向 `origin` 推送，禁止 force push，禁止绕过 Git hook。
- `.env*`、`.vercel/`、`.obsidian/`、凭据和生成的构建产物不得进入提交。

## Vercel 手工生产部署

当前未连接 Vercel Git 自动部署；推送到 `fork/main` 不会自动发布站点。生产部署必须得到用户在当前请求中的明确授权，并从已正确 link 的仓库根目录手工执行。

先核对已链接的 Vercel 项目：

```powershell
npx --yes vercel@59.1.4 project inspect --non-interactive
```

获得授权后执行生产部署，并保存 CLI 返回的 deployment URL：

```powershell
npx --yes vercel@59.1.4 deploy --prod --yes --archive=tgz
```

用实际 URL 等待并检查部署状态：

```powershell
npx --yes vercel@59.1.4 inspect "<deployment-url>" --wait --timeout 4m
```

必要时列出项目部署记录进行交叉确认：

```powershell
npx --yes vercel@59.1.4 ls docusaurus-knowledge-base
```

命令出现超时、上传错误或 `fetch failed` 时，不能直接判断部署成功或失败。必须通过 `ls`、`inspect` 和线上 HTTP 结果核对实际状态。确认部署 Ready 后，再验证以下稳定地址及本次文章页面：

- `https://kb.n8nmydomain.com/`
- `https://kb.n8nmydomain.com/en/`
- `https://kb.n8nmydomain.com/docs/knowledge-base/general/knowledge-base`
- `https://kb.n8nmydomain.com/en/docs/knowledge-base/general/knowledge-base`
- `https://kb.n8nmydomain.com/admin/`
- `https://kb.n8nmydomain.com/robots.txt`
- `https://kb.n8nmydomain.com/sitemap.xml`

## 许可证与归属

本 fork 基于 Meta 开源的 Docusaurus，并保留其上游归属：

- Docusaurus 源代码使用 [MIT License](./LICENSE)。
- Docusaurus 上游文档内容使用 [Creative Commons License](./LICENSE-docs)。

有关 Docusaurus 框架本身的开发、贡献和社区信息，请访问[上游仓库](https://github.com/facebook/docusaurus)与[官方文档](https://docusaurus.io/docs)。
