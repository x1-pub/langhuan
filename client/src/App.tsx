import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';

const HomeEntry = lazy(() => import('./app/home-entry'));
const StudioEntry = lazy(() => import('./app/studio-entry'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomeEntry />} />
          <Route path="/*" element={<StudioEntry />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
