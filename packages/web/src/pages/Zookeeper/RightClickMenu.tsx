import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSize } from 'ahooks';
import { Menu } from 'antd';
import CreateNodeModal from './CreateNodeModal';
import DeleteNode from './DeleteNode';
import ZkNode from './ZkNode';
import SetNodeDataModal from './SetNodeDataModal';

function RightClickMenu({
  open = false,
  pos = [0, 0],
  onClose,
  node = null,
  onClear,
}: {
  open?: boolean;
  pos?: [number, number];

  /** 右键菜单隐藏时 */
  onClose?: Function;
  node?: ZkNode | null;

  /** 清空右键菜单使用的节点，因为右键菜单隐藏时此节点还可能用的，不能在关闭右键菜单时清空此节点 */
  onClear?: Function;
}) {
  const [show, setShow] = useState(open);
  const showMenuRef = useRef(open);
  const menuEleRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const size = useSize(menuEleRef);

  const fixedPos = useMemo(() => {
    if (!size) return pos;
    const correctedPos = pos;
    const { clientHeight, clientWidth } = window.document.documentElement;
    const right = pos[0] + size.width; // 右键菜单右下角横坐标在视窗位置
    const bottom = pos[1] + size.height; // 右键菜单右下角纵坐标在视窗位置

    if (bottom - clientHeight >= 0) {
      // 右键菜单在高度上超出了视窗
      correctedPos[1] = pos[1] - size.height;
    }
    if (right - clientWidth >= 0) {
      // 右键菜单在宽度上超出了视窗
      correctedPos[0] = pos[0] - size.height;
    }
    return correctedPos;
  }, [pos, size]);

  const documentClickHandler = useCallback(() => onCloseRef.current?.(), []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const documentOnContextMenu = useCallback((event: Event) => {
    if (!showMenuRef.current) return;
    const ele = event.target as HTMLElement | null;
    if (!ele) return;
    // 循环查找父元素class名，如果有zk-node-right-menu元素，说明右键点击的元素为自定义右键菜单子元素，
    // 此时需要禁止弹出浏览器默认右键菜单，不然会出现双右键菜单情况
    const classSet = new Set<string>();
    let parent: HTMLElement | null = ele;
    while (parent) {
      classSet.add(parent.className);
      if (classSet.has('zk-node-right-menu')) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      parent = parent.parentElement;
    }

    // zk-node-name-span为树中节点元素class名，如果点击的是非此节点，说明用户右键点击了空白处，此时隐藏自定义右键菜单
    if (ele && ele.className !== 'zk-node-name-span') {
      onCloseRef.current?.();
    }
  }, []);

  useEffect(() => {
    window.document.addEventListener('click', documentClickHandler);
    // document.addEventListener('contextmenu', documentOnContextMenu);
    return () => {
      document.removeEventListener('click', documentClickHandler);
      // document.removeEventListener('contextmenu', documentOnContextMenu);
    };
  }, [documentClickHandler]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setShow(open);
    showMenuRef.current = open;
  }, [open]);

  return (
    <div
      className="zk-node-right-menu"
      ref={menuEleRef}
      style={{
        width: 200,
        borderRadius: 8,
        boxShadow: '0px 0px 4px 4px rgba(160, 160, 160, 0.15)',
        display: show ? 'block' : 'none',
        position: 'fixed',
        zIndex: 1,
        left: fixedPos[0],
        top: fixedPos[1],
      }}
    >
      <Menu
        selectedKeys={[]}
        items={[
          {
            key: '1',
            // disabled: !node?.isLeaf,
            label: (
              <DeleteNode node={node} onCancel={onClear}>
                <div>删除</div>
              </DeleteNode>
            ),
          },
          {
            key: '2',
            label: (
              <CreateNodeModal node={node} onCancel={onClear}>
                <div>添加子节点</div>
              </CreateNodeModal>
            ),
          },
          {
            key: '3',
            label: (
              <SetNodeDataModal node={node} onCancel={onClear}>
                <div>更改数据</div>
              </SetNodeDataModal>
            ),
          },
        ]}
      />
    </div>
  );
}

export default RightClickMenu;
