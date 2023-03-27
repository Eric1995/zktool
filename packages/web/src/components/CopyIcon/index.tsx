import { useCallback } from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { App, Button, Tooltip } from 'antd';
import { copyToClip } from '@/util';

function CopyIcon({ text }: { text?: string | null }) {
  const { notification } = App.useApp();
  const copyToClipboard = useCallback(() => {
    if (!text) return;
    copyToClip(text);
    notification.success({ message: '复制成功' });
  }, [notification, text]);

  return (
    <Tooltip title="复制">
      <Button icon={<CopyOutlined />} type="text" shape="circle" onClick={copyToClipboard} />
    </Tooltip>
  );
}

export default CopyIcon;
