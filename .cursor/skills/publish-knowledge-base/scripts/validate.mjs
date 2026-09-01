/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {TextDecoder} from 'node:util';

const CONTENT_ROOTS = [
  {
    locale: 'zh-CN',
    directory: 'website/docs/knowledge-base',
  },
  {
    locale: 'en',
    directory:
      'website/i18n/en/docusaurus-plugin-content-docs/current/knowledge-base',
  },
];
const SOURCE_ROOT = CONTENT_ROOTS[0].directory;
const ALLOWED_CATEGORIES = new Set(['general', 'guides', 'reference']);
const SLUG_PATTERN = /^[a-z0-9-]+$/;

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createWikiLinkTargetIndex(contentRoot, files) {
  const keyCounts = new Map();
  const rootName = path.basename(contentRoot);

  for (const file of files.filter((candidate) => candidate.endsWith('.md'))) {
    const relativeTarget = toPosix(path.relative(contentRoot, file)).replace(
      /\.md$/i,
      '',
    );
    const keys = new Set([relativeTarget, `${rootName}/${relativeTarget}`]);
    for (const key of keys) {
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }

  return new Set(
    Array.from(keyCounts.entries())
      .filter(([, count]) => count === 1)
      .map(([key]) => key),
  );
}

async function walk(directory) {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : [entryPath];
    }),
  );
  return nestedFiles.flat();
}

async function readUtf8(filePath, errors) {
  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(
      await fs.readFile(filePath),
    );
  } catch {
    errors.push(
      `${toPosix(path.relative(process.cwd(), filePath))}: not UTF-8`,
    );
    return '';
  }
}

function parseFrontMatter(content) {
  const normalized = content.replaceAll('\r\n', '\n');
  if (!normalized.startsWith('---\n')) {
    return undefined;
  }

  const closingMarker = normalized.indexOf('\n---\n', 4);
  if (closingMarker === -1) {
    return undefined;
  }

  return {
    body: normalized.slice(closingMarker + 5),
    yaml: normalized.slice(4, closingMarker),
  };
}

