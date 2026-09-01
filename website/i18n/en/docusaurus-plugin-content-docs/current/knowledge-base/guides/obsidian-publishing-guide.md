---
title: Publish knowledge articles with Obsidian
description: Write standard Markdown in Obsidian and publish it safely to the ZJ Technical Knowledge Base.
sidebar_position: 1
slug: obsidian-publishing-guide
category: guides
tags:
  - Obsidian
  - Markdown
  - publishing
---

The knowledge base reads Markdown files directly from its Git repository. You can write and link notes in Obsidian, then publish through the CMS or repository without converting them to a proprietary format.

## 1. Prepare the note

New articles use the `.md` extension and UTF-8 encoding. Start with this recommended front matter:

```yaml
title: Article title
description: One sentence explaining the problem the article solves.
sidebar_position: 10
```

See the [[reference/markdown-publishing-reference|Markdown publishing reference]] for the complete field conventions.

## 2. Connect related knowledge

Use standard Markdown links for external resources and Obsidian WikiLinks for other knowledge-base articles:

```md
Read the [[general/knowledge-base|knowledge base overview]] before this guide.
```

Use a content-root-relative document ID (`category/file-name`) as the WikiLink target. A file name alone is valid only for another article in the same directory. Optional display text follows the vertical bar. Confirm that the target article exists before publishing so the build does not contain broken links.

## 3. Add images

Store images in `website/static/img/uploads/` and use a site-absolute path in the article:

```md
![Workflow overview](/img/uploads/workflow-overview.png)
```

Use meaningful file names and alternative text. Never commit credentials, access tokens, customer data, or screenshots containing sensitive information to the public repository.

## 4. Choose a publishing path

- **CMS**: open `/admin/`, authorize with GitHub, then create or edit an article. This path supports normal content maintenance and image uploads.
- **Git workflow**: edit the knowledge-base directories directly, run validation and production builds, then commit the result. This works well for bulk or engineering-led changes.
- **Cursor Skill**: use the repository publishing Skill to validate destination paths, front matter, WikiLinks, and images before producing a reviewable Git change.

## 5. Check before publishing

1. The title and description are accurate and contain no test placeholders.
2. The file is in the correct category and follows the front matter contract.
3. WikiLinks and image paths resolve.
4. The Chinese source has an English translation with the same document ID and directory structure.
5. Local validation, type checking, and the multilingual production build pass.

After these checks, the article can appear in navigation, the sitemap, and the document knowledge graph. Return to the [[general/knowledge-base|ZJ Technical Knowledge Base]] for the overall content scope.
