---
name: publish-project-knowledge
description: Turn explicitly selected documentation, notes, or code from any current project into a reviewed knowledge-base article, transfer it to the configured zj75968-cpu/docusaurus checkout, and hand off to that repository's publish-knowledge-base workflow. Use outside the knowledge-base repository when the user asks to extract, document, transfer, publish, or 沉淀 project knowledge to kb.n8nmydomain.com.
---

<!-- managed-by: zj75968-cpu/docusaurus publish-project-knowledge -->

# Publish Project Knowledge

Use this global Skill as a cross-project intake layer. It extracts reusable knowledge from the current project and transfers an approved draft to the configured knowledge-base checkout. The repository-level `publish-knowledge-base` Skill remains the only authority for validation, Git, Vercel deployment, and live-site verification.

There is no Skill function-call API. “Hand off” means resolving the repository, changing context to that repository, reading its `.cursor/skills/publish-knowledge-base/SKILL.md` in full, and following it exactly.

## 1. Establish intent and protect the source project

Treat the current project as read-only unless the user separately requests source-project edits. Record its existing Git status when it is a repository, but do not stage, commit, clean, reset, or otherwise modify it as part of publishing knowledge.

Use only files the user explicitly selects, names, pastes, or attaches. Do not recursively ingest the project. Never read likely secret stores such as `.env*`, credential files, private keys, token stores, `.vercel/`, or local editor/session data.

Before drafting, determine:

- source files or selected code;
- Chinese source, English translation, or both;
- target reader and the task they should accomplish;
- category: `general`, `guides`, or `reference`;
- lowercase hyphenated slug;
- new article or update to an existing article;
- images that are necessary and safe to publish;
- whether the user has explicitly authorized a Vercel **production deployment** in this request.

Ask only for missing decisions that materially change the article or destination. Publishing language alone is not production-deployment authorization.

## 2. Resolve the configured knowledge-base repository

The installer stores only a local repository path outside Git. `KNOWLEDGE_BASE_REPOSITORY` may override that path after a checkout is moved.

From any project, resolve and validate the destination with the installed script:

```powershell
$resolver = Join-Path $HOME '.cursor\skills\publish-project-knowledge\scripts\resolve-knowledge-base.ps1'
if (-not (Test-Path -LiteralPath $resolver -PathType Leaf)) {
  throw "Global Skill installation is incomplete. Re-run its installer from the knowledge-base repository."
}

$knowledgeBaseRoot = & $resolver
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($knowledgeBaseRoot | Out-String))) {
  throw "Unable to resolve the configured knowledge-base repository."
}
$knowledgeBaseRoot = (($knowledgeBaseRoot | Select-Object -First 1) -as [string]).Trim()
```

The resolver fails closed unless the path is the Git root, contains the repository-level Skill, and has a `fork` push remote for `zj75968-cpu/docusaurus`. Do not search drives, guess a path, or fall back to the current project.

## 3. Extract a publishable article

Convert implementation details into durable, user-facing knowledge:

1. State the reader's goal and expected outcome.
2. Put prerequisites before actions.
3. Explain the minimum concepts needed to make the steps understandable.
4. Use ordered steps for procedures and include copyable examples with placeholders, never real credentials.
5. End with an observable verification or success condition.
6. Preserve technical accuracy, but omit private implementation details and large source-code dumps that are unnecessary for the reader.

Do not publish:

- secrets, tokens, passwords, private keys, cookies, OAuth values, or environment-variable values;
- internal-only domains, private IPs, user names, machine-specific absolute paths, or customer data;
- source comments or logs that reveal credentials or private infrastructure;
- generated, licensed, or third-party content without a clear right and reason to publish;
- claims that cannot be verified from the selected source or user confirmation.

Before transfer, inspect the draft and images for credential-like assignments, authorization headers, private URLs/IPs, home directories, and identifying data. Redact with explicit placeholders such as `<token>` or `<project-path>`. If safety is uncertain, stop and ask the user rather than copying the material.

Use UTF-8 `.md`, not `.mdx`. New Chinese source articles use front matter like:

```yaml
---
title: Clear user-facing title
description: One concise sentence explaining what the reader will accomplish.
slug: lowercase-hyphenated-slug
category: general
sidebar_position: 100
tags:
  - relevant-tag
---
```

