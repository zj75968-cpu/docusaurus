---
title: Markdown publishing reference
description: Front matter, links, images, and directory conventions for ZJ knowledge-base articles.
sidebar_position: 1
slug: markdown-publishing-reference
category: reference
tags:
  - Markdown
  - reference
  - publishing
---

This reference defines the stable publishing contract for knowledge-base articles. Chinese source files live in `website/docs/knowledge-base/`; English translations live in `website/i18n/en/docusaurus-plugin-content-docs/current/knowledge-base/`.

## Directory contract

| Category | Chinese source directory | Purpose |
| --- | --- | --- |
| Start here | `general/` | Site scope, navigation, and foundational information |
| Guides | `guides/` | Practical workflows that can be followed step by step |
| Reference | `reference/` | Fields, commands, interfaces, and durable conventions |

Chinese and English files use the same relative path and file name. This preserves the document ID and keeps language switching on the corresponding article.

## Front matter

Recommended fields:

```yaml
title: A clear, specific article title
description: One sentence describing the content and reader outcome.
sidebar_position: 10
slug: stable-url-segment
tags:
  - topic
```

- `title`, `description`, and `sidebar_position` are the recommended required fields.
- Keep a published `slug` stable. Omit it when no custom URL is needed.
- Tags describe durable topics; do not use `test`, `draft`, or a date as a production tag.
- Never store tokens, secrets, or other sensitive values in front matter.

## Markdown and links

Articles support standard Markdown, MDX features, math, Mermaid, and Obsidian WikiLinks. Prefer these forms for internal knowledge connections:

```md
[[general/knowledge-base|Knowledge base overview]] [[guides/obsidian-publishing-guide|Obsidian publishing guide]]
```

Use standard Markdown links for site pages and external resources. A WikiLink in the same directory may use only the file name. Cross-category targets must use a content-root-relative document ID (`category/file-name`), and every target must exist.

## Images

Upload images to `website/static/img/uploads/` and reference them through `/img/uploads/...`. Use lowercase English letters, numbers, and hyphens in file names. Remove personal data and credentials from screenshots before committing them.

## Bilingual publishing

Chinese is the default language and uses `/docs/...`; English translations use `/en/docs/...`. An English file is a translation, not an independent source article, so it must not change the file name, slug, or directory hierarchy. If a translation is not ready, publish only the Chinese source rather than using machine-generated placeholder copy.

For the complete workflow, read the [[general/knowledge-base|ZJ Technical Knowledge Base]] and the [[guides/obsidian-publishing-guide|Obsidian publishing guide]].
