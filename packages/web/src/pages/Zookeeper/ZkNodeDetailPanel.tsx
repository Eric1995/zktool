import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Modal, Row, Select, Table, Tabs, Tooltip } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { InfoCircleOutlined, PicCenterOutlined, RetweetOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ZkNode from './ZkNode';
import { useGetZkNodeDataQuery } from '@/services/zookeeper';
import { css } from '@emotion/react';
import CopyIcon from '@/components/CopyIcon';

function UrlDecodeModal({ children, url }: PropsWithChildren<{ url?: string | null }>) {
  const [open, setOpen] = useState(false);
  const [proto, setProto] = useState('');

  const urlObj = useMemo(() => {
    if (!url) return null;
    try {
      const decodedUrl = decodeURIComponent(url);
      let _url = new URL(decodedUrl);
      if (_url) {
        setProto(_url.protocol);
        _url = new URL(decodedUrl.replace(_url.protocol, 'http:'));
      }
      return _url;
    } catch (error) {
      return null;
    }
  }, [url]);

  const paramDataSource = useMemo(() => {
    if (!urlObj) return [];
    return [...urlObj.searchParams].map(([k, v]) => ({ key: k, value: v }));
  }, [urlObj]);

  const onBtnClick = useCallback(() => {
    setOpen(true);
  }, []);

  const onCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const paramTableColumns = useMemo<ColumnsType<{ key: string; value: string }>>(() => {
    return [
      {
        title: '属性',
        dataIndex: 'key',
      },
      {
        title: '值',
        dataIndex: 'value',
        render: (text: string) => {
          return <span style={{ wordBreak: 'break-word' }}>{text}</span>;
        },
      },
    ];
  }, []);

  if (!urlObj) return null;
  return (
    <>
      <Modal open={open} title="URL解析" width="80%" onCancel={onCancel} footer={null}>
        <Row>
          <Col span={4}>协议:</Col>
          <Col span={20}>{proto}</Col>
        </Row>
        <Row>
          <Col span={4}>地址:</Col>
          <Col span={20}>{urlObj.host}</Col>
        </Row>
        <Row>
          <Col span={4}>路径:</Col>
          <Col span={20}>{urlObj.pathname}</Col>
        </Row>
        <Row>
          <Col span={4}>查询参数:</Col>
        </Row>
        <Table
          size="small"
          columns={paramTableColumns}
          rowKey="key"
          dataSource={paramDataSource}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 15, 20],
          }}
        />
      </Modal>
      <span onClick={onBtnClick}>{children}</span>
    </>
  );
}

