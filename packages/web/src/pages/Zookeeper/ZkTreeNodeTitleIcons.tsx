import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { Tooltip, Button } from 'antd';
import { LockOutlined, ClockCircleOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import ZkNode from './ZkNode';

function ZkTreeNodeTitleIconsRaw({ node, onFilter }: { node: ZkNode; onFilter?: Function }) {
  const [, setRefresh] = useState(false);
  const [expanded, setExpanded] = useState(node.expanded);
  const [numChildren, setNumChildren] = useState(node.rawData?.stat.numChildren ?? 0);

  const setFilterNode = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (node.expanded) return;
      onFilter?.(node);
    },
    [node, onFilter],
  );

  useEffect(() => {
    if (!node) return;
    node.expandCallback = (v) => {
      setExpanded(v);
      // setRefresh((pre) => !pre);
    };
    node.filteredCallback = () => {
      setRefresh((pre) => !pre);
    };
    node.rawDataChangeCallback = (value) => {
      setNumChildren(value?.stat.numChildren ?? 0);
      // setRefresh((pre) => !pre);
    };
  }, [node]);

  const ACLicon = useMemo(() => {
    if (!node.rawData?.authed) return null;
    return (
      <span>
        <Tooltip title="有权限">
          <LockOutlined color="rgb(244,67,54)" />
        </Tooltip>
      </span>
    );
  }, [node]);

  const EphemeralIcon = useMemo(() => {
    if (!node.rawData?.stat?.ephemeralOwner) return null;
    return (
      <span style={{ paddingRight: '0.3rem' }}>
        <Tooltip title="临时节点">
          <ClockCircleOutlined />
        </Tooltip>
      </span>
    );
  }, [node]);

  const ChildrenNumberIcon = useMemo(() => {
    if (!numChildren) return null;
    return (
      <Tooltip title={`${numChildren}个子节点`}>
        <span
          style={{
            fontWeight: 300,
            fontSize: '0.8rem',
            borderRadius: '50px',
            height: 'min-content',
            backgroundColor: 'rgb(76,175,80)',
            color: 'white',
            lineHeight: 1,
            padding: '2px 6px',
          }}
        >
          {numChildren}
        </span>
      </Tooltip>
    );
  }, [numChildren]);

  const FilterIcon = useMemo(() => {
    if (node.rawData?.authed || node.isLeaf) return null;
    return (
      <Tooltip title={`${node.filtered ? '已设置' : '未设置'}'过滤条件'`}>
        <Button
          style={{ cursor: expanded ? 'not-allowed' : 'unset' }}
          type={node.filtered ? 'primary' : 'default'}
          size="small"
          shape="circle"
          icon={<FilterOutlined />}
          onClick={setFilterNode}
        />
      </Tooltip>
    );
  }, [expanded, node.filtered, node.isLeaf, node.rawData?.authed, setFilterNode]);

  const reloadIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!node) return;
      ZkNode.reload?.(node);
    },
    [node],
  );

  const ReloadIcon = useMemo(() => {
    if (node.rawData?.authed || node.isLeaf) return null;
    return (
      <Tooltip title="重新加载">
        <Button
          type="primary"
          size="small"
          shape="circle"
          icon={<ReloadOutlined />}
          style={{ backgroundColor: 'rgb(0,188,212)' }}
          onClick={reloadIconClick}
        />
      </Tooltip>
    );
  }, [node.isLeaf, node.rawData?.authed, reloadIconClick]);

  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', verticalAlign: 'middle' }}>
      {ACLicon}
      {EphemeralIcon}
      {ChildrenNumberIcon}
      {FilterIcon}
      {ReloadIcon}
    </span>
  );
}

const ZkTreeNodeTitleIcons = memo(ZkTreeNodeTitleIconsRaw);
export default ZkTreeNodeTitleIcons;
