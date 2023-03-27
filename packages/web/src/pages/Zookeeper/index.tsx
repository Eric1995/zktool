import { useCallback, useRef, useState, useEffect, type ComponentProps } from 'react';
import { Button, Tree } from 'antd';
import { EventDataNode } from 'antd/es/tree';
import { useSize } from 'ahooks';
import { useGetZookeeperListQuery, useLazyGetZkNodeQuery, useQueryNodeChildrenMutation } from '@/services/zookeeper';
import { ZookeeperDto } from '@/types/dto/zookeeper';
import ZkNode from './ZkNode';
import ZkSelector from './ZkSelector';
import RegistryModal from './RegistryModal';
import ZkNodeDetailPanel from './ZkNodeDetailPanel';
import LoadFilterModal from './LoadFilterModal';
import RightClickMenu from './RightClickMenu';
import ZkTreeNodeTitle from './ZkTreeNodeTitle';
import { css } from '@emotion/react';

function Zookeeper() {
  const [zk, setZk] = useState<ZookeeperDto | null>(null);
  const [zookeeperTreeData, setZookeeperTreeData] = useState<ZkNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [loadKeys, setLoadKeys] = useState<Set<string>>(new Set());
  const [selNode, setSelNode] = useState<ZkNode | null>(null);
  const [filterNode, setFilterNode] = useState<ZkNode | null>(null);
  const nodeMap = useRef<Map<string, ZkNode>>(ZkNode.nodeMap);
  const { data: zkList } = useGetZookeeperListQuery();
  const [trigger] = useLazyGetZkNodeQuery();
  const [queryNodeChilren] = useQueryNodeChildrenMutation();
  const [pageSize] = useState(50);
  const treeWrapperRef = useRef<HTMLDivElement>(null);
  const treeWrapperSize = useSize(treeWrapperRef.current);
  const [clickMenuPos, setClickMenuPos] = useState<[number, number]>([0, 0]);
  const [rightClickNode, setRightClickNode] = useState<ZkNode | null>(null);
  const [showRightClickMenu, setShowRightClickMenu] = useState(false);
  // const params = useParams();

  const onZookeeperSelectorChange = useCallback(
    async (zkAddr: string) => {
      const selZk = zkList?.body.find((zk) => zk.address === zkAddr);
      if (!selZk) return;
      setZk(selZk);
      const res = await trigger({ zkAddress: zkAddr, path: '/' }).unwrap();
      if (!res.body) return;
      const root = new ZkNode({ ...res.body, authed: false }, { parent: '', address: selZk.address, name: res.body.name || '/' });
      nodeMap.current.set('/', root);
      setZookeeperTreeData([root]);
    },
    [trigger, zkList],
  );

  // 清空某个节点的所有子节点信息
  const clearChildren = useCallback((node: ZkNode) => {
    node.children = [];
    setExpandedKeys((pre) => new Set([...pre].filter((k) => !k.startsWith(node.key))));
    setLoadKeys((pre) => new Set([...pre].filter((k) => !k.startsWith(node.key))));
    nodeMap.current.forEach((_, k) => {
      if (k.startsWith(node.key) && k !== node.key) nodeMap.current.delete(k);
    });
  }, []);

  // 重新加载节点和其子节点内容
  const reloadNode = useCallback(
    async (treeNode: ZkNode) => {
      if (!treeNode.address) return;
      // 重新获取该节点自身信息
      const res = await trigger({ zkAddress: treeNode.address, path: treeNode.path }).unwrap();
      // 后台接口有问题，单独获取Node信息无法获取到name，parent属性，但是获取子节点列表时子节点可以获取到name，parent属性，因此使用之前的name，parent
      // authed同理
      if (res.body && treeNode.rawData) {
        treeNode.rawData = { ...res.body, name: treeNode.rawData.name, authed: treeNode.rawData.authed };
      }
      clearChildren(treeNode);
      setZookeeperTreeData((pre) => [...pre]);
      // 如果刷新时该节点是展开状态，重新展开该节点
      if (treeNode.expanded) setExpandedKeys((pre) => new Set([...pre, treeNode.key]));
    },
    [clearChildren, trigger],
  );

  const loadChilren = useCallback(
    async (parentPath: string, _pageSize?: number) => {
      const parent = nodeMap.current.get(parentPath);
      if (!parent) return Promise.resolve();
      const lastNode = parent.children.at(-1);
      // 最后一个子节点是数据节点，而不是加载按钮节点，说明子节点已经全部加载完了
      if (lastNode?.nodeType === 'D') return Promise.resolve();
      const childSize = lastNode?.nodeType === 'N' ? parent.children.length - 1 : parent.children.length;
      const res = await queryNodeChilren({
        zkAddress: zk?.address,
        path: parentPath,
        pos: childSize,
        pageSize: _pageSize ?? pageSize,
        ...parent.filterOption,
      }).unwrap();
      if (lastNode?.nodeType === 'N') parent.children.pop();
      const data = res.body;
      data.forEach((node) => {
        const treeNode = new ZkNode(node, { parent: parentPath, address: zk?.address, name: node.name });
        treeNode.clearChilren = clearChildren;
        nodeMap.current.set(treeNode.path, treeNode);
        if (parent.children) parent.children.push(treeNode);
      });
      // 如果data.length < pageSize，说明符合过滤条件的子节点全部加载完成
      if (parent.rawData && parent.children.length < parent.rawData?.stat.numChildren && data.length === pageSize) {
        if (lastNode?.nodeType === 'N') {
          parent.children.push(lastNode);
        } else {
          const loadNode = new ZkNode(null, { parent: parent.path, nodeType: 'N' });
          parent.children.push(loadNode);
        }
      }
      setLoadKeys((pre) => new Set([...pre, parentPath]));
      setZookeeperTreeData((pre) => [...pre]);
      return Promise.resolve();
    },
    [clearChildren, pageSize, queryNodeChilren, zk],
  );

  const loadTreeData = useCallback((treeNode: EventDataNode<{}>) => loadChilren(treeNode.key as string), [loadChilren]);

  const titleRender = useCallback(
    (node: ZkNode) => <ZkTreeNodeTitle node={node} loadMore={loadChilren} pageSize={pageSize} onFilter={setFilterNode} />,
    [loadChilren, pageSize],
  );

  const clear = useCallback(() => {
    setExpandedKeys(new Set());
    setLoadKeys(new Set());
    nodeMap.current.clear();
    setSelNode(null);
    setZookeeperTreeData([]);
    setFilterNode(null);
    setRightClickNode(null);
    setShowRightClickMenu(false);
  }, []);

  const onFilterModalClose = useCallback(() => {
    setFilterNode(null);
  }, []);

  const onNodeSelect = useCallback<NonNullable<ComponentProps<typeof Tree<ZkNode>>['onSelect']>>(
    (_selectedKeys, { node }) => setSelNode(nodeMap.current.get(node.key) ?? null),
    [],
  );

  const onTreeExpand = useCallback<NonNullable<ComponentProps<typeof Tree<ZkNode>>['onExpand']>>((_, { expanded, node }) => {
    if (expanded) {
      setExpandedKeys((pre) => new Set([...pre, node.key]));
    } else {
      setExpandedKeys((pre) => {
        pre.delete(node.key);
        return new Set([...pre]);
      });
    }
    const zkNode = nodeMap.current.get(node.key);
    if (zkNode) zkNode.expanded = expanded;
  }, []);

  const onTreeNodeRightClick = useCallback<NonNullable<ComponentProps<typeof Tree<ZkNode>>['onRightClick']>>(({ event, node }) => {
    if (!treeWrapperRef.current) return;
    setShowRightClickMenu(true);
    setClickMenuPos([event.clientX, event.clientY]);
    const zkNode = nodeMap.current.get(node.key);
    setRightClickNode(zkNode ?? null);
  }, []);

  const onRightClickMenuClose = useCallback(() => setShowRightClickMenu(false), []);
  const onRightClickMenuClear = useCallback(() => setRightClickNode(null), []);

  // 当选中的Zookeeper更改后，需要清空缓存的信息
  useEffect(() => {
    clear();
  }, [clear, zk]);

  useEffect(() => {
    if (!zkList?.body) {
      setZk(null);
    } else if (zk) {
      // 如果当前选中的zk不存在了
      if (!zkList.body.find((z) => z.address === zk.address)) {
        setZk(null);
      }
    }
  }, [zk, zkList]);

  useEffect(() => {
    ZkNode.reload = reloadNode;
  }, [reloadNode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 6, gap: 4 }}>
      <LoadFilterModal node={filterNode} onCancel={onFilterModalClose} />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 400 }}>
          <ZkSelector value={zk?.address} onChange={onZookeeperSelectorChange} />
        </div>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <RegistryModal>
          <Button type="primary">注册中心</Button>
        </RegistryModal>
      </div>
      <div style={{ width: '100%', gap: 4, flexGrow: 1, overflow: 'hidden', flexBasis: 0, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '68%', height: '100%', position: 'relative', left: 0, border: '1px solid #f0f0f0', backgroundColor: 'white' }}>
          <div
            css={css`
              &::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              &::-webkit-scrollbar-track {
                background-color: transparent;
              }
              &::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.5);
                border-radius: 10px;
              }
            `}
            ref={treeWrapperRef}
            style={{
              height: '100%',
              width: '100%',
              scrollbarColor: 'gray',
              scrollbarWidth: 'thin',
              position: 'relative',
              scrollbarGutter: 'stable both-edges',
            }}
          >
            <RightClickMenu
              open={showRightClickMenu}
              node={rightClickNode}
              pos={clickMenuPos}
              onClear={onRightClickMenuClear}
              onClose={onRightClickMenuClose}
            />
            <Tree
              css={css`
                div[class$='-tree-list-holder'] {
                  overflow: hidden;
                }
              `}
              height={treeWrapperSize?.height}
              showLine
              titleRender={titleRender}
              expandedKeys={[...expandedKeys]}
              loadedKeys={[...loadKeys]}
              onExpand={onTreeExpand}
              loadData={loadTreeData}
              treeData={zookeeperTreeData}
              onSelect={onNodeSelect}
              onRightClick={onTreeNodeRightClick}
            />
          </div>
        </div>
        <div style={{ flexGrow: 1, flexBasis: 0, height: '100%', border: '1px solid #f0f0f0', backgroundColor: 'white', overflowY: 'auto' }}>
          <ZkNodeDetailPanel node={selNode} />
        </div>
      </div>
    </div>
  );
}

export default Zookeeper;