function ZkNodeNameTab({ node }: { node?: ZkNode | null }) {
  const [decode, setDecode] = useState(false);
  const [showDecodeBtn, setShowDecodeBtn] = useState(false);

  const displayName = useMemo(() => {
    if (!node?.name) return null;
    if (!decode) return node.name;
    return decodeURIComponent(node.name);
  }, [decode, node]);

  useEffect(() => {
    if (!node?.name) {
      setShowDecodeBtn(false);
      return;
    }
    try {
      if (decodeURIComponent(node.name) === node.name) {
        setShowDecodeBtn(false);
        return;
      }
    } catch (error) {
      setShowDecodeBtn(false);
      return;
    }
    setShowDecodeBtn(true);
  }, [node]);

  const onDecode = useCallback(() => setDecode((pre) => !pre), []);

  if (!node) return null;

  return (
    <div style={{ padding: '0.5rem 0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: '26px', width: '100%', marginBottom: '0.3rem' }}>
        <span style={{ display: 'flex', gap: 12 }}>
          {showDecodeBtn ? (
            <Tooltip title="解码名称">
              <Button onClick={onDecode} icon={<RetweetOutlined />} shape="circle" type={decode ? 'primary' : 'default'} />
            </Tooltip>
          ) : null}
          <UrlDecodeModal url={node?.name}>
            <Tooltip title="格式化URL">
              <Button icon={<PicCenterOutlined />} shape="circle" />
            </Tooltip>
          </UrlDecodeModal>
          <CopyIcon text={node?.name} />
        </span>
      </div>
      <pre
        style={{
          flexGrow: 1,
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          marginBottom: '0px',
          border: 'none',
          padding: '2px 2px',
          backgroundColor: '#f5f5f5',
          fontFamily: 'Consolas',
          overflow: 'auto',
        }}
      >
        {displayName}
      </pre>
    </div>
  );
}

function ZkNodeStatTab({ node }: { node?: ZkNode | null }) {
  const statTableColumns = useMemo<ColumnsType<{ key: string; value: string | number }>>(() => {
    return [
      {
        title: '属性',
        dataIndex: 'key',
        width: 140,
      },
      {
        title: '值',
        dataIndex: 'value',
        render: (text: string, record) => {
          if (record.key === 'ctime' || record.key === 'mtime') {
            return (
              <>
                <span style={{ wordBreak: 'break-word' }}>{text}</span>
                &nbsp;&nbsp;
                <Tooltip title={dayjs(record.value).format('YYYY-MM-DD HH:mm:ss')}>
                  <InfoCircleOutlined />
                </Tooltip>
              </>
            );
          }
          return <span style={{ wordBreak: 'break-word' }}>{text}</span>;
        },
      },
    ];
  }, []);

  const dataSource = useMemo(() => {
    if (!node || !node.rawData?.stat) return [];
    return Object.entries(node.rawData.stat).map(([k, v]) => ({ key: k, value: v }));
  }, [node]);

  if (!node) return null;
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Table<{
        key: string;
        value: string | number;
      }>
        size="small"
        columns={statTableColumns}
        dataSource={dataSource}
        rowKey="key"
        pagination={false}
      />
    </div>
  );
}

enum ZkNodeDataFormat {
  UTF8 = 1,
  DECIMAL = 2,
  HEX = 3,
  BINARY = 4,
  OCTAL = 5,
}

function ZkNodeDataTab({ node }: { node?: ZkNode | null }) {
  const { data } = useGetZkNodeDataQuery(
    {
      zkAddress: node?.address ?? '',
      path: node?.path ?? '',
    },
    { skip: !node },
  );

  const [format, setFormat] = useState<ZkNodeDataFormat>(ZkNodeDataFormat.UTF8);

  const formattedNodeData = useMemo(() => {
    if (!data?.body || !node) return null;
    let decoded = data.body;
    try {
      decoded = atob(data.body);
    } catch (error) {
      // to do
    }
    const utf8Str = new TextDecoder().decode(Uint8Array.from([...decoded].map((c) => c.charCodeAt(0))));
    let displayStr = format === ZkNodeDataFormat.UTF8 ? utf8Str : '';
    const byteList = [...decoded].map((c) => c.charCodeAt(0));
    if (format === ZkNodeDataFormat.DECIMAL) {
      byteList.forEach((n) => (displayStr = `${displayStr}  ${n.toString(10).padStart(3, '0')}`));
    }
    if (format === ZkNodeDataFormat.HEX) {
      byteList.forEach((n) => (displayStr = `${displayStr}  ${n.toString(16).padStart(2, '0')}`));
    }
    if (format === ZkNodeDataFormat.BINARY) {
      byteList.forEach((n) => (displayStr = `${displayStr}  ${n.toString(2).padStart(8, '0')}`));
    }
    if (format === ZkNodeDataFormat.OCTAL) {
      byteList.forEach((n) => (displayStr = `${displayStr}  ${n.toString(8).padStart(3, '0')}`));
    }
    if (format !== ZkNodeDataFormat.UTF8) {
      displayStr = displayStr.trim();
    } else {
      try {
        return JSON.stringify(JSON.parse(decoded), null, 4);
      } catch (e) {
        return displayStr;
      }
    }
    return displayStr;
  }, [data, format, node]);

  const onSelectFormat = useCallback((f: ZkNodeDataFormat) => {
    setFormat(f);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', padding: '0.5rem 0.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div>
        <span>展示格式&nbsp;&nbsp;</span>
        <Select<ZkNodeDataFormat> value={format} onSelect={onSelectFormat} style={{ width: 200 }}>
          <Select.Option value={ZkNodeDataFormat.UTF8}>UTF-8</Select.Option>
          <Select.Option value={ZkNodeDataFormat.DECIMAL}>10进制</Select.Option>
          <Select.Option value={ZkNodeDataFormat.HEX}>16进制</Select.Option>
          <Select.Option value={ZkNodeDataFormat.BINARY}>2进制</Select.Option>
          <Select.Option value={ZkNodeDataFormat.OCTAL}>8进制</Select.Option>
        </Select>
        &nbsp;&nbsp;&nbsp;&nbsp;
        {formattedNodeData ? <CopyIcon text={formattedNodeData} /> : null}
      </div>
      <pre
        style={{
          flexGrow: 1,
          wordBreak: 'break-word',
          whiteSpace: format === ZkNodeDataFormat.UTF8 ? 'pre' : 'pre-wrap',
          marginBottom: '0px',
          border: 'none',
          backgroundColor: '#f5f5f5',
          fontFamily: 'Consolas',
          overflow: 'auto',
        }}
      >
        {formattedNodeData}
      </pre>
    </div>
  );
}

function ZkNodeDetailPanel({ node }: { node?: ZkNode | null }) {
  return (
    <div
      css={css`
        height: 100%;
        padding: 0px 6px;
        & div[class$='tabs-content-holder'],
        & div[class*='tabs-content-top'],
        & div[class*='tabs-tabpane'] {
          height: 100%;
          overflow: hidden;
        }
      `}
    >
      <Tabs
        style={{ height: '100%' }}
        items={[
          {
            key: '1',
            label: '节点名称',
            children: <ZkNodeNameTab node={node} />,
          },
          {
            key: '2',
            label: '统计数据',
            children: <ZkNodeStatTab node={node} />,
          },
          {
            key: '3',
            label: '节点数据',
            children: <ZkNodeDataTab node={node} />,
          },
        ]}
      />
    </div>
  );
}

export default ZkNodeDetailPanel;