function readScalar(yaml, field) {
  const match = yaml.match(new RegExp(`^${field}:\\s*(?<value>.*?)\\s*$`, 'm'));
  const value = match?.groups?.value;
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const hasMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function contentWithoutCode(content) {
  return content
    .replace(/^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$/gm, '')
    .replace(/`[^`\n]+`/g, '');
}

function removeQueryAndFragment(target) {
  return target.split(/[?#]/, 1)[0];
}

function decodeTarget(target) {
  try {
    return decodeURI(target);
  } catch {
    return target;
  }
}

function isExternalTarget(target) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target);
}

async function validateLocalFileTarget({
  absoluteFile,
  rawTarget,
  repositoryRoot,
  relativeFile,
  errors,
  kind,
}) {
  const cleanTarget = decodeTarget(removeQueryAndFragment(rawTarget.trim()));
  if (!cleanTarget || isExternalTarget(cleanTarget)) {
    return;
  }

  const targetPath = cleanTarget.startsWith('/')
    ? path.join(repositoryRoot, 'website/static', cleanTarget.slice(1))
    : path.resolve(path.dirname(absoluteFile), cleanTarget);

  if (!(await pathExists(targetPath))) {
    errors.push(`${relativeFile}: missing ${kind} target ${rawTarget}`);
  }
}

async function validateMarkdownTargets({
  absoluteFile,
  body,
  contentRoot,
  repositoryRoot,
  relativeFile,
  wikiLinkTargetIndex,
  errors,
}) {
  const searchableContent = contentWithoutCode(body);

  if (searchableContent.includes('![[', 0)) {
    errors.push(
      `${relativeFile}: Obsidian image embeds are unsupported; use Markdown image syntax`,
    );
  }

  for (const match of searchableContent.matchAll(
    /!\[[^\]]*\]\((?:<(?<angle>[^>]+)>|(?<bare>[^\s)]+))/g,
  )) {
    await validateLocalFileTarget({
      absoluteFile,
      rawTarget: match.groups?.angle ?? match.groups?.bare,
      repositoryRoot,
      relativeFile,
      errors,
      kind: 'image',
    });
  }

  for (const match of searchableContent.matchAll(
    /(?<!!)\[[^\]]*\]\((?:<(?<angle>[^>]+)>|(?<bare>[^\s)]+))/g,
  )) {
    const target = match.groups?.angle ?? match.groups?.bare;
    const cleanTarget = removeQueryAndFragment(target);
    if (/\.mdx?$/i.test(cleanTarget) || cleanTarget.startsWith('/img/')) {
      await validateLocalFileTarget({
        absoluteFile,
        rawTarget: target,
        repositoryRoot,
        relativeFile,
        errors,
        kind: 'Markdown link',
      });
    }
  }

  for (const match of searchableContent.matchAll(
    /\[\[(?<target>[^\]\n]+)\]\]/g,
  )) {
    const markerIndex = match.index ?? 0;
    if (
      searchableContent[markerIndex - 1] === '!' ||
      searchableContent[markerIndex - 1] === '\\'
    ) {
      continue;
    }

    const [targetPart] = match.groups.target.split('|', 1);
    const cleanTarget = decodeTarget(removeQueryAndFragment(targetPart.trim()));
    if (!cleanTarget) {
      errors.push(`${relativeFile}: empty WikiLink target`);
      continue;
    }
    if (/\.mdx$/i.test(cleanTarget)) {
      errors.push(`${relativeFile}: WikiLinks must not target .mdx files`);
      continue;
    }

    const targetWithExtension = /\.md$/i.test(cleanTarget)
      ? cleanTarget
      : `${cleanTarget}.md`;
    const targetPath = cleanTarget.startsWith('/')
      ? path.join(contentRoot, targetWithExtension.slice(1))
      : path.resolve(path.dirname(absoluteFile), targetWithExtension);
    const indexedTarget = cleanTarget
      .replace(/^\/+/, '')
      .replace(/\\/g, '/')
      .replace(/\.md$/i, '');
    if (
      !(await pathExists(targetPath)) &&
      !wikiLinkTargetIndex.has(indexedTarget)
    ) {
      errors.push(`${relativeFile}: unresolved WikiLink ${match[0]}`);
    }
  }
}

async function validateDocument({
  absoluteFile,
  contentRoot,
  locale,
  repositoryRoot,
  wikiLinkTargetIndex,
  errors,
}) {
  const relativeFile = toPosix(path.relative(repositoryRoot, absoluteFile));
  const content = await readUtf8(absoluteFile, errors);
  const frontMatter = parseFrontMatter(content);
  if (!frontMatter) {
    errors.push(`${relativeFile}: missing or malformed YAML front matter`);
    return;
  }

  for (const field of ['title', 'description', 'sidebar_position']) {
    if (!readScalar(frontMatter.yaml, field)) {
      errors.push(`${relativeFile}: missing front matter field ${field}`);
    }
  }

  const sidebarPosition = readScalar(frontMatter.yaml, 'sidebar_position');
  if (sidebarPosition && !/^[1-9]\d*$/.test(sidebarPosition)) {
    errors.push(`${relativeFile}: sidebar_position must be a positive integer`);
  }

  const relativeToContent = toPosix(path.relative(contentRoot, absoluteFile));
  const [category] = relativeToContent.split('/');
  const filename = path.basename(absoluteFile, '.md');
  const slug = readScalar(frontMatter.yaml, 'slug');
  const frontMatterCategory = readScalar(frontMatter.yaml, 'category');

  if (slug) {
    if (
      !SLUG_PATTERN.test(slug) ||
      slug.startsWith('-') ||
      slug.endsWith('-')
    ) {
      errors.push(
        `${relativeFile}: slug must use lowercase letters, numbers, and hyphens`,
      );
    } else if (slug !== filename) {
      errors.push(`${relativeFile}: slug must match filename ${filename}`);
    }
  }

  if (frontMatterCategory) {
    if (!ALLOWED_CATEGORIES.has(frontMatterCategory)) {
      errors.push(
        `${relativeFile}: unsupported category ${frontMatterCategory}`,
      );
    } else if (frontMatterCategory !== category) {
      errors.push(
        `${relativeFile}: category must match parent directory ${category}`,
      );
    }
  }

  if (!ALLOWED_CATEGORIES.has(category)) {
    errors.push(
      `${relativeFile}: file must be under general, guides, or reference`,
    );
  }

  if (locale === 'en') {
    const sourceFile = path.join(
      repositoryRoot,
      SOURCE_ROOT,
      relativeToContent,
    );
    if (!(await pathExists(sourceFile))) {
      errors.push(
        `${relativeFile}: missing Chinese source ${toPosix(path.relative(repositoryRoot, sourceFile))}`,
      );
    }
  }

  await validateMarkdownTargets({
    absoluteFile,
    body: frontMatter.body,
    contentRoot,
    repositoryRoot,
    relativeFile,
    wikiLinkTargetIndex,
    errors,
  });
}

async function validateRepository() {
  const repositoryRoot = process.cwd();
  if (!(await pathExists(path.join(repositoryRoot, '.git')))) {
    throw new Error('Run this validator from the Git repository root.');
  }

  const errors = [];
  for (const {locale, directory} of CONTENT_ROOTS) {
    const contentRoot = path.join(repositoryRoot, directory);
    if (!(await pathExists(contentRoot))) {
      errors.push(`${directory}: content directory does not exist`);
      continue;
    }

    const files = await walk(contentRoot);
    const wikiLinkTargetIndex = createWikiLinkTargetIndex(contentRoot, files);
    for (const mdxFile of files.filter((file) => file.endsWith('.mdx'))) {
      errors.push(
        `${toPosix(path.relative(repositoryRoot, mdxFile))}: knowledge-base articles must use .md`,
      );
    }
    for (const absoluteFile of files.filter((file) => file.endsWith('.md'))) {
      await validateDocument({
        absoluteFile,
        contentRoot,
        locale,
        repositoryRoot,
        wikiLinkTargetIndex,
        errors,
      });
    }
  }

  if (errors.length > 0) {
    console.error('Knowledge-base validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Knowledge-base validation passed.');
}

await validateRepository();
