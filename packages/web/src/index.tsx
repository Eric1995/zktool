import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import routeList from './config/route';
import { store } from './model';
import ZktoolApp from './App';

function RouteElement() {
  const routeElement = useRoutes(routeList);
  return routeElement;
}

export function AppWrapper() {
  return (
    <Provider store={store}>
      <ZktoolApp>
        <BrowserRouter>
          <RouteElement />
        </BrowserRouter>
      </ZktoolApp>
    </Provider>
  );
}

const container = document.getElementById('root');
if (container) {
  const root: ReactDOM.Root | null = ReactDOM.createRoot(container);
  root.render(<AppWrapper />);
}
