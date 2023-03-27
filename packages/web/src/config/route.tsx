import { RouteObject } from 'react-router-dom';
import Home from '@/pages/Home/Home';
import Zookeeper from '@/pages/Zookeeper';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/Zookeeper',
    element: <Zookeeper />,
  },
  {
    path: '*',
    element: <Zookeeper />,
  },
];

export default routes;
