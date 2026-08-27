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
import type {KnowledgeGraphNode} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

function nodeLabel(node: KnowledgeGraphNode): string {
  return node.title || node.id;
}

export default function KnowledgeGraph({
  pluginId,
  docId,
  maxNodes = 32,
  title = 'Knowledge graph',
}: {
  pluginId?: string;
  docId?: string;
  maxNodes?: number;
  title?: ReactNode;
}): ReactNode {
  const {graph, currentNode, relatedNodes} = useKnowledgeGraphData({
    pluginId,
    docId,
  });

  if (!graph || graph.nodes.length === 0) {
    return null;
  }

  const limit = Number.isFinite(maxNodes)
    ? Math.max(1, Math.floor(maxNodes))
    : 32;
  const nodes = currentNode
    ? [
        currentNode,
        ...relatedNodes.filter((node) => node.id !== currentNode.id),
      ].slice(0, limit)
    : graph.nodes.slice(0, limit);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const width = 720;
  const height = 320;
  const center = {x: width / 2, y: height / 2};
  const peerNodes = currentNode
    ? nodes.filter((node) => node.id !== currentNode.id)
    : nodes;
  const positions = new Map<string, {x: number; y: number}>();
  if (currentNode && nodeIds.has(currentNode.id)) {
    positions.set(currentNode.id, center);
  }
  peerNodes.forEach((node, index) => {
    const angle =
      (index / Math.max(peerNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.set(node.id, {
      x: center.x + Math.cos(angle) * Math.min(width * 0.36, 250),
      y: center.y + Math.sin(angle) * Math.min(height * 0.34, 105),
    });
  });
  const edges = graph.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );

  return (
    <section
      className={styles.graph}
      aria-labelledby="docusaurus-knowledge-graph-title"
    >
      <Heading as="h2" id="docusaurus-knowledge-graph-title">
        {title}
      </Heading>
      <svg
        className={styles.graphSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Interactive document relationship graph"
      >
        {edges.map((edge) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) {
            return null;
          }
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              className={styles.edge}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
            />
          );
        })}
        {nodes.map((node) => {
          const position = positions.get(node.id)!;
          const isCurrent = node.id === currentNode?.id;
          return (
            <Link to={node.path} key={node.id} className={styles.nodeLink}>
              <circle
                className={isCurrent ? styles.currentNode : styles.node}
                cx={position.x}
                cy={position.y}
                r={isCurrent ? 10 : 7}
              />
              <text
                className={styles.nodeLabel}
                x={position.x}
                y={position.y + 24}
                textAnchor="middle"
              >
                {nodeLabel(node)}
              </text>
            </Link>
          );
        })}
      </svg>
    </section>
  );
}