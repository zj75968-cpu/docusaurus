/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useMemo} from 'react';
import {useLocation} from '@docusaurus/router';
import {
  useActivePlugin,
  useAllDocsData,
} from '@docusaurus/plugin-content-docs/client';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import knowledgeGraphUtils from '@theme/knowledgeGraphUtils';
import type {
  GlobalPluginData,
  KnowledgeGraph,
  KnowledgeGraphNode,
} from '@docusaurus/plugin-content-docs/client';

type KnowledgeGraphDataState = {
  data?: GlobalPluginData;
  graph?: KnowledgeGraph;
  currentNode?: KnowledgeGraphNode;
  relatedNodes: KnowledgeGraphNode[];
};

export default function useKnowledgeGraphData(options: {
  pluginId?: string;
  docId?: string;
} = {}): KnowledgeGraphDataState {
  const {pathname} = useLocation();
  const {withBaseUrl} = useBaseUrlUtils();
  const activePlugin = useActivePlugin();
  const allDocsData = useAllDocsData();
  const pluginId = options.pluginId ?? activePlugin?.pluginId;
  const data = pluginId ? allDocsData[pluginId] : undefined;
  const graph = data?.graph;

  const currentNode = useMemo(
    () =>
      knowledgeGraphUtils.findCurrentGraphNode({
        graph,
        docId: options.docId,
        pathname,
        withBaseUrl,
      }),
    [graph, options.docId, pathname, withBaseUrl],
  );

  const relatedNodes = useMemo(
    () => knowledgeGraphUtils.getRelatedGraphNodes({graph, currentNode}),
    [currentNode, graph],
  );

  return {data, graph, currentNode, relatedNodes};
}