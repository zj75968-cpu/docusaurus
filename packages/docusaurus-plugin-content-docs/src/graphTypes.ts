/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type KnowledgeGraphNode = {
  id: string;
  title: string;
  description: string;
  path: string;
  version: string;
  unlisted?: boolean;
};

export type KnowledgeGraphEdge = {
  source: string;
  target: string;
  type: 'markdown' | 'wikilink';
};

export type KnowledgeGraphUnresolvedLink = {
  source: string;
  target: string;
  type: 'markdown' | 'wikilink';
};

export type KnowledgeGraph = {
  version: 1;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  backlinks: {[nodeId: string]: string[]};
  unresolved: KnowledgeGraphUnresolvedLink[];
};