import { useState, useCallback, memo } from 'react';
import { Button } from 'antd';
import ZkNode from './ZkNode';
import ZkTreeNodeTitleIcons from './ZkTreeNodeTitleIcons';

function ZkTreeNodeTitleRaw({
  node,
  loadMore,
  pageSize = 50,
  onFilter,
}: {
  node: ZkNode;
  pageSize?: number;
  loadMore?: (parentPath: string, _pageSize?: number) => Promise<unknown>;
  onFilter?: Function;
}) {
  const [moreLoading, setMoreLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);

  const loadMoreNodes = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (node.parent && loadMore) {
        setMoreLoading(true);
        loadMore(node.parent, pageSize).then(() => {
          setMoreLoading(false);
        });
      }
    },
    [loadMore, node.parent, pageSize],
  );

  const loadAllNodes = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (node.parent && loadMore) {
        setAllLoading(true);
        loadMore(node.parent, 999999999).then(() => {
          setAllLoading(false);
        });
      }
    },
    [loadMore, node],
  );

  let content = null;
  if (node.nodeType === 'N') {
    content = (
      <div style={{ padding: '0 0' }}>
        <Button size="small" type="primary" loading={moreLoading} disabled={allLoading} onClick={loadMoreNodes}>
          加载更多
        </Button>
        <span style={{ display: 'inline-block', width: '1rem' }} />
        <Button disabled={moreLoading} size="small" loading={allLoading} onClick={loadAllNodes}>
          加载全部
        </Button>
      </div>
    );
  } else {
    content = (
      <p style={{ margin: 0, whiteSpace: 'nowrap' }}>
        <ZkTreeNodeTitleIcons node={node} onFilter={onFilter} />
        <span
          className="zk-node-name-span"
          style={{
            display: 'inline-block',
            minWidth: '200px',
            paddingLeft: '0.5rem',
            fontSize: window.portal ? '1.5rem' : 'initial',
            verticalAlign: 'middle',
          }}
        >
          {node.name}
        </span>
      </p>
    );
  }
  return content;
}

const ZkTreeNodeTitle = memo(ZkTreeNodeTitleRaw);
export default ZkTreeNodeTitle;
