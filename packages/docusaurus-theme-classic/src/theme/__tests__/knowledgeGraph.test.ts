/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from 'vitest';
import knowledgeGraphUtils from '../knowledgeGraphUtils';
import type {KnowledgeGraph} from '@docusaurus/plugin-content-docs/client';

const graph: KnowledgeGraph = {
  version: 1,
  nodes: [
    {
      id: '/docs/guide',
      title: 'Guide',
      description: '',
      path: '/docs/guide',
      version: 'current',
    },
    {
      id: '/docs/api',
      title: 'API',
      description: '',
      path: '/docs/api',
      version: 'current',
    },
    {
      id: '/docs/isolated',
      title: 'Isolated',
      description: '',
      path: '/docs/isolated',
      version: 'current',
    },
  ],
  edges: [
    {source: '/docs/guide', target: '/docs/api', type: 'markdown'},
    {source: '/docs/api', target: '/docs/guide', type: 'wikilink'},
  ],
  backlinks: {
    '/docs/guide': ['/docs/api'],
    '/docs/api': ['/docs/guide'],
    '/docs/isolated': [],
  },
  unresolved: [],
};

describe('knowledgeGraph theme helpers', () => {
  it('finds the current node by the rendered URL', () => {
    expect(
      knowledgeGraphUtils.findCurrentGraphNode({
        graph,
        pathname: '/manual/docs/api/',
        withBaseUrl: (value) => `/manual${value}`,
      }),
    ).toEqual(graph.nodes[1]);
  });

  it('prioritizes an explicit document ID and degrades without graph data', () => {
    expect(
      knowledgeGraphUtils.findCurrentGraphNode({
        graph,
        docId: '/docs/guide',
        pathname: '/not-a-document',
        withBaseUrl: (value) => value,
      }),
    ).toEqual(graph.nodes[0]);
    expect(
      knowledgeGraphUtils.findCurrentGraphNode({
        pathname: '/docs/guide',
        withBaseUrl: (value) => value,
      }),
    ).toBeUndefined();
  });

  it('returns the current node and directly related nodes', () => {
    expect(
      knowledgeGraphUtils.getRelatedGraphNodes({graph, currentNode: graph.nodes[0]}),
    ).toEqual([graph.nodes[0], graph.nodes[1]]);
    expect(knowledgeGraphUtils.getRelatedGraphNodes({graph})).toEqual(graph.nodes);
  });
});