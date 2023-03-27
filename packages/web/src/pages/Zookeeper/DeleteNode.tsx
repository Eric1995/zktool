import { type PropsWithChildren, useCallback } from 'react';
import { App, Modal } from 'antd';
import { useDeleteZkNodeMutation } from '@/services/zookeeper';
import ZkNode from './ZkNode';

function DeleteNode({ children, node, onCancel }: PropsWithChildren<{ node?: ZkNode | null; onCancel?: Function }>) {
  const { notification } = App.useApp();
  const [delNode] = useDeleteZkNodeMutation();
  const [modal, contextHolder] = Modal.useModal();

  const onDelConfirm = useCallback(async () => {
    if (!node?.address || !node?.parent) return;
    const res = await delNode({ zkAddress: node.address, path: node.path }).unwrap();
    if (res.success) {
      const parentNode = ZkNode.nodeMap.get(node.parent);
      if (parentNode) ZkNode.reload?.(parentNode);
      onCancel?.();
      notification.success({ message: '删除节点成功', description: '即将刷新节点' });
    } else {
      notification.error({ message: '删除节点失败', description: res.msg });
    }
  }, [delNode, node, onCancel, notification]);

  const onDelCancel = useCallback(() => onCancel?.(), [onCancel]);

  const onClick = useCallback(() => {
    if (!node) return;
    modal.confirm({
      title: '删除节点',
      content: `确定删除节点 ${node.path}${node.rawData?.stat.numChildren ? '及子节点' : ''} ?`,
      onOk: onDelConfirm,
      onCancel: onDelCancel,
    });
  }, [modal, node, onDelCancel, onDelConfirm]);

  return (
    <>
      {contextHolder}
      <span onClick={onClick}>{children}</span>
    </>
  );
}

export default DeleteNode;
