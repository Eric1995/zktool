import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { brotliCompressSync } from 'zlib';
import minimist from 'minimist';
import Koa from 'koa';
import Router from '@koa/router';
import { koaBody } from 'koa-body';
import zookeeper, { Stat, State } from 'node-zookeeper-client';
import open from 'open';
import { convertZkNodeStat, recursiveGetChildren, response, validateIpAndPort } from './util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __static = path.join(__dirname, process.env.NODE_ENV === 'development' ? '../dist/static' : './static');
const args = minimist(process.argv.slice(2));

const port = args.port || args.p || 8092;
const openBrowser = args.open || args.o;

let zookeeperList = [] as { address: string; status: -1 | 0 | 1 | 2 }[];
const registryJsonFilePath = path.resolve(process.cwd(), 'registry.json');
if (!fs.existsSync(registryJsonFilePath)) {
  fs.writeFileSync(registryJsonFilePath, '[]');
}
if (fs.existsSync(registryJsonFilePath)) {
  const fileStr = fs.readFileSync(registryJsonFilePath);
  zookeeperList = JSON.parse(fileStr.toString());
}

interface ZkClientHolder {
  connecting: boolean;
  client: zookeeper.Client;
  checkTimer: NodeJS.Timeout | null;
}

const zkClientMap = new Map<string, null | ZkClientHolder>();

const createZkClient = (address: string, replace?: boolean) => {
  let clientHolder = zkClientMap.get(address);
  if (clientHolder && !replace) return;
  if (clientHolder?.checkTimer) {
    clearTimeout(clientHolder.checkTimer);
    clientHolder.checkTimer = null;
  }
  const client = zookeeper.createClient(address, {
    retries: 0,
    sessionTimeout: 5000,
  });
  clientHolder = { connecting: true, client, checkTimer: null };
  zkClientMap.set(address, clientHolder);
  client.connect();
  client.on('state', () => {
    const holder = zkClientMap.get(address);
    if (holder) {
      holder.connecting = false;
    }
  });
  clientHolder.checkTimer = setTimeout(() => {
    const holder = zkClientMap.get(address);
    if (holder) holder.checkTimer = null;
    if (holder?.client.getState() === State.DISCONNECTED) {
      holder.connecting = false && holder?.client.close();
    }
  }, 5000);
};

function saveRegistryJson() {
  const addressList = [...new Set([...zkClientMap.keys()])];
  const writeJson = addressList.map((addr) => ({ address: addr, status: 0 }));
  fs.writeFileSync(registryJsonFilePath, JSON.stringify(writeJson));
}

const reconnectZkClient = (address: string) => {
  createZkClient(address, true);
};

process.on('exit', () => {
  zkClientMap.forEach((v) => {
    try {
      v?.client.close();
    } catch (error) {
      // to do
    }
  });
  zkClientMap.clear();
});

function getNodeInfo(_path: string, client: zookeeper.Client) {
  const name = _path === '/' ? _path : path.basename(_path);
  return new Promise<Record<string, any> | null>((resolve) => {
    const node: Record<string, any> = { authed: true, name };
    client.getACL(_path as string, (err, acls, stat) => {
      if (err) resolve(null);
      if (acls.some((acl) => acl.id.id === 'anyone' && acl.id.scheme === 'world')) node.authed = false;
      node.stat = convertZkNodeStat(stat);
      resolve(node);
    });
  });
}

function getConnectedClient(
  address: string,
  ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & Router.RouterParamContext<Koa.DefaultState, Koa.DefaultContext>, unknown>,
) {
  const holder = zkClientMap.get(address as string);
  if (!holder) {
    ctx.body = response(null, {
      success: false,
      code: 100,
      msg: `找不到${address}`,
    });
    return null;
  }
  if (holder.client.getState() === State.SYNC_CONNECTED || holder.client.getState() === State.CONNECTED_READ_ONLY) {
    return holder;
  }
  ctx.body = response(null, {
    success: false,
    code: 111,
    msg: `client of ${address} not connected`,
  });
  return null;
}

