---
name: publish-knowledge-base
description: Publish or update this repository's English or Simplified Chinese knowledge-base articles from Markdown or Obsidian through validation, a scoped Git commit and fork/main push, and an explicitly authorized manual Vercel production deployment. Use for requests to create, edit, translate, upload, validate, publish, deploy, or troubleshoot files under website/docs/knowledge-base, the matching zh-CN knowledge-base translation tree, or website/static/img/uploads.
---

# Publish the Knowledge Base

Follow this workflow from preparation through verification. Stop at the first failed check and report the exact failure. Never discard unrelated changes, expose credentials, skip a Git hook, push to `origin`, or claim a deployment succeeded without inspecting it and checking the live site.

## 1. Establish repository context

Run every command from the Git repository root. Do not depend on the clone's absolute path.

```powershell
$repoRoot = (git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) { throw "Not inside a Git repository." }
Set-Location -LiteralPath $repoRoot

git status --short --branch
git diff --stat
git diff --cached --stat
```

Before editing:

- Read `AGENTS.md` and obey its commit-message requirements.
- Confirm the active branch is `main`, its upstream is `fork/main`, and `fork` is this repository while `origin` is upstream Docusaurus:

```powershell
if ((git branch --show-current).Trim() -ne "main") { throw "Publish only from main." }
if ((git rev-parse --abbrev-ref --symbolic-full-name '@{u}').Trim() -ne "fork/main") { throw "main must track fork/main." }

$forkPushUrl = (git remote get-url --push fork).Trim()
if ($forkPushUrl -notmatch '^(https://github\.com/zj75968-cpu/docusaurus(?:\.git)?|git@github\.com:zj75968-cpu/docusaurus(?:\.git)?)$') {
  throw "fork does not point to zj75968-cpu/docusaurus."
}

git remote -v
```

Treat all pre-existing modifications as user-owned. Record them, edit only requested articles/images, never run destructive cleanup or reset commands, and never stage with `git add .`.

## 2. Check a new computer once

The Skill travels with the repository under `.cursor/skills/`; cloning or pulling the repository installs its instructions. Each computer still needs its own local authentication and project context:

1. Install a Node.js version allowed by the root `package.json` and ensure `node`, `npm`, `npx`, and `git` are available.
2. Configure Git identity and authentication. If GitHub CLI is used, run `gh auth status` and complete `gh auth login` when needed; never print or store credentials in repository files.
3. Confirm or create the `fork` remote, then ensure local `main` tracks `fork/main`:

   ```powershell
   git remote -v
   # Run only when the fork remote is absent:
   git remote add fork https://github.com/zj75968-cpu/docusaurus.git
   git branch --set-upstream-to=fork/main main
   ```

4. Install locked dependencies from the repository root. A global pnpm installation is not required:

   ```powershell
   npx --yes pnpm@11.10.0 install --frozen-lockfile
   if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }
   ```

5. Before a Vercel operation, authenticate and interactively link this checkout to the existing project from the repository root. Select the existing `docusaurus-knowledge-base` project; do not create a replacement:

   ```powershell
   npx --yes vercel@59.1.4 login
   if ($LASTEXITCODE -ne 0) { throw "Vercel login failed." }

   npx --yes vercel@59.1.4 link
   if ($LASTEXITCODE -ne 0) { throw "Vercel project linking failed." }

   git check-ignore -v .vercel
   if ($LASTEXITCODE -ne 0) { throw ".vercel must remain ignored." }

   npx --yes vercel@59.1.4 project inspect --non-interactive
   if ($LASTEXITCODE -ne 0) { throw "Unable to verify the linked Vercel project." }
   ```

Inspect the reported owner and project before continuing. `.vercel/` is local context and must never be committed. Do not embed account IDs, project IDs, access tokens, OAuth values, or environment-variable values in this Skill or in content.

## 3. Prepare the article and media

Use UTF-8 standard Markdown (`.md`), never `.mdx`, for knowledge-base articles.

| Content | Repository-relative location |
| --- | --- |
| English source | `website/docs/knowledge-base/<category>/<slug>.md` |
| Simplified Chinese translation | `website/i18n/zh-CN/docusaurus-plugin-content-docs/current/knowledge-base/<category>/<slug>.md` |
| Uploaded media | `website/static/img/uploads/<descriptive-name>.<ext>` |

`<category>` must be `general`, `guides`, or `reference`. Use a lowercase, hyphenated `<slug>` and make the filename, `slug`, and route segment identical. A Chinese document is a translation with the same relative path/document ID as its English source; create the English file first. Do not create an independent Chinese-only document in this translation tree.

Use this front matter for new articles:

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

Requirements:

