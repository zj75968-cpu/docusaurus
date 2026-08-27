/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {type ReactNode} from 'react';
import classNames from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useKnowledgeGraphData from '@theme/knowledgeGraph';
import TagsListInline from '@theme/TagsListInline';

import EditMetaRow from '@theme/EditMetaRow';
import Backlinks from '@theme/Backlinks';
import KnowledgeGraph from '@theme/KnowledgeGraph';

export default function DocItemFooter(): ReactNode {
  const {metadata} = useDoc();
  const {editUrl, lastUpdatedAt, lastUpdatedBy, tags} = metadata;
  const {graph, currentNode} = useKnowledgeGraphData();

  const canDisplayTagsRow = tags.length > 0;
  const canDisplayEditMetaRow = !!(editUrl || lastUpdatedAt || lastUpdatedBy);
  const canDisplayKnowledgeGraph = Boolean(graph && currentNode);

  const canDisplayFooter =
    canDisplayTagsRow || canDisplayEditMetaRow || canDisplayKnowledgeGraph;

  if (!canDisplayFooter) {
    return null;
  }

  return (
    <footer
      className={classNames(ThemeClassNames.docs.docFooter, 'docusaurus-mt-lg')}>
      {canDisplayTagsRow && (
        <div
          className={classNames(
            'row margin-top--sm',
            ThemeClassNames.docs.docFooterTagsRow,
          )}>
          <div className="col">
            <TagsListInline tags={tags} />
          </div>
        </div>
      )}
      {canDisplayEditMetaRow && (
        <EditMetaRow
          className={classNames(
            'margin-top--sm',
            ThemeClassNames.docs.docFooterEditMetaRow,
          )}
          editUrl={editUrl}
          lastUpdatedAt={lastUpdatedAt}
          lastUpdatedBy={lastUpdatedBy}
        />
      )}
      {canDisplayKnowledgeGraph && (
        <>
          <Backlinks />
          <KnowledgeGraph />
        </>
      )}
    </footer>
  );
}