zookeeperList.forEach((zk) => {
  createZkClient(zk.address);
});

const app = new Koa();
const router = new Router();

router.get('/zookeeper/allZk', (ctx) => {
  const zkList = [...zkClientMap].filter(([, zk]) => zk) as [string, ZkClientHolder][];
  const zlInfo = zkList.map(([address, zk]) => {
    let status: number = zk.connecting ? 2 : 0;
    if (!zk.connecting) {
      const stateCode = zk.client.getState();
      switch (stateCode) {
        case State.SYNC_CONNECTED:
          status = 1;
          break;
        case State.DISCONNECTED:
          status = -1;
          break;
        default:
          status = 0;
          break;
      }
    }
    return {
      address,
      status,
    };
  });
  ctx.body = response(zlInfo);
});

router.get('/zookeeper/save', async (ctx) => {
  const { address } = ctx.request.query;
  if (!address) {
    ctx.body = response(null, {
      success: false,
      code: 2,
      msg: '请携带address参数',
    });
    return;
  }
  if (!validateIpAndPort(address as string)) {
    ctx.body = response(null, {
      success: false,
      code: 3,
      msg: '请使用正确的地址端口格式',
    });
    return;
  }
  createZkClient(address as string);
  saveRegistryJson();
  ctx.body = response('success');
});

router.get('/zookeeper/reconnect', async (ctx) => {
  const { address } = ctx.request.query;
  if (!address) {
    ctx.body = response(null, {
      success: false,
      code: 2,
      msg: '请携带address参数',
    });
    return;
  }
  if (!validateIpAndPort(address as string)) {
    ctx.body = response(null, {
      success: false,
      code: 3,
      msg: '请使用正确的地址端口格式',
    });
    return;
  }
  // 如果由于网络原因断开连接的话，必须重新创建连接
  reconnectZkClient(address as string);
  ctx.body = response('success');
});

router.delete('/zookeeper/delete', async (ctx) => {
  const { address } = ctx.request.query;
  if (!address) {
    ctx.body = response(null, {
      success: false,
      code: 2,
      msg: '请携带address参数',
    });
    return;
  }
  const clientHolder = zkClientMap.get(address as string);
  if (clientHolder) {
    clientHolder.client.close();
    zkClientMap.delete(address as string);
    saveRegistryJson();
  }
  ctx.body = response('success');
});

router.get('/zookeeper/node', async (ctx) => {
  const { zkAddress, path } = ctx.request.query;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  const children = await getNodeInfo(path as string, holder.client);
  ctx.body = response(children);
});

router.get('/zookeeper/node/data', async (ctx) => {
  const { zkAddress, path } = ctx.request.query;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  const data = await new Promise<string | null>((resolve) => {
    holder.client.getData(path as string, (err, data: Buffer | undefined) => {
      if (err || !data?.byteLength) {
        resolve(null);
        return;
      }
      resolve(data.toString('base64'));
    });
  });
  ctx.body = response(data);
});

router.post('/zookeeper/children', async (ctx) => {
  const { path, pos = 0, zkAddress, pageSize = 1000000, minLength = 0, maxLength = 99999999, includes = [], excludes = [] } = ctx.request.body;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  const children = await new Promise<string[]>((resolve) => {
    holder.client.getChildren(path, (err, _children) => {
      if (err) resolve([]);
      resolve(_children);
    });
  });
  const nodes = await Promise.all(children.map((child) => getNodeInfo(path.endsWith('/') ? `${path}${child}` : `${path}/${child}`, holder.client)));
  let filtered = nodes
    .filter((n) => !!n)
    .filter((n) => n!.name.length >= minLength && n!.name.length <= maxLength)
    .filter((n) => {
      const nameUpper = n!.name.toUpperCase();
      if (includes.length) {
        const includeUpper = (includes as string[]).map((s) => s.toUpperCase());
        if (includeUpper.every((s) => !nameUpper.includes(s))) return false;
      }
      if (excludes.length) {
        const excludeUpper = (excludes as string[]).map((s) => s.toUpperCase());
        if (excludeUpper.some((s) => nameUpper.includes(s))) return false;
      }
      return true;
    });
  filtered = filtered.slice(pos, pos + pageSize);
  ctx.body = response(filtered);
});

