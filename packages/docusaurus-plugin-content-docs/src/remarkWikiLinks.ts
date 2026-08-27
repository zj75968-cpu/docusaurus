/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {parseLocalURLPath, serializeURLPath} from '@docusaurus/utils';
import type {Plugin, Transformer} from 'unified';
import type {Link, Parent, Root, Text} from 'mdast';

export type WikiLinkResolver = (params: {
  sourceFilePath: string;
  target: string;
}) => string | undefined;

export type PluginOptions = {
  resolveWikiLink: WikiLinkResolver;
};

type TextReplacement = {
  nodes: Array<Text | Link>;
  changed: boolean;
};

const WikiLinkPattern = /(?<!!)\[\[(?<target>[^\]\n]+)\]\]/g;

function textNode(value: string): Text {
  return {type: 'text', value};
}

function replaceWikiLinks(
  node: Text,
  sourceFilePath: string,
  resolveWikiLink: WikiLinkResolver,
): TextReplacement {
  const replacements: TextReplacement['nodes'] = [];
  let cursor = 0;
  let changed = false;

  for (const match of node.value.matchAll(WikiLinkPattern)) {
    const matchStart = match.index ?? 0;
    const targetValue = match.groups?.target?.trim();
    const escaped =
      matchStart > 0 &&
      node.value[matchStart - 1] === '\\' &&
      (matchStart === 1 || node.value[matchStart - 2] !== '\\');
    if (
      !targetValue ||
      escaped ||
      (matchStart > 0 && node.value[matchStart - 1] === '!')
    ) {
      continue;
    }

    const separator = targetValue.indexOf('|');
    const targetWithUrl = (
      separator === -1 ? targetValue : targetValue.slice(0, separator)
    ).trim();
    const targetUrl = parseLocalURLPath(targetWithUrl);
    if (!targetUrl?.pathname) {
      continue;
    }
    const target = targetUrl.pathname;

    const href = resolveWikiLink({sourceFilePath, target});
    if (!href) {
      continue;
    }

    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > cursor) {
      replacements.push(textNode(node.value.slice(cursor, start)));
    }

    const alias =
      separator === -1 ? undefined : targetValue.slice(separator + 1).trim();
    replacements.push({
      type: 'link',
      title: null,
      url: targetUrl
        ? serializeURLPath({...targetUrl, pathname: href})
        : href,
      children: [textNode(alias || target.replace(/\.(?:md|mdx)$/i, ''))],
    });
    cursor = end;
    changed = true;
  }

  if (!changed) {
    return {nodes: [node], changed: false};
  }
  if (cursor < node.value.length) {
    replacements.push(textNode(node.value.slice(cursor)));
  }
  return {nodes: replacements, changed: true};
}

function transformParent(
  parent: Parent,
  sourceFilePath: string,
  resolveWikiLink: WikiLinkResolver,
): void {
  if (parent.type === 'link') {
    return;
  }
  const nextChildren: Parent['children'] = [];
  for (const child of parent.children) {
    if (child.type === 'text') {
      const replacement = replaceWikiLinks(
        child,
        sourceFilePath,
        resolveWikiLink,
      );
      nextChildren.push(...replacement.nodes);
    } else {
      if ('children' in child && child.type !== 'link') {
        transformParent(child, sourceFilePath, resolveWikiLink);
      }
      nextChildren.push(child);
    }
  }
  parent.children = nextChildren;
}

const plugin: Plugin<PluginOptions[], Root> = function plugin(
  options,
): Transformer<Root> {
  return (root, file) => {
    if (!file.path) {
      return;
    }
    transformParent(root, file.path, options.resolveWikiLink);
  };
};

export default plugin;