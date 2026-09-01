---
title: 使用 Obsidian 发布知识文章
description: 从 Obsidian 编写标准 Markdown，并安全发布到 ZJ 技术知识库。
sidebar_position: 1
slug: obsidian-publishing-guide
category: guides
tags:
  - Obsidian
  - Markdown
  - 发布流程
---

知识库直接使用 Git 仓库中的 Markdown 文件。你可以在 Obsidian 中完成写作和链接，再通过 CMS 或仓库发布，不需要转换成专用格式。

## 1. 准备笔记

新文章应使用 `.md` 扩展名和 UTF-8 编码。推荐从以下 Front Matter 开始：

```yaml
title: 文章标题
description: 用一句话说明文章解决的问题。
sidebar_position: 10
```

完整字段约定见 [[reference/markdown-publishing-reference|Markdown 发布规范]]。

## 2. 建立连接

使用标准 Markdown 链接引用外部资源，使用 Obsidian WikiLink 连接知识库中的其他文章：

```md
先阅读 [[general/knowledge-base|知识库说明]]，再继续本指南。
```

WikiLink 的目标使用内容根目录相对的文档 ID（`分类/文件名`）；仅链接同目录文章时可以只写文件名。显示文字放在竖线后。发布前应确认目标文章真实存在，避免构建时出现断链。

## 3. 添加图片

图片统一保存到 `website/static/img/uploads/`，文章中使用站点绝对路径：

```md
![工作流示意图](/img/uploads/workflow-overview.png)
```

使用有意义的文件名和替代文字。不要把凭据、访问令牌、客户数据或包含敏感信息的截图提交到公开仓库。

## 4. 选择发布方式

- **CMS**：访问 `/admin/`，使用 GitHub 授权后新建或编辑文章，适合常规内容维护和图片上传。
- **Git 工作流**：直接编辑知识库目录，运行校验和构建后提交，适合批量修改或工程化发布。
- **Cursor Skill**：通过项目内发布 Skill 校验目标路径、Front Matter、WikiLink 和图片引用，再生成可审查的 Git 变更。

## 5. 发布前检查

1. 标题和描述准确，不包含“测试”“临时”一类占位信息。
2. 文件位于正确分类，Front Matter 符合规范。
3. WikiLink 和图片路径可以解析。
4. 中文源文章有对应英文翻译，文档 ID 与目录结构保持一致。
5. 本地校验、类型检查和多语言生产构建通过。

完成这些检查后，文章会进入侧边栏、站点地图与文档知识图谱。知识库的整体边界可回到 [[general/knowledge-base|ZJ 技术知识库]] 查看。
