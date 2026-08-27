/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, it} from 'vitest';
import path from 'path';
import plugin from '../remarkWikiLinks';

async function processWikiLinks(content: string) {
  const {remark} = await import('remark');
  return remark()
    .use(plugin, {
      resolveWikiLink: ({target}) =>
        target === 'guide' ? '/docs/guide' : undefined,
    })
    .process({
      value: content,
      path: path.join(__dirname, 'docs', 'intro.md'),
    });
}

describe('remarkWikiLinks', () => {
  it('renders resolved wikilinks with aliases and URL fragments', async () => {
    const result = await processWikiLinks(
      '[[guide|Read the guide]] and [[guide#setup]].',
    );

    expect(result.toString()).toBe(
      '[Read the guide](/docs/guide) and [guide](/docs/guide#setup).\n',
    );
  });

  it('leaves unresolved wikilinks and non-content examples unchanged', async () => {
    const result = await processWikiLinks(`
[[missing]] and \`[[guide]]\` and ![[guide]] and [[https://example.com]]

\`\`\`md
[[guide]]
\`\`\`
`);

    expect(result.toString()).toBe(
      '\\[\\[missing]] and `[[guide]]` and !\\[\\[guide]] and \\[\\[https://example.com]]\n\n```md\n[[guide]]\n```\n',
    );
  });

  it('does not nest wikilinks inside existing Markdown links', async () => {
    const result = await processWikiLinks('[**[[guide]]**](/docs/guide)');

    expect(result.toString()).toBe(
      '[**\\[\\[guide\\]\\]**](/docs/guide)\n',
    );
  });
});