- `title`, `description`, and `sidebar_position` are required; `sidebar_position` is a positive integer.
- New CMS-compatible articles also require `slug` and `category` as shown above.
- Keep the page title in front matter. Existing knowledge-base pages start body headings at `##`; do not duplicate the title with an extra `#` heading.
- Write for the reader's goal, not the implementation. Lead with what the page enables, use short sections and ordered steps for procedures, state prerequisites before actions, and include an observable success condition.
- Prefer stable wording over time-sensitive claims. Match the nearest article's terminology and structure instead of inventing a new convention.
- Use fenced code blocks with the correct language and commands the reader can copy. Never place real secrets, tokens, private URLs, or machine-specific absolute paths in prose or examples.
- Use descriptive link text. Prefer repository-relative Markdown document links ending in `.md`; let the build verify rendered routes.

### Images

Copy images to `website/static/img/uploads/` with descriptive lowercase filenames, then reference them with standard Markdown and useful alternative text:

```markdown
![Knowledge graph view](/img/uploads/knowledge-graph-view.png)
```

Do not use Obsidian image embeds such as `![[image.png]]`; the site supports standard Markdown images. Verify every local image exists and avoid committing editor metadata such as `.obsidian/`.

### WikiLinks

The docs plugin resolves WikiLinks and adds them to the knowledge graph. Use targets relative to the current document, optionally with a label:

```markdown
[[knowledge-base]] [[knowledge-base|Knowledge Base overview]] [[../guides/getting-started|Getting started]]
```

The target must resolve to an existing knowledge-base `.md` document in the same locale. Do not target `.mdx`, do not use WikiLinks for images, and do not assume an unresolved WikiLink will become valid at deploy time.

## 4. Validate before staging

Run the repository-specific validator from the root. It checks UTF-8, `.md` paths, required front matter, category/slug consistency, Chinese-to-English document identity, local images, local Markdown document links, WikiLinks, and unsupported Obsidian image embeds.

```powershell
node .cursor/skills/publish-knowledge-base/scripts/validate.mjs
if ($LASTEXITCODE -ne 0) { throw "Knowledge-base validation failed." }
```

Format only changed publish files and verify formatting. Build the changed-file list explicitly so unrelated work is not modified:

```powershell
$publishFiles = @(
  git diff --name-only --diff-filter=ACMR
  git diff --cached --name-only --diff-filter=ACMR
  git ls-files --others --exclude-standard
) | Where-Object {
  $_ -match '^(website/docs/knowledge-base/|website/i18n/zh-CN/docusaurus-plugin-content-docs/current/knowledge-base/|website/static/img/uploads/|\.cursor/skills/publish-knowledge-base/)'
} | Sort-Object -Unique

if ($publishFiles.Count -eq 0) { throw "No knowledge-base publish files found." }

$formatFiles = @($publishFiles | Where-Object { $_ -match '\.(md|mjs|yml|yaml)$' })
if ($formatFiles.Count -eq 0) { throw "No text files found to format." }

npx --yes pnpm@11.10.0 exec oxfmt --write $formatFiles
if ($LASTEXITCODE -ne 0) { throw "Formatting failed." }

npx --yes pnpm@11.10.0 exec oxfmt --list-different $formatFiles
if ($LASTEXITCODE -ne 0) { throw "Formatting verification failed." }

git diff --check
if ($LASTEXITCODE -ne 0) { throw "Git whitespace validation failed." }
```

Run the quick repository check:

```powershell
npx --yes pnpm@11.10.0 --filter website typecheck
if ($LASTEXITCODE -ne 0) { throw "Website typecheck failed." }
```

Before publishing content, run both production locale builds. These are authoritative for Docusaurus document resolution, WikiLink transforms, and knowledge-graph generation:

```powershell
npx --yes pnpm@11.10.0 build:website:en
if ($LASTEXITCODE -ne 0) { throw "English production build failed." }

npx --yes pnpm@11.10.0 --filter website build --locale zh-CN
if ($LASTEXITCODE -ne 0) { throw "Simplified Chinese production build failed." }
```

Do not skip a failed build because a document looks correct in Obsidian. If dependencies are missing, run the locked install from section 2 and rerun the failed check.

## 5. Commit only the publication

Review the exact files and content before staging:

```powershell
git status --short
git diff -- $publishFiles
```

Set `$publishFiles` only to the requested article, matching translation, and used images. Include Skill files only when the task itself changes this publishing workflow. Then stage by explicit path:

```powershell
git add -- $publishFiles
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "Staged whitespace validation failed." }

git diff --cached --name-status
git diff --cached
```

Confirm that the staged set contains no unrelated files, `.vercel/`, `.obsidian/`, environment files, credentials, or generated build output. Commit messages must describe the publication and include `(AI-assisted)` as required by `AGENTS.md`:

```powershell
git commit -m "docs(knowledge-base): publish <article> (AI-assisted)"
if ($LASTEXITCODE -ne 0) { throw "Commit or pre-commit hook failed." }
```

The hook runs `pnpm lint-staged`; never use `--no-verify`. On Windows without global pnpm, make pnpm available to the hook through `npx`:

