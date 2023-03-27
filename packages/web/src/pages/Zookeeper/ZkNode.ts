import { TreeNodeNormal } from 'antd/lib/tree/Tree';
import { ZookeeperNodeDto } from '@/types/dto/zookeeper';

class ZkNode implements TreeNodeNormal {
  key: string = '';

  /** 节点类型，D: 数据节点; N: 显示加载更多及加载全部的节点; */
  nodeType: 'D' | 'N';

  name: string | null;

  parent: string | null;

  children: ZkNode[];

  filteredCallback: Function | null = null;

  private _filtered: boolean = false;

  public get filtered(): boolean {
    return this._filtered;
  }

  public set filtered(value: boolean) {
    this._filtered = value;
    this.filteredCallback?.(value);
  }

  filterOption: {
    includes: string[];
    excludes: string[];
    minLength: number;
    maxLength: number;
  };

  expandCallback: ((expanded: boolean) => void) | null = null;

  /** 是否展开这个节点 */
  private _expanded: boolean = false;

  public get expanded(): boolean {
    return this._expanded;
  }

  public set expanded(value: boolean) {
    this._expanded = value;
    this.expandCallback?.(value);
  }

  /** 完整路径 */
  path: string = '';

  isLeaf?: boolean | undefined = true;

  rawDataChangeCallback: ((arg: ZookeeperNodeDto | null) => void) | null = null;

  private _rawData: ZookeeperNodeDto | null = null;

  public get rawData(): ZookeeperNodeDto | null {
    return this._rawData;
  }

  public set rawData(value: ZookeeperNodeDto | null) {
    this.rawDataChangeCallback?.(value);
    this._rawData = value;
    if (value?.stat && value?.stat.numChildren > 0) this.isLeaf = false;
    if (value?.stat?.numChildren === 0) this.isLeaf = true;
  }

  address: string | null = null;

  clearChilren: Function | null = null;

  static reload?: (node: ZkNode) => void;

  static nodeMap: Map<string, ZkNode> = new Map();

  constructor(zkData: ZookeeperNodeDto | null, option?: Pick<ZkNode, 'parent'> & Partial<ZkNode>) {
    this.rawData = zkData;
    if (zkData && typeof option?.parent === 'string' && option.name) {
      const path =
        option.parent?.endsWith('/') || option?.name?.startsWith('/') ? `${option.parent}${option.name}` : `${option.parent}/${option.name}`;
      this.key = path;
      this.path = path;
    }
    if (!zkData && option?.nodeType === 'N') {
      this.key = `${option.parent}/loadeMore111111111111`;
    }
    this.address = option?.address ?? this.address;
    this.nodeType = option?.nodeType ?? 'D';
    this.name = zkData?.name || option?.name || null;
    // this.title = option?.title ?? '';
    this.children = option?.children ?? [];
    this.parent = option?.parent ?? '';
    // this.data = option?.data ?? '';
    // this.ephemeral = option?.ephemeral ?? false;
    this.filtered = option?.filtered ?? false;
    this.filterOption = {
      includes: [],
      excludes: [],
      minLength: 1,
      maxLength: 99999999,
    };
    // this.pos = option?.pos ?? 0;
    // this.authed = option?.authed ?? false;
    // this.numChildren = option?.numChildren ?? 0;
    // this.stat = option?.stat ?? null;
    this.expanded = option?.expanded ?? false;
    // this.path = option?.path ?? '';
    if (zkData && zkData.stat.numChildren > 0) this.isLeaf = false;
    // this.isLeaf = zkData?.numChildren === 0;
  }

  static clone(node: ZkNode) {
    const n = new ZkNode(node.rawData);
    return Object.assign(n, node);
  }
}

export default ZkNode;
