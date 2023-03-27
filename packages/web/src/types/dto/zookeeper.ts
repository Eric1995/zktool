export interface ZookeeperDto {
  address: string;

  /** -1: 断开；0：连接失败；1：连接成功；2：连接中； */
  status: -1 | 0 | 1 | 2;
}

export interface ZookeeperNodeDto {
  authed: boolean;
  // data?: string;
  // ephemeral?: boolean;
  name: string;
  // numChildren?: number;
  // parent?: string;
  stat: {
    czxid: string;
    mzxid: string;
    ctime: number;
    mtime: number;
    version: number;
    cversion: number;
    aversion: number;
    ephemeralOwner: number;
    pzxid: string;
    dataLength: number;
    numChildren: number;
  };
}
