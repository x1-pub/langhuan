import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Spin } from 'antd';

const HomeEntry = lazy(() => import('./app/home-entry'));
const StudioEntry = lazy(() => import('./app/studio-entry'));

function App() {
  const fallback = (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Spin size="large" />
    </div>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/" element={<HomeEntry />} />
          <Route path="/*" element={<StudioEntry />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
