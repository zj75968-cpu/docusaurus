/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  KnowledgeGraph,
  KnowledgeGraphNode,
} from '@docusaurus/plugin-content-docs/client';

function normalizePath(value: string): string {
  return value.replace(/\/+$/, '') || '/';
}

function findCurrentGraphNode({
  graph,
  docId,
  pathname,
  withBaseUrl,
}: {
  graph?: KnowledgeGraph;
  docId?: string;
  pathname: string;
  withBaseUrl: (path: string) => string;
}): KnowledgeGraphNode | undefined {
  if (!graph) {
    return undefined;
  }
  return (
    (docId &&
      graph.nodes.find(
        (node) => node.id === docId || node.path === docId,
      )) ||
    graph.nodes.find(
      (node) =>
        normalizePath(withBaseUrl(node.path)) === normalizePath(pathname),
    )
  );
}

function getRelatedGraphNodes({
  graph,
  currentNode,
}: {
  graph?: KnowledgeGraph;
  currentNode?: KnowledgeGraphNode;
}): KnowledgeGraphNode[] {
  if (!graph || !currentNode) {
    return graph?.nodes ?? [];
  }
  const relatedIds = new Set<string>([
    currentNode.id,
    ...(graph.backlinks[currentNode.id] ?? []),
    ...graph.edges
      .filter((edge) => edge.source === currentNode.id)
      .map((edge) => edge.target),
  ]);
  return graph.nodes.filter((node) => relatedIds.has(node.id));
}

const knowledgeGraphUtils = {
  findCurrentGraphNode,
  getRelatedGraphNodes,
};

export default knowledgeGraphUtils;