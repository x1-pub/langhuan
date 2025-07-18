import { lazy } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router';

const Welcome = lazy(() => import('@/pages/welcome'))
const NotFound = lazy(() => import('@/pages/not-found'))
const MenuLayout = lazy(() => import('@/layout/index').then(m => ({ default: m.MenuLayout})))
const HeaderLayout = lazy(() => import('@/layout/index').then(m => ({ default: m.HeaderLayout})))
const NotSelected = lazy(() => import('@/pages/not-selected'))
const MysqlViewer = lazy(() => import('@/pages/mysql-viewer'))
const MongodbViewer = lazy(() => import('@/pages/mongodb-viewer'))
const RedisViewer = lazy(() => import('@/pages/redis-viewer'))
const Shell = lazy(() => import('@/pages/shell'))

const RouterRender: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<HeaderLayout />}>
        <Route path='/' element={<Welcome />} />
        <Route path='/mysql/:connectionId' element={<MenuLayout />}>
          <Route path="/mysql/:connectionId" element={<MysqlViewer />} />
        </Route>
        <Route path='/redis/:connectionId' element={<MenuLayout />}>
          <Route path="/redis/:connectionId" element={<RedisViewer />} />
        </Route>
        <Route path='/mongodb/:connectionId' element={<MenuLayout />}>
          <Route path="/mongodb/:connectionId" element={<MongodbViewer />} />
        </Route>
        <Route path='/notselected' element={<NotSelected />} />
      </Route>
      <Route path='/shell/:connectionType/:connectionId' element={<Shell />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)

export default RouterRender;