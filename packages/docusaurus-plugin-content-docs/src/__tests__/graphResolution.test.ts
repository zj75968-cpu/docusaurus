/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from 'vitest';
import {
  createDocumentResolver,
  isDocumentLink,
  normalizeKey,
  resolveDocumentLink,
} from '../graphResolution';
import type {GraphDocument} from '../graphResolution';

const documents: GraphDocument[] = [
  {
    id: 'guide',
    slug: '/guide',
    permalink: '/docs/guide',
    source: '@site/docs/guide.md',
  },
  {
    id: 'nested/api',
    slug: '/nested/api',
    permalink: '/docs/nested/api',
    source: '@site/docs/nested/api.mdx',
  },
  {
    id: 'knowledge-base/reference/schema',
    slug: '/knowledge-base/reference/schema',
    permalink: '/docs/knowledge-base/reference/schema',
    source: '@site/docs/knowledge-base/reference/schema.md',
  },
];

describe('graphResolution', () => {
  it('normalizes document keys without URL decorations', () => {
    expect(normalizeKey('./nested/api.mdx#methods')).toBe('nested/api');
    expect(normalizeKey('@site/docs/guide.md?preview=true')).toBe('docs/guide');
    expect(normalizeKey('/nested/api/index.md')).toBe('nested/api');
  });

  it('recognizes local Markdown targets only', () => {
    expect(isDocumentLink('./guide.md')).toBe(true);
    expect(isDocumentLink('guide')).toBe(true);
    expect(isDocumentLink('https://example.com/guide.md')).toBe(false);
    expect(isDocumentLink('./image.png')).toBe(false);
    expect(isDocumentLink('#methods')).toBe(false);
  });

  it('resolves relative, absolute, and ID links', () => {
    const resolve = createDocumentResolver(documents);

    expect(
      resolve({source: 'docs/notes/intro.md', target: '../guide.md'}),
    ).toBe('/docs/guide');
    expect(resolve({source: 'docs/intro.md', target: '/docs/nested/api'})).toBe(
      '/docs/nested/api',
    );
    expect(resolve({source: 'docs/intro.md', target: 'guide'})).toBe(
      '/docs/guide',
    );
    expect(
      resolve({
        source: 'docs/knowledge-base/guides/intro.md',
        target: 'reference/schema',
      }),
    ).toBe('/docs/knowledge-base/reference/schema');
    expect(
      resolve({source: '@site/docs/notes/intro.md', target: '../guide.md'}),
    ).toBe('/docs/guide');
    expect(resolve({source: 'docs/intro.md', target: 'missing.md'})).toBe(
      undefined,
    );
  });

  it('returns the same result through the convenience API', () => {
    expect(
      resolveDocumentLink({
        source: 'docs/intro.md',
        target: './guide.md#overview',
        documents,
      }),
    ).toBe('/docs/guide');
  });
});
