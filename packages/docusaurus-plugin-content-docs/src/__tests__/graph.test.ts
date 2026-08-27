/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from 'vitest';
import {buildKnowledgeGraph, type GraphEntry} from '../graph';

function entry({
  id,
  title = id,
  source,
  permalink = `/docs/${id}`,
  content,
  unlisted = false,
}: {
  id: string;
  title?: string;
  source: string;
  permalink?: string;
  content: string;
  unlisted?: boolean;
}): GraphEntry {
  return {
    doc: {
      id,
      title,
      description: `${title} description`,
      permalink,
      source,
      slug: `/${id}`,
      version: 'current',
      unlisted,
    },
    content,
  };
}

describe('buildKnowledgeGraph', () => {
  it('resolves markdown links, wikilinks, and backlinks', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source: '@site/docs/intro.md',
        content: '[Guide](./guide.md) and [[api|API]].',
      }),
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        content: 'See [intro](/docs/intro).',
      }),
      entry({
        id: 'api',
        source: '@site/docs/api.md',
        content: 'API details.',
      }),
    ]);

    expect(graph.nodes.map((node) => node.id)).toEqual([
      '/docs/api',
      '/docs/guide',
      '/docs/intro',
    ]);
    expect(graph.edges).toEqual([
      {source: '/docs/guide', target: '/docs/intro', type: 'markdown'},
      {source: '/docs/intro', target: '/docs/api', type: 'wikilink'},
      {source: '/docs/intro', target: '/docs/guide', type: 'markdown'},
    ]);
    expect(graph.backlinks['/docs/guide']).toEqual(['/docs/intro']);
    expect(graph.backlinks['/docs/intro']).toEqual(['/docs/guide']);
  });

  it('keeps unresolved document links observable and ignores external and asset links', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source: '@site/docs/intro.md',
        content:
          '[Missing](./missing.md) [Missing again](./missing.md) [External](https://example.com) ![Image](./image.png) ![[image]] [Heading](#section).',
      }),
    ]);

    expect(graph.unresolved).toEqual([
      {source: '/docs/intro', target: './missing.md', type: 'markdown'},
    ]);
    expect(graph.edges).toEqual([]);
  });

  it('deduplicates repeated links and ignores fenced code examples', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source: '@site/docs/intro.md',
        content: `
[Guide](./guide.md) [Guide again](./guide.md)

\`\`\`md
[Not a link](./missing.md)
[[not-a-link]]
\`\`\`
`,
      }),
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        content: 'Guide.',
      }),
    ]);

    expect(graph.edges).toEqual([
      {source: '/docs/intro', target: '/docs/guide', type: 'markdown'},
    ]);
    expect(graph.unresolved).toEqual([]);
  });

  it('ignores inline code while retaining real links on the same line', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source: '@site/docs/intro.md',
        content: '`[[missing]]` and [[guide]] plus `[Guide](./guide.md)`.',
      }),
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        content: 'Guide.',
      }),
    ]);

    expect(graph.edges).toEqual([
      {source: '/docs/intro', target: '/docs/guide', type: 'wikilink'},
    ]);
    expect(graph.unresolved).toEqual([]);
  });

  it('ignores escaped links', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source: '@site/docs/intro.md',
        content: '\\[[missing]] and \\[Guide](./guide.md) and [[guide]].',
      }),
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        content: 'Guide.',
      }),
    ]);

    expect(graph.edges).toEqual([
      {source: '/docs/intro', target: '/docs/guide', type: 'wikilink'},
    ]);
    expect(graph.unresolved).toEqual([]);
  });

  it('deduplicates nodes and preserves self-references and unlisted metadata', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        content: '[[guide]] [again](/docs/guide).',
        unlisted: true,
      }),
      {
        ...entry({
          id: 'guide-copy',
          source: '@site/docs/guide.md',
          content: 'This duplicate must not become another node.',
        }),
        doc: {
          ...entry({
            id: 'guide-copy',
            source: '@site/docs/guide.md',
            content: '',
          }).doc,
          permalink: '/docs/guide',
          unlisted: true,
        },
      },
    ]);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0]).toMatchObject({
      id: '/docs/guide',
      unlisted: true,
    });
    expect(graph.edges).toEqual([
      {source: '/docs/guide', target: '/docs/guide', type: 'wikilink'},
    ]);
  });

  it('resolves explicit version paths without conflating same IDs', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        permalink: '/docs/guide',
        content: 'Guide.',
      }),
      entry({
        id: 'guide',
        source: '@site/versioned_docs/version-1/guide.md',
        permalink: '/docs/version-1/guide',
        content: 'Version 1 guide.',
      }),
      entry({
        id: 'intro',
        source: '@site/notes/intro.md',
        content: 'See [v1](/docs/version-1/guide).',
      }),
    ]);

    expect(graph.edges).toEqual([
      {
        source: '/docs/intro',
        target: '/docs/version-1/guide',
        type: 'markdown',
      },
    ]);
  });

  it('does not resolve an ambiguous unqualified ID across versions', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        permalink: '/docs/guide',
        content: 'Guide.',
      }),
      entry({
        id: 'guide',
        source: '@site/versioned_docs/version-1/guide.md',
        permalink: '/docs/version-1/guide',
        content: 'Version 1 guide.',
      }),
      entry({
        id: 'intro',
        source: '@site/notes/intro.md',
        content: 'See [[guide]].',
      }),
    ]);

    expect(graph.edges).toEqual([]);
    expect(graph.unresolved).toEqual([
      {source: '/docs/intro', target: 'guide', type: 'wikilink'},
    ]);
  });

  it('keeps localized paths and node URLs isolated', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source:
          '@site/i18n/zh-Hans/docusaurus-plugin-content-docs/current/intro.md',
        permalink: '/zh-Hans/docs/intro',
        content: '[指南](./guide.md#overview).',
      }),
      entry({
        id: 'guide',
        source:
          '@site/i18n/zh-Hans/docusaurus-plugin-content-docs/current/guide.md',
        permalink: '/zh-Hans/docs/guide',
        content: '指南。',
        unlisted: true,
      }),
    ]);

    expect(graph.nodes).toEqual([
      expect.objectContaining({
        id: '/zh-Hans/docs/guide',
        path: '/zh-Hans/docs/guide',
        version: 'current',
        unlisted: true,
      }),
      expect.objectContaining({
        id: '/zh-Hans/docs/intro',
        path: '/zh-Hans/docs/intro',
      }),
    ]);
    expect(graph.edges).toEqual([
      {
        source: '/zh-Hans/docs/intro',
        target: '/zh-Hans/docs/guide',
        type: 'markdown',
      },
    ]);
    expect(graph.backlinks['/zh-Hans/docs/guide']).toEqual([
      '/zh-Hans/docs/intro',
    ]);
  });

  it('deduplicates markdown and wikilink edges to the same document', () => {
    const graph = buildKnowledgeGraph([
      entry({
        id: 'intro',
        source: '@site/docs/intro.md',
        content: '[[guide]] and [Guide](./guide.md).',
      }),
      entry({
        id: 'guide',
        source: '@site/docs/guide.md',
        content: 'Guide.',
      }),
    ]);

    expect(graph.edges).toEqual([
      {source: '/docs/intro', target: '/docs/guide', type: 'wikilink'},
    ]);
    expect(graph.backlinks['/docs/guide']).toEqual(['/docs/intro']);
  });

  it('returns empty indexes for empty content', () => {
    expect(buildKnowledgeGraph([])).toEqual({
      version: 1,
      nodes: [],
      edges: [],
      backlinks: {},
      unresolved: [],
    });
  });
});