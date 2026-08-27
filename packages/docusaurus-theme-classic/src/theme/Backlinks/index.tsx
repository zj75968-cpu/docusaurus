/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useKnowledgeGraphData from '@theme/knowledgeGraph';
import styles from './styles.module.css';

export default function Backlinks({
  pluginId,
  docId,
  title = 'Backlinks',
}: {
  pluginId?: string;
  docId?: string;
  title?: ReactNode;
}): ReactNode {
  const {graph, currentNode} = useKnowledgeGraphData({pluginId, docId});
  const backlinkIds = currentNode ? graph?.backlinks[currentNode.id] ?? [] : [];
  const backlinkNodes = backlinkIds
    .map((id) => graph?.nodes.find((node) => node.id === id))
    .filter((node): node is NonNullable<typeof node> => Boolean(node));

  if (backlinkNodes.length === 0) {
    return null;
  }

  return (
    <section className={styles.backlinks} aria-labelledby="docusaurus-backlinks-title">
      <Heading as="h2" id="docusaurus-backlinks-title">
        {title}
      </Heading>
      <ul>
        {backlinkNodes.map((node) => (
          <li key={node.id}>
            <Link to={node.path}>{node.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}