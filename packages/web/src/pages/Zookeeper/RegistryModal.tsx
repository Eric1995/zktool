import React, { type PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { App, Button, Form, Input, Modal, Table, Tooltip } from 'antd';
import { type ColumnsType } from 'antd/es/table';
import { useForm } from 'antd/es/form/Form';
import { DeleteOutlined, LinkOutlined, RedoOutlined } from '@ant-design/icons';
import { useAddZookeeperMutation, useConnectZookeeperMutation, useDeleteZookeeperMutation, useGetZookeeperListQuery } from '@/services/zookeeper';
import { ZookeeperDto } from '@/types/dto/zookeeper';
import isFQDN from 'validator/es/lib/isFQDN';
import isPort from 'validator/es/lib/isPort';

const patternIp =
  /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/;

function isDomainPort(address: string) {
  if (address.includes(':')) {
    const host = address.split(':')[0];
    const port = address.split(':')[1];
    if (isFQDN(host) && isPort(port)) return true;
  }
  return false;
}

function AddRegistryModal({ children }: PropsWithChildren<{}>) {
  const { notification } = App.useApp();
  const [open, setOpen] = useState(false);
  const [addZk] = useAddZookeeperMutation();
  const [form] = useForm();

  const onClick = useCallback(() => {
    setOpen(true);
  }, []);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const onSubmit = useCallback(
    async ({ address }: { address: string }) => {
      let validAddress = false;
      if (patternIp.test(address) || isDomainPort(address)) validAddress = true;
      if (!validAddress) {
        notification.warning({ message: '请输入正确的地址' });
        return;
      }
      const res = await addZk(address).unwrap();
      if (res.success) {
        notification.success({ message: '添加Zookeeper成功' });
        setOpen(false);
      }
    },
    [addZk, notification],
  );

  const onOk = useCallback(() => form.submit(), [form]);

  return (
    <>
      <Modal open={open} onCancel={onCancel} title="添加Zookeeper" onOk={onOk}>
        <Form form={form} onFinish={onSubmit}>
          <Form.Item
            name="address"
            rules={[
              { required: true, message: '请输入Zookeeper地址' },
              {
                validateTrigger: 'onChange',
                validator(_rule, value) {
                  if (!value || patternIp.test(value) || isDomainPort(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('请输入正确的Zookeeper地址'));
                },
              },
            ]}
          >
            <Input placeholder="IP:PORT格式或域名:PORT格式,不能填写多个地址" />
          </Form.Item>
        </Form>
      </Modal>
      <span onClick={onClick}>{children}</span>
    </>
  );
}

function RegistryModal({
  children,
  open: visible,
  onClose,
}: PropsWithChildren<{
  open?: boolean;
  onClose?: Function;
}>) {
  const { notification, modal } = App.useApp();
  const [open, setOpen] = useState(visible ?? false);
  const { data: zkList, refetch, isFetching } = useGetZookeeperListQuery();
  const [delZk] = useDeleteZookeeperMutation();
  const [connectZk] = useConnectZookeeperMutation();
  const [filterText, setFilterText] = useState<string | null>(null);

  const onChildClick = useCallback(() => {
    setOpen(true);
  }, []);

  const onCancel = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const connectZookeeper = useCallback(
    async (address: string) => {
      await connectZk(address).unwrap();
    },
    [connectZk],
  );

  const deleteRegistry = useCallback(
    async (address: string) => {
      modal.confirm({
        title: '确定删除注册中心',
        onOk: async () => {
          const res = await delZk(address).unwrap();
          if (res.success) {
            notification.success({ message: '删除注册中心成功' });
          }
        },
      });
    },
    [delZk, modal, notification],
  );

  const onInputFilterText = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  }, []);

  const filteredZkList = useMemo(() => {
    if (!zkList?.body) return [];
    const reversedZkList = [...zkList.body].reverse();
    if (!filterText) return reversedZkList;
    return reversedZkList.filter((zk) => zk.address.includes(filterText));
  }, [filterText, zkList]);

  const columns = useMemo(() => {
    const _columns: ColumnsType<ZookeeperDto> = [
      {
        title: () => {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Zookeeper地址</span>
              <Input value={filterText ?? undefined} onChange={onInputFilterText} />
            </div>
          );
        },
        dataIndex: 'address',
        render: (address: string, zk) => {
          let color;
          switch (zk.status) {
            case -1:
              color = 'rgb(117,117,117)';
              break;
            case 0:
              color = 'rgb(244,67,54)';
              break;
            case 1:
              color = 'rgb(67,160,71)';
              break;
            case 2:
              color = 'rgb(3,155,229)';
              break;
            default:
              color = 'rgb(117,117,117)';
          }
          return <span style={{ color }}>{address}</span>;
        },
      },
      {
        title: '状态',
        width: 100,
        dataIndex: 'status',
        render: (status: number): string => {
          switch (status) {
            case -1:
              return '断开';
            case 0:
              return '连接失败';
            case 1:
              return '已连接';
            case 2:
              return '连接中';
            default:
              return '未知';
          }
        },
      },
      {
        title: '操作',
        width: 100,
        render: (_, record) => {
          return (
            <React.Fragment>
              <Tooltip title="删除">
                <DeleteOutlined onClick={() => deleteRegistry(record.address)} />
              </Tooltip>
              &nbsp;&nbsp;&nbsp;&nbsp;
              {record.status === 0 || record.status === -1 ? (
                <Tooltip title="连接">
                  <LinkOutlined onClick={() => connectZookeeper(record.address)} />
                </Tooltip>
              ) : null}
            </React.Fragment>
          );
        },
      },
    ];
    return _columns;
  }, [connectZookeeper, deleteRegistry, filterText, onInputFilterText]);

  const reloadZks = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <>
      <Modal open={open} onCancel={onCancel} width="60vw" title="注册中心" footer={null}>
        <div style={{ marginBottom: 4 }}>
          <AddRegistryModal>
            <Button type="primary" size="small">
              添加Zookeeper
            </Button>
          </AddRegistryModal>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <Tooltip title="刷新">
            <Button type="primary" size="small" icon={<RedoOutlined />} shape="circle" onClick={reloadZks} />
          </Tooltip>
        </div>
        <Table<ZookeeperDto>
          size="small"
          loading={isFetching}
          columns={columns}
          dataSource={filteredZkList}
          rowKey="address"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            defaultPageSize: 10,
            pageSizeOptions: [5, 10, 15, 20, 100],
          }}
        />
      </Modal>
      <span onClick={onChildClick}>{children}</span>
    </>
  );
}

export default RegistryModal;
