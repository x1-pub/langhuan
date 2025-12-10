import { lazy } from 'react';
import { Routes, Route, BrowserRouter, useParams } from 'react-router';

import { EConnectionType } from '@packages/types/connection';

const Welcome = lazy(() => import('@/pages/welcome'));
const NotFound = lazy(() => import('@/pages/not-found'));
const DBListLayout = lazy(() => import('@/components/db-list-layout'));
const HeaderLayout = lazy(() => import('@/components/header-layout'));
const NotSelected = lazy(() => import('@/pages/not-selected'));
const MysqlViewer = lazy(() => import('@/pages/mysql-viewer'));
const MongodbViewer = lazy(() => import('@/pages/mongodb-viewer'));
const RedisViewer = lazy(() => import('@/pages/redis-viewer'));
const Shell = lazy(() => import('@/pages/shell'));

const DatabaseViewer = () => {
  const { connectionType } = useParams<{ connectionType: EConnectionType }>();

  switch (connectionType) {
    case EConnectionType.MYSQL:
      return <MysqlViewer />;
    case EConnectionType.REDIS:
      return <RedisViewer />;
    case EConnectionType.MONGODB:
      return <MongodbViewer />;
    default:
      return <NotFound />;
  }
};

const RouterRender: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<HeaderLayout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/:connectionType/:connectionId" element={<DBListLayout />}>
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
