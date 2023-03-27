import { type Stat, type Client } from 'node-zookeeper-client';
import path from 'path';
import isFQDN from 'validator/lib/isFQDN';
import isPort from 'validator/lib/isPort';

export function convertZkNodeStat(stat: Stat) {
  const statObj: Record<string, any> = {};
  Object.keys(stat).forEach((k) => {
    // @ts-ignore
    const value = stat[k];
    if (value instanceof Buffer) {
      const numberStr = new BigUint64Array(new Uint8Array(value.buffer).reverse().buffer).toString();
      statObj[k] = numberStr <= `${Number.MAX_SAFE_INTEGER}` ? parseInt(numberStr, 10) : numberStr;
    } else if (typeof value === 'string' || typeof value === 'number') {
      // @ts-ignore
      statObj[k] = stat[k];
    }
  });
  return statObj;
}

export function response(data: unknown, option?: { success: boolean; msg: string; code: number }) {
  return {
    body: data,
    success: true,
    msg: 'success',
    code: 0,
    ...option,
  };
}

function validateNum(input: string, min: number, max: number) {
  const num = +input;
  return num >= min && num <= max && input === num.toString();
}

export function validateIpAndPort(input: string) {
  const parts = input.split(':');
  const ip = parts[0].split('.');
  const port = parts[1];
  return (
    validateNum(port, 1, 65535) &&
    ip.length === 4 &&
    ip.every((segment) => {
      return validateNum(segment, 0, 255);
    })
  );
}

function isDomainPort(address: string) {
  if (address.includes(':')) {
    const host = address.split(':')[0];
    const port = address.split(':')[1];
    if (isFQDN(host) && isPort(port)) return true;
  }
  return false;
}

export function isValidZkAddress(address: string) {
  return validateIpAndPort(address) || isDomainPort(address);
}

export async function recursiveGetChildren(client: Client, _path: string, descedents: string[]) {
  const children = await new Promise<string[]>((resolve) => {
    client.getChildren(_path, (err, _children) => {
      resolve(_children);
    });
  });
  if (children.length) {
    // console.dir(children);
    await Promise.allSettled(
      children.map((child) => {
        const childPath = path.posix.join(_path, child);
        return recursiveGetChildren(client, childPath, descedents);
      }),
    );
  }
  descedents.push(_path);
}
