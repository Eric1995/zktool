import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Tag } from 'antd';
import { FormInstance, useForm } from 'antd/es/form/Form';
import { PlusOutlined } from '@ant-design/icons';
import ZkNode from './ZkNode';

function MultiTagInput({ value, onChange }: { value?: string[]; onChange?: (value: string[]) => void }) {
  const [inputVal, setInputVal] = useState<string | null>(null);

  const onDelTag = useCallback(
    (_key: string, index: number) => {
      if (!value) return;
      value?.splice(index, 1);
      onChange?.([...value]);
    },
    [onChange, value],
  );

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
  }, []);

  const onAddTag = useCallback(() => {
    if (!inputVal) return;
    const list = value || [];
    list.push(inputVal);
    onChange?.([...list]);
    setInputVal(null);
  }, [inputVal, onChange, value]);

  return (
    <>
      {value?.map((v, i) => (
        <Tag key={v} closable onClose={() => onDelTag(v, i)}>
          {v}
        </Tag>
      ))}
      <Popconfirm icon={null} title={<Input value={inputVal ?? undefined} onChange={onInputChange} />} onConfirm={onAddTag}>
        <Button size="small" type="primary" shape="circle" icon={<PlusOutlined />} />
      </Popconfirm>
    </>
  );
}

type FormValues = ZkNode['filterOption'];

const initialFormValues: FormValues = {
  includes: [],
  excludes: [],
  minLength: 0,
  maxLength: 999999999,
};

const isSameSet = (s1: Set<unknown>, s2: Set<unknown>) => {
  if (s1.size !== s2.size) {
    return false;
  }
  return [...s1].every((i) => s2.has(i));
};

function isSameStrList(pre?: string[] | null, next?: string[] | null): boolean {
  if (!pre && !next) return true;
  if ((!pre && next) || (pre && !next)) return false;
  return isSameSet(new Set(pre), new Set(next));
}

function isSameCondition(pre: FormValues, next: FormValues) {
  if (pre.minLength !== next.minLength || pre.maxLength !== next.maxLength) return false;
  return isSameStrList(pre.includes, next.includes) && isSameStrList(pre.excludes, next.excludes);
}

function FilterForm({ node, onCancel, form }: { node: ZkNode | null; form: FormInstance<FormValues>; onCancel?: () => void }) {
  const onSubmit = useCallback(
    (values: FormValues) => {
      if (!node) return;
      // 如果节点过滤条件更改了
      if (!isSameCondition(node.filterOption, values)) {
        node.filtered = !isSameCondition(values, initialFormValues);
        node.filterOption = values;
        // 需要清除该节点所有子节点信息，重新按条件加载子节点
        node.clearChilren && node.clearChilren(node);
      }
      onCancel?.();
    },
    [node, onCancel],
  );

  useEffect(() => {
    if (node?.filtered) {
      if (!node.filterOption) {
        form.setFieldsValue(initialFormValues);
      } else {
        form.setFieldsValue({
          includes: [...node.filterOption.includes],
          excludes: [...node.filterOption.excludes],
          minLength: node.filterOption.minLength,
          maxLength: node.filterOption.maxLength,
        });
      }
    } else {
      form.setFieldsValue(initialFormValues);
    }
  }, [form, node]);
  return (
    <Form<FormValues> form={form} onFinish={onSubmit} initialValues={initialFormValues}>
      <Form.Item name="includes" label="包含">
        <MultiTagInput />
      </Form.Item>
      <Form.Item name="excludes" label="排除">
        <MultiTagInput />
      </Form.Item>
      <Form.Item name="minLength" label="最短">
        <InputNumber min={0} step={1} />
      </Form.Item>
      <Form.Item name="maxLength" label="最长">
        <InputNumber min={1} step={1} />
      </Form.Item>
    </Form>
  );
}

function LoadFilterModal({ node, onCancel }: { node: ZkNode | null; onCancel?: () => void }) {
  const [form] = useForm();
  const onOk = useCallback(() => form.submit(), [form]);

  return (
    <Modal title="过滤条件" open={!!node} onCancel={onCancel} onOk={onOk} destroyOnClose>
      <FilterForm form={form} node={node} onCancel={onCancel} />
      <Alert style={{ marginTop: '1rem' }} type="info" message="只会显示符合以上条件的节点" />
    </Modal>
  );
}

export default LoadFilterModal;