Do not invent an English-only document ID. When publishing an English translation, create or identify the matching Chinese source first and keep the same category, slug, and relative path. A Chinese source article may be published before its translation is ready.

When the draft uses WikiLinks, use the target slug only for a document in the same directory. Cross-category links must use the knowledge-base-root-relative document ID (`<category>/<slug>`), without the internal `knowledge-base/` prefix. Labels remain optional:

```markdown
[[knowledge-base]] [[general/knowledge-base|Knowledge Base overview]] [[guides/getting-started|Getting started]]
```

The target must exist in the same locale. Do not use WikiLinks for images or assume an unresolved target will become valid during deployment.

## 4. Review before writing across repositories

Present the user with:

- proposed title, description, language, category, slug, and destination relative path;
- a concise article outline or full draft;
- images to copy and their sanitized destination names;
- any redactions or omitted implementation details;
- whether the workflow will stop after `fork/main` or has explicit production-deployment authorization.

Obtain confirmation before creating a new destination article or replacing an existing one unless the user's current message already approves the exact draft and destination. Existing files require a before/after diff and explicit review; never silently overwrite them.

## 5. Build safe destination paths

Use only these roots inside the resolved repository:

| Content | Root |
| --- | --- |
| Chinese source | `website/docs/knowledge-base/` |
| English translation | `website/i18n/en/docusaurus-plugin-content-docs/current/knowledge-base/` |
| Images | `website/static/img/uploads/` |

Validate destination containment before writing. For example:

```powershell
$category = '<general-or-guides-or-reference>'
$slug = '<lowercase-hyphenated-slug>'
$contentRoot = Join-Path $knowledgeBaseRoot 'website\docs\knowledge-base'
$destination = [IO.Path]::GetFullPath((Join-Path $contentRoot "$category\$slug.md"))
$allowedPrefix = [IO.Path]::GetFullPath($contentRoot).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
if (-not $destination.StartsWith($allowedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Article destination escapes the knowledge-base content root."
}
```

Reject `..`, rooted slug/category values, unsupported categories, non-`.md` articles, and slugs outside `^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$`. Use descriptive lowercase image filenames, preserve only a necessary safe extension, and fail on an existing image unless the user reviewed the replacement.

Write only the confirmed article and necessary images. Convert image references to standard Markdown paths such as `/img/uploads/example.png`; never use `![[image]]`. After writing, report the exact repository-relative files changed.

## 6. Hand off to the repository-level publisher

Switch context to the resolved repository and read the downstream Skill in full:

```powershell
Set-Location -LiteralPath $knowledgeBaseRoot
$repositorySkill = Join-Path $knowledgeBaseRoot '.cursor\skills\publish-knowledge-base\SKILL.md'
if (-not (Test-Path -LiteralPath $repositorySkill -PathType Leaf)) {
  throw "Repository-level publish-knowledge-base Skill is missing."
}
Get-Content -LiteralPath $repositorySkill -Raw
```

Follow that Skill as the authoritative workflow. In particular:

- protect pre-existing destination-repository changes;
- run its repository validator, formatting, typecheck, and Chinese/English production builds;
- review and stage only the transferred article and images;
- obey the Git hook and commit attribution requirements;
- verify the remote and push only to `fork/main`, never `origin`;
- treat a successful Git push as **not deployed**, because automatic Vercel Git deployment is not connected;
- execute manual Vercel production deployment only when this request explicitly authorizes it;
- when deployment is authorized, require Vercel project inspection, deployment inspection, live HTTP checks, and distinctive article-content verification.

Any extraction, safety review, destination conflict, validation, build, hook, push, deploy, inspect, HTTP, or content-verification failure stops the workflow. Report the publication as incomplete; never convert a partial result into success.

## 7. Report the result

State:

- source material used without exposing sensitive content;
- destination article and image paths;
- validation and build results;
- commit hash and `fork/main` push result;
- whether production deployment was authorized;
- deployment URL and stable live article URL only after full deployment verification;
- otherwise, explicitly say that no production deployment was run.

## Install or update on another computer

Clone or update the knowledge-base repository first, configure its `fork/main`, and run this from its Git root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\cursor-skills\install-publish-project-knowledge.ps1"
```

Reload Cursor, then invoke `/publish-project-knowledge` from any project. Each computer must provide its own Git/GitHub authentication and, before production deployment, its own Vercel login and link to the existing project. No credentials are copied by the installer.