```powershell
npx --yes --package=pnpm@11.10.0 -- git commit -m "docs(knowledge-base): publish <article> (AI-assisted)"
if ($LASTEXITCODE -ne 0) { throw "Commit or pre-commit hook failed." }
```

Use one commit command, not both. If the hook fails or changes files, inspect the worktree and index, fix the cause, restage explicit paths, and create a new commit attempt. Do not amend a failed commit.

## 6. Push only to `fork/main`

Re-run all branch and remote checks from section 1 immediately before pushing. Fetch the destination and stop if the local branch is behind or has diverged; do not force push.

```powershell
git fetch fork main
if ($LASTEXITCODE -ne 0) { throw "Unable to fetch fork/main." }

$behind = [int](git rev-list --count HEAD..fork/main).Trim()
if ($behind -ne 0) { throw "Local main is behind or diverged from fork/main." }

if ((git branch --show-current).Trim() -ne "main") { throw "Publish only from main." }
if ((git remote get-url --push fork).Trim() -ne $forkPushUrl) { throw "fork push URL changed." }

git push fork main:main
if ($LASTEXITCODE -ne 0) { throw "Push to fork/main failed." }

git fetch fork main
if ((git rev-parse HEAD).Trim() -ne (git rev-parse fork/main).Trim()) {
  throw "Local HEAD and fork/main do not match after push."
}
git status --short --branch
```

Never push this repository to `origin`. A successful push does **not** deploy the site because the Vercel Git integration is not connected.

## 7. Deploy only with explicit production authorization

If the current user request does not explicitly authorize a production deployment, stop after the push and say that no deployment was run. Do not infer deployment authorization merely from editing or publishing terminology.

When production deployment is explicitly authorized, repeat the Vercel project inspection from the repository root and verify the reported owner/project. Then deploy the committed checkout manually:

```powershell
npx --yes vercel@59.1.4 project inspect --non-interactive
if ($LASTEXITCODE -ne 0) { throw "Vercel project verification failed." }

$deploymentOutput = npx --yes vercel@59.1.4 deploy --prod --yes --archive=tgz
if ($LASTEXITCODE -ne 0) { throw "Production deployment failed." }

$deploymentUrl = @(
  $deploymentOutput | Select-String -AllMatches -Pattern 'https://[^\s]+' |
    ForEach-Object { $_.Matches.Value } |
    Where-Object { $_ -match '\.vercel\.app/?$' }
) | Select-Object -Last 1
if (-not $deploymentUrl) { throw "Deployment returned no inspectable URL." }
$deploymentUrl
```

A timeout, upload error, or `fetch failed` is a failure even if a URL was printed. Do not retry blindly and do not report success. First reconcile the actual state with read-only commands:

```powershell
npx --yes vercel@59.1.4 ls docusaurus-knowledge-base
if ($LASTEXITCODE -ne 0) { throw "Unable to list Vercel deployments." }

npx --yes vercel@59.1.4 inspect "$deploymentUrl" --wait --timeout 4m
if ($LASTEXITCODE -ne 0) { throw "Deployment did not reach a verified ready state." }
```

Ensure `ls` contains the new production deployment and `inspect` reports the intended project and a ready production deployment before checking the public site.

## 8. Verify live URLs and content

After `inspect` succeeds, verify the stable domain rather than only the generated deployment URL:

```powershell
$requiredUrls = @(
  "https://kb.n8nmydomain.com/",
  "https://kb.n8nmydomain.com/docs",
  "https://kb.n8nmydomain.com/zh-CN/",
  "https://kb.n8nmydomain.com/admin"
)

foreach ($url in $requiredUrls) {
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing
  if ($response.StatusCode -ne 200) { throw "$url returned HTTP $($response.StatusCode)." }
}
```

Derive article URLs from the validated category and slug:

- English: `https://kb.n8nmydomain.com/docs/knowledge-base/<category>/<slug>`
- Simplified Chinese, when a translation was published: `https://kb.n8nmydomain.com/zh-CN/docs/knowledge-base/<category>/<slug>`

Request each published article URL, require HTTP 200, and assert that the response contains a distinctive new title or sentence:

```powershell
$articleUrl = "https://kb.n8nmydomain.com/docs/knowledge-base/<category>/<slug>"
$expectedText = "<distinctive published text>"
$articleResponse = Invoke-WebRequest -Uri $articleUrl -UseBasicParsing
if ($articleResponse.StatusCode -ne 200) { throw "$articleUrl returned HTTP $($articleResponse.StatusCode)." }
if ($articleResponse.Content -notmatch [regex]::Escape($expectedText)) {
  throw "The live article does not contain the expected publication marker."
}
```

Finish by reporting the committed files, commit hash, `fork/main` push result, deployment URL and inspected state when deployment was authorized, and every live URL checked. If any validation, hook, push, deployment, inspect, HTTP, or content assertion fails, stop and report the publication as incomplete.
