import { PropsWithChildren } from 'react';
import Header from './Header';

function Layout({ children }: PropsWithChildren<{}>) {
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flexGrow: 1 }}>{children}</div>
    </div>
  );
}

export default Layout;
