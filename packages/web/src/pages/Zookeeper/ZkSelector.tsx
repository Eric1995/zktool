import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { App, Select } from 'antd';
import { useGetZookeeperListQuery } from '@/services/zookeeper';
import { ZookeeperDto } from '@/types/dto/zookeeper';
import { useSearchParams } from 'react-router-dom';

interface ZkSelectorProps {
  value?: string | null;
  onChange?: (zk: string) => void;
  id?: string;
}

function ZkSelectorRaw({ value, onChange, id, ...props }: ZkSelectorProps) {
  const { notification } = App.useApp();
  const { data, isFetching } = useGetZookeeperListQuery();
  const [params] = useSearchParams();
  const searchUsedRef = useRef(false);

  const zkList = useMemo(() => (data?.body ? [...data.body].reverse() : []), [data?.body]);

  // 在线的zookeeper列表，只有在线的zookeeper才能查看节点
  const connectedZkList = useMemo(() => zkList.filter((zk) => zk.status === 1) ?? [], [zkList]);

  useEffect(() => {
    const zkAddress = params.get('zkAddress');
    if (searchUsedRef.current || isFetching || !zkAddress || value === zkAddress) return;
    if (zkAddress) {
      const zk = zkList.find((d) => d.address === zkAddress);
      if (!zk) {
        notification.error({ message: '找不到URL中的注册中心地址', description: '请到注册中心添加该地址' });
        return;
      }
      if (zk && zk.status !== 1) {
        notification.error({ message: '无法选中URL中的Zookeeper', description: '该Zookeeper未连接成功' });
        return;
      }
      onChange?.(zkAddress);
      searchUsedRef.current = true;
    }
  }, [isFetching, onChange, params, value, zkList, notification]);

  const onZkSelect = useCallback(
    (zk: string): void => {
      onChange?.(zk);
    },
    [onChange],
  );

  const textColor = useCallback((zk: ZookeeperDto) => {
    switch (zk.status) {
      case -1:
        return 'rgb(117,117,117)';
      case 0:
        return 'rgb(244,67,54)';
      case 1:
        return 'rgb(67,160,71)';
      case 2:
        return 'rgb(3,155,229)';
      default:
        return 'rgb(117,117,117)';
    }
  }, []);

  return (
    <Select showSearch style={{ width: '100%' }} value={value} onSelect={onZkSelect} id={id}>
      {connectedZkList.map((zk) => {
        return (
          <Select.Option key={zk.address} value={zk.address}>
            <a style={{ color: textColor(zk) }}>{zk.address}</a>
          </Select.Option>
        );
      })}
    </Select>
  );
}
const ZkSelector = memo(ZkSelectorRaw);
export default ZkSelector;