router.post('/zookeeper/node/setData', async (ctx) => {
  const { zkAddress } = ctx.request.query;
  const { body } = ctx.request;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  try {
    const result = await new Promise<Stat>((resolve, reject) => {
      const params = [body.path];
      if (body.data) {
        params.push(Buffer.from(body.data, 'base64'));
      }
      if (typeof body?.version === 'number') {
        params.push(body.version);
      }
      params.push((err: Error | zookeeper.Exception, stat: Stat) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stat);
      });
      holder.client.setData(...(params as [any, any, any, any]));
    });
    ctx.body = response(convertZkNodeStat(result));
  } catch (error) {
    const err = error as Error | zookeeper.Exception;
    ctx.body = response(null, { success: false, msg: err.name, code: 105 });
  }
});

router.post('/zookeeper/node/create', async (ctx) => {
  const { zkAddress } = ctx.request.query;
  const { body } = ctx.request;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  try {
    const result = await new Promise<string | null>((resolve, reject) => {
      const params = [body.path];
      if (body.data) {
        params.push(Buffer.from(body.data, 'base64'));
      }
      params.push((err: Error | zookeeper.Exception, path: string) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(path);
      });

      holder.client.create(...(params as [any, any, any]));
    });
    ctx.body = response(result);
  } catch (error) {
    const err = error as Error | zookeeper.Exception;
    ctx.body = response(null, { success: false, msg: err.name, code: 102 });
  }
});

router.delete('/zookeeper/node/delete', async (ctx) => {
  const { zkAddress, path } = ctx.request.query;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  try {
    const descendents: string[] = [];
    const res = await new Promise<boolean>(async (resolve, reject) => {
      await recursiveGetChildren(holder.client, path as string, descendents);
      let transaction = holder.client.transaction();
      descendents.forEach((p) => (transaction = transaction.remove(p)));
      transaction.commit((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    if (res) {
      ctx.body = response('success');
    }
  } catch (error) {
    const err = error as Error | zookeeper.Exception;
    ctx.body = response(null, { success: false, msg: err.name, code: 103 });
  }
});

router.get('/dubbo/instances', async (ctx) => {
  const { zkAddress, registryGroup, service } = ctx.request.query;
  const holder = getConnectedClient(zkAddress as string, ctx);
  if (!holder) return;
  const res = await new Promise<string[]>((resolve) => {
    const servicePath = path.posix.join('/', registryGroup as string, service as string);
    holder.client.getChildren(servicePath, (err, children) => {
      if (err) {
        resolve([]);
        return;
      }
      if (children.includes('providers')) {
        holder.client.getChildren(path.posix.join(servicePath, 'providers'), (err2, children2) => {
          if (err2) {
            resolve([]);
          } else {
            resolve(children2);
          }
        });
      } else {
        resolve([]);
      }
    });
  });
  ctx.body = response(res);
});

const htmlBuffer = fs.readFileSync(path.resolve(__static, 'index.html'));
const htmlBr = brotliCompressSync(htmlBuffer);
router.get(['/', '/Zookeeper'], async (ctx) => {
  ctx.response.set('content-type', 'text/html');
  ctx.response.set('content-encoding', 'br');
  ctx.body = htmlBr;
});

const jsBr = fs.readFileSync(path.resolve(__static, 'index.js.br'));
router.get(['/index.js'], async (ctx) => {
  ctx.response.set('content-type', 'application/javascript');
  ctx.response.set('content-encoding', 'br');
  ctx.body = jsBr;
});

app.use(koaBody());
app.use(router.routes()).use(router.allowedMethods());

try {
  http
    .createServer((req, res) => {
      return app.callback()(req, res);
    })
    .listen(port, () => {
      // eslint-disable-next-line no-console
      console.info(`open http://localhost:${port} in browser to use zktool`);
      if (!openBrowser) return;
      open(`http://localhost:${port}`);
    });
} catch (error) {
  console.error(error);
}
