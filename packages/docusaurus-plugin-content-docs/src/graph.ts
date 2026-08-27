/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import path from 'path';
import {
  createDocumentResolver,
  isDocumentLink,
  normalizeKey,
} from './graphResolution';
import type {DocMetadata, LoadedVersion} from '@docusaurus/plugin-content-docs';
import type {
  KnowledgeGraph,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  KnowledgeGraphUnresolvedLink,
} from './graphTypes';

export type {
  KnowledgeGraph,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  KnowledgeGraphUnresolvedLink,
} from './graphTypes';

type GraphEntry = {
  doc: Pick<
    DocMetadata,
    | 'id'
    | 'title'
    | 'description'
    | 'permalink'
    | 'source'
    | 'slug'
    | 'version'
    | 'unlisted'
  >;
  content: string;
};

type Link = {
  target: string;
  type: KnowledgeGraphEdge['type'];
};

const MarkdownLinkPattern =
  /(?<!!)\[[^\]]*\]\((?:<(?<angleTarget>[^>]+)>|(?<bareTarget>[^\s)]+))/g;
const WikiLinkPattern = /(?<!!)\[\[(?<target>[^\]]+)\]\]/g;

function stripInlineCode(value: string): string {
  let result = '';
  let index = 0;

  while (index < value.length) {
    if (value[index] !== '`') {
      result += value[index];
      index += 1;
      continue;
    }

    let markerLength = 1;
    while (value[index + markerLength] === '`') {
      markerLength += 1;
    }
    const marker = '`'.repeat(markerLength);
    const closingIndex = value.indexOf(marker, index + markerLength);
    if (closingIndex === -1) {
      result += value.slice(index);
      break;
    }
    index = closingIndex + markerLength;
  }

  return result;
}

function isEscaped(value: string, index: number): boolean {
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function collectLinks(content: string): Link[] {
  const links: Link[] = [];
  const seen = new Set<string>();
  let fenced: string | undefined;

  for (const line of content.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(?<fence>`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch.groups?.fence;
      if (!marker) {
        continue;
      }
      if (
        fenced &&
        ((fenced.startsWith('`') && marker.startsWith('`')) ||
          (fenced.startsWith('~') && marker.startsWith('~'))) &&
        marker.length >= fenced.length
      ) {
        fenced = undefined;
      } else if (!fenced) {
        fenced = marker;
      }
      continue;
    }
    if (fenced) {
      continue;
    }

    const contentLine = stripInlineCode(line);
    const lineLinks: {index: number; link: Link}[] = [];

    for (const match of contentLine.matchAll(MarkdownLinkPattern)) {
      if (isEscaped(contentLine, match.index ?? 0)) {
        continue;
      }
      const target = match.groups?.angleTarget ?? match.groups?.bareTarget;
      if (target) {
        lineLinks.push({
          index: match.index ?? 0,
          link: {target: target.trim(), type: 'markdown'},
        });
      }
    }

    for (const match of contentLine.matchAll(WikiLinkPattern)) {
      if (isEscaped(contentLine, match.index ?? 0)) {
        continue;
      }
      const [targetPart] = (match.groups?.target ?? '').split('|', 1);
      const target = targetPart?.trim();
      if (target) {
        lineLinks.push({
          index: match.index ?? 0,
          link: {target, type: 'wikilink'},
        });
      }
    }

    lineLinks.sort((left, right) => left.index - right.index);
    for (const {link} of lineLinks) {
      const key = `${link.type}:${link.target}`;
      if (!seen.has(key)) {
        seen.add(key);
        links.push(link);
      }
    }
  }

  return links;
}

function docNode(doc: GraphEntry['doc']): KnowledgeGraphNode {
  return {
    id: doc.permalink,
    title: doc.title,
    description: doc.description,
    path: doc.permalink,
    version: doc.version,
    ...(doc.unlisted && {unlisted: doc.unlisted}),
  };
}

/**
 * Build a deterministic, serializable graph from already loaded documents.
 * Keeping this function filesystem-free makes the graph contract easy to test
 * and allows other content plugins to provide entries in the future.
 */
export function buildKnowledgeGraph(entries: GraphEntry[]): KnowledgeGraph {
  const sortedEntries = [...entries].sort(
    (left, right) =>
      left.doc.permalink.localeCompare(right.doc.permalink) ||
      left.doc.source.localeCompare(right.doc.source),
  );
  const uniqueEntries = sortedEntries.filter(
    ({doc}, index) =>
      index === 0 || doc.permalink !== sortedEntries[index - 1]!.doc.permalink,
  );
  const nodes = uniqueEntries.map(({doc}) => docNode(doc));
  const resolveLink = createDocumentResolver(
    uniqueEntries.map(({doc}) => doc),
  );

  const edges: KnowledgeGraphEdge[] = [];
  const unresolved: KnowledgeGraphUnresolvedLink[] = [];
  const edgeKeys = new Set<string>();

  uniqueEntries.forEach(({doc, content}) => {
    const sourceNodeId = doc.permalink;
    const source = normalizeKey(doc.source);
    for (const link of collectLinks(content)) {
      if (!isDocumentLink(link.target)) {
        continue;
      }
      const targetNodeId = resolveLink({
        source,
        target: link.target,
      });
      if (!targetNodeId) {
        unresolved.push({
          source: sourceNodeId,
          target: link.target,
          type: link.type,
        });
        continue;
      }
      const edgeKey = `${sourceNodeId}\u0000${targetNodeId}`;
      if (!edgeKeys.has(edgeKey)) {
        edgeKeys.add(edgeKey);
        edges.push({
          source: sourceNodeId,
          target: targetNodeId,
          type: link.type,
        });
      }
    }
  });

  const backlinks = Object.fromEntries(
    nodes.map((node) => [node.id, [] as string[]]),
  );
  for (const edge of edges) {
    backlinks[edge.target]!.push(edge.source);
  }
  for (const values of Object.values(backlinks)) {
    values.sort();
  }

  return {
    version: 1,
    nodes,
    edges: edges.sort((left, right) =>
      `${left.source}:${left.target}`.localeCompare(
        `${right.source}:${right.target}`,
      ),
    ),
    backlinks,
    unresolved: unresolved.sort((left, right) =>
      `${left.source}:${left.target}`.localeCompare(
        `${right.source}:${right.target}`,
      ),
    ),
  };
}

function sourceFilePath(siteDir: string, source: string): string {
  if (source.startsWith('@site/')) {
    return path.join(siteDir, source.slice('@site/'.length));
  }
  return path.isAbsolute(source) ? source : path.join(siteDir, source);
}

/** Build the graph from the documents loaded by one docs plugin instance. */
export async function createKnowledgeGraph({
  siteDir,
  versions,
}: {
  siteDir: string;
  versions: LoadedVersion[];
}): Promise<KnowledgeGraph> {
  const entries = await Promise.all(
    versions.flatMap((version) =>
      version.docs.map(async (doc) => {
        let content = '';
        try {
          content = await fs.readFile(sourceFilePath(siteDir, doc.source), 'utf8');
        } catch {
          // Generated or virtual content has no source file to scan.
        }
        return {doc, content};
      }),
    ),
  );

  return buildKnowledgeGraph(entries);
}

export type {GraphEntry};