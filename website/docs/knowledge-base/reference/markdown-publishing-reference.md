---
title: Markdown 发布规范
description: ZJ 技术知识库文章的 Front Matter、链接、图片与目录约定。
sidebar_position: 1
slug: markdown-publishing-reference
category: reference
tags:
  - Markdown
  - 参考
  - 发布流程
---

本文定义知识库文章的稳定发布约定。中文原文位于 `website/docs/knowledge-base/`，英文翻译位于 `website/i18n/en/docusaurus-plugin-content-docs/current/knowledge-base/`。

## 目录约定

| 分类 | 中文源目录   | 用途                       |
| ---- | ------------ | -------------------------- |
| 开始 | `general/`   | 知识库定位、导航和基础说明 |
| 指南 | `guides/`    | 可以按步骤执行的实践流程   |
| 参考 | `reference/` | 字段、命令、接口和长期约定 |

中英文文件应使用相同的相对路径和文件名，从而共享文档 ID，并让语言切换保持在对应文章。

## Front Matter

推荐字段如下：

```yaml
title: 清晰、具体的文章标题
description: 一句话说明文章内容与读者收益。
sidebar_position: 10
slug: stable-url-segment
tags:
  - 主题
```

- `title`、`description` 和 `sidebar_position` 是推荐必填字段。
- `slug` 一旦公开应保持稳定；不需要自定义 URL 时可以省略。
- 标签应描述长期主题，不使用 `test`、`draft` 或日期作为正式标签。
- 不要在 Front Matter 中保存令牌、密钥或其他敏感信息。

## Markdown 与链接

文章支持标准 Markdown、MDX 功能、数学公式、Mermaid 和 Obsidian WikiLink。内部知识连接优先使用：

```md
[[general/knowledge-base|知识库说明]] [[guides/obsidian-publishing-guide|Obsidian 发布指南]]
```

普通站点页面或外部资源使用标准 Markdown 链接。WikiLink 同目录目标可只写文件名；跨分类目标必须使用内容根目录相对的文档 ID（`分类/文件名`），并且目标必须真实存在。

## 图片

上传图片到 `website/static/img/uploads/`，并在文档中使用 `/img/uploads/...` 路径。文件名使用小写英文、数字和连字符，提交前移除截图中的个人信息和凭据。

## 双语发布

中文是默认语言，公开路径位于 `/docs/...`；英文翻译位于 `/en/docs/...`。英文文件不是独立源文章，不应改变文件名、slug 或目录层级。仅有中文内容时可以先不提供英文翻译，但不得用机器占位文本冒充已完成翻译。

首次发布建议先阅读 [[general/knowledge-base|ZJ 技术知识库]] 与 [[guides/obsidian-publishing-guide|Obsidian 发布指南]]。
