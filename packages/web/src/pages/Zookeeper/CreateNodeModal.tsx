import { type ComponentProps, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { App, Form, FormInstance, Input, Modal, Radio, Select } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { useCreateNodeMutation } from '@/services/zookeeper';
import ZkNode from './ZkNode';

export enum CreateMode {
  PERSISTENT = 0,
  PERSISTENT_SEQUENTIAL = 2,
  EPHEMERAL = 1,
  EPHEMERAL_SEQUENTIAL = 3,
}

enum DataType {
  STRING = 1,
  BINARY = 2,
}

interface FormValues {
  name: string;
  mode: CreateMode;
  dataType: DataType;
  data?: string;
}

function ChildNodeForm({
  form,
  node,
  onSucceed,
  onLoading,
}: {
  form: FormInstance;
  node?: ZkNode | null;
  onSucceed?: Function;
  onLoading: Function;
}) {
  const { notification } = App.useApp();
  const [createNode, { isLoading }] = useCreateNodeMutation();
  const [dataType, setDataType] = useState<DataType>(DataType.STRING);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!node?.address) return;
      const decodedName = encodeURIComponent(values.name);
      const path = `${node.path}${node.path.endsWith('/') ? '' : '/'}${decodedName}`;
      let data = values.data ?? null;
      // 后台会对data进行base64解码，因此此处对字符串格式数据进行base64编码
      // 注意的是，如果用户选中了二进制格式，则此处的data是已经经过base64编码的了
      if (data && values.dataType === DataType.STRING) {
        // 将字符串统一编码为utf-8存储，utf-8可以兼容ascii
        const utf8 = new TextEncoder().encode(data);
        const utf8str = [...utf8].map((n) => String.fromCharCode(n)).join('');
        data = btoa(utf8str);
      }
      const res = await createNode({ zkAddress: node.address, body: { path, data, mode: values.mode } }).unwrap();
      if (res?.success) {
        onSucceed?.();
      } else {
        notification.error({ message: '创建节点出错', description: res.msg });
      }
    },
    [createNode, node, onSucceed, notification],
  );

  const onValueChange = useCallback<NonNullable<ComponentProps<typeof Form<FormValues>>['onValuesChange']>>(
    (changed: Partial<FormValues>, values) => {
      if (changed.dataType) {
        setDataType(changed.dataType);
      }
    },
    [],
  );

  const extraInfo = useMemo(() => {
    if (dataType === DataType.STRING) {
      return '字符串会以UTF-8形式进行存储';
    }
    return '需要将二进制数据编码为base64字符串，再粘贴到下方数据字段中';
  }, [dataType]);

  useEffect(() => onLoading(isLoading), [isLoading, onLoading]);

  return (
    <Form<FormValues> form={form} onFinish={onSubmit} labelCol={{ span: 4 }} onValuesChange={onValueChange}>
      <Form.Item name="name" label="节点名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="mode" label="创建模式" initialValue={CreateMode.PERSISTENT} rules={[{ required: true }]}>
        <Select<number>>
          <Select.Option value={CreateMode.PERSISTENT}>PERSISTENT</Select.Option>
          <Select.Option value={CreateMode.PERSISTENT_SEQUENTIAL}>PERSISTENT_SEQUENTIAL</Select.Option>
          <Select.Option value={CreateMode.EPHEMERAL}>EPHEMERAL</Select.Option>
          <Select.Option value={CreateMode.EPHEMERAL_SEQUENTIAL}>EPHEMERAL_SEQUENTIAL</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="dataType" label="数据格式" initialValue={DataType.STRING} extra={extraInfo}>
        <Radio.Group>
          <Radio value={DataType.STRING}>字符串</Radio>
          <Radio value={DataType.BINARY}>二进制</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        name="data"
        label="数据"
        validateTrigger="onChange"
        rules={[
          {
            validateTrigger: 'onChange',
            validator(_rule, value: string) {
              // 如果是二进制数据
              if (dataType === DataType.BINARY) {
                // 先用base64解码看看是否成功，如果不成功就说明不是二进制进行base64编码后字符串
                try {
                  atob(value);
                } catch (error) {
                  return Promise.reject(new Error('非Base64编码后数据'));
                }
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input.TextArea rows={12} />
      </Form.Item>
    </Form>
  );
}

function CreateNodeModal({ children, node, onCancel }: PropsWithChildren<{ node?: ZkNode | null; onCancel?: Function }>) {
  const { notification } = App.useApp();
  const [open, setOpen] = useState(false);
  const [form] = useForm<FormValues>();
  const [isLoading, setIsLoading] = useState(false);

  const onOpen = useCallback(() => setOpen(true), []);

  const onClose = useCallback(() => {
    setOpen(false);
    onCancel?.();
  }, [onCancel]);

  const onOk = useCallback(() => form?.submit(), [form]);

  const onSucceed = useCallback(() => {
    onCancel?.();
    setOpen(false);
    if (node) ZkNode.reload?.(node);
    notification.success({ message: '创建节点成功', description: '即将刷新节点' });
  }, [node, onCancel, notification]);

  return (
    <>
      <Modal open={open} title="创建子节点" width="80vw" onCancel={onClose} onOk={onOk} destroyOnClose confirmLoading={isLoading}>
        <ChildNodeForm form={form} node={node} onLoading={setIsLoading} onSucceed={onSucceed} />
      </Modal>
      <span onClick={onOpen}>{children}</span>
    </>
  );
}

export default CreateNodeModal;
