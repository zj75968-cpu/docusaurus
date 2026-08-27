/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

export type GraphDocument = {
  id: string;
  slug?: string;
  permalink: string;
  source: string;
};

export function stripLinkDecorations(value: string): string {
  const [withoutFragment = ''] = value
    .trim()
    .replace(/^<|>$/g, '')
    .split(/[?#]/, 1);
  return withoutFragment
    .replace(/\\/g, '/')
    .replace(/^@site\//, '')
    .replace(/^\.\//, '');
}

export function normalizeKey(value: string): string {
  const normalized = path.posix
    .normalize(stripLinkDecorations(value))
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/\.(?:md|mdx)$/i, '')
    .replace(/\/index$/i, '')
    .replace(/\/$/, '');
  return normalized === '.' ? '' : normalized;
}

function sourceKey(source: string): string {
  return normalizeKey(source);
}

function addLookupKey(
  lookup: Map<string, string>,
  key: string,
  nodeId: string,
): void {
  const normalized = normalizeKey(key);
  if (!normalized) {
    return;
  }
  const previous = lookup.get(normalized);
  // An unqualified ID can be shared by versions. Mark it ambiguous instead of
  // linking to an arbitrary version.
  if (previous === undefined || previous === nodeId) {
    lookup.set(normalized, nodeId);
  } else {
    lookup.set(normalized, '');
  }
}

export function isDocumentLink(target: string): boolean {
  const normalizedTarget = stripLinkDecorations(target);
  if (
    !normalizedTarget ||
    normalizedTarget.startsWith('#') ||
    normalizedTarget.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(normalizedTarget)
  ) {
    return false;
  }

  const extension = path.posix.extname(path.posix.basename(normalizedTarget));
  return !extension || /\.mdx?$/i.test(extension);
}

export function createDocumentResolver(
  documents: GraphDocument[],
): (params: {source: string; target: string}) => string | undefined {
  const lookup = new Map<string, string>();
  for (const document of documents) {
    addLookupKey(lookup, document.id, document.permalink);
    addLookupKey(lookup, document.slug ?? document.id, document.permalink);
    addLookupKey(lookup, document.permalink, document.permalink);
    addLookupKey(lookup, sourceKey(document.source), document.permalink);
  }

  return ({source, target}) => {
    const normalizedTarget = stripLinkDecorations(target);
    if (!isDocumentLink(target)) {
      return undefined;
    }

    const candidates = normalizedTarget.startsWith('/')
      ? [normalizedTarget]
      : [
          path.posix.join(
            path.posix.dirname(normalizeKey(source)),
            normalizedTarget,
          ),
          normalizedTarget,
        ];

    for (const candidate of candidates) {
      const nodeId = lookup.get(normalizeKey(candidate));
      if (nodeId) {
        return nodeId;
      }
    }
    return undefined;
  };
}

export function resolveDocumentLink({
  source,
  target,
  documents,
}: {
  source: string;
  target: string;
  documents: GraphDocument[];
}): string | undefined {
  return createDocumentResolver(documents)({source, target});
}