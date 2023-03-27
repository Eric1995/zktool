import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'antd';

function Header() {
  const [params] = useSearchParams();
  const hideHeader = params.get('header') === 'false';


  return (
    <header
      style={{ height: hideHeader ? 0 : 38, overflow: 'hidden', backgroundColor: PRIMARY_COLOR, boxShadow: `${PRIMARY_COLOR} 0px 0px 6px 2px` }}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', color: 'white', padding: 4 }}>
          <span style={{ fontSize: '1em' }}>服务诊断工具</span>
          <span style={{ padding: '4px 0px 0px 4px' }}>v1.0.0</span>
        </div>
        <div style={{ width: '10%' }} />
        <div style={{ color: 'white', paddingTop: 2, position: 'relative' }}>
    
        </div>
      </div>
    </header>
  );
}

export default Header;
