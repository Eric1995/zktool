import { PropsWithChildren, useMemo } from 'react';
import { LanguageEnum } from './types/enum/lang';
import { App, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';

const defaultLang: LanguageEnum = (window.navigator.language.split('-')[0] as LanguageEnum) || LanguageEnum.zh;

function ZktoolApp({ children }: PropsWithChildren<{}>) {
  const antLang = useMemo(() => {
    switch (defaultLang) {
      case LanguageEnum.zh:
        return zhCN;
      case LanguageEnum.en:
        return enUS;
      default:
        return undefined;
    }
  }, []);

  return (
    <ConfigProvider
      locale={antLang}
      theme={{
        token: {
          colorPrimary: PRIMARY_COLOR,
          borderRadius: 2,
        },
      }}
    >
      <App style={{ height: '100%' }}>{children}</App>
    </ConfigProvider>
  );
}

export default ZktoolApp;
