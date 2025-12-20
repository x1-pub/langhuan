import { lazy } from 'react';
import { Routes, Route, BrowserRouter, useParams } from 'react-router';

import { EConnectionType } from '@packages/types/connection';

const Welcome = lazy(() => import('@/pages/welcome'));
const NotFound = lazy(() => import('@/pages/not-found'));
const MenuLayout = lazy(() => import('@/components/menu-layout'));
const HeaderLayout = lazy(() => import('@/components/header-layout'));
const NotSelected = lazy(() => import('@/pages/not-selected'));
const MysqlViewer = lazy(() => import('@/pages/mysql-viewer'));
const MongodbCollectionViewer = lazy(() => import('@/pages/mongodb-collection-viewer'));
const RedisDatabaseViewer = lazy(() => import('@/pages/redis-database-viewer'));
const Shell = lazy(() => import('@/pages/shell'));

const DatabaseViewer = () => {
  const { connectionType } = useParams<{ connectionType: EConnectionType }>();

  switch (connectionType) {
    case EConnectionType.MYSQL:
      return <MysqlViewer />;
    case EConnectionType.REDIS:
      return <RedisDatabaseViewer />;
    case EConnectionType.MONGODB:
      return <MongodbCollectionViewer />;
    default:
      return <NotFound />;
  }
};

const RouterRender: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<HeaderLayout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/:connectionType/:connectionId" element={<MenuLayout />}>
          <Route path="/:connectionType/:connectionId" element={<DatabaseViewer />} />
        </Route>
        <Route path="/notselected" element={<NotSelected />} />
      </Route>
      <Route path="/:connectionType/:connectionId/shell" element={<Shell />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default RouterRender;
