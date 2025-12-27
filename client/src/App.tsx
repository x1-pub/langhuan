import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from './utils/trpc';
import { ThemeProvider } from './components/theme';
import { LocaleProvider } from './components/locale';
import RouterRender from './routes';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        prefixCls="langhuan"
        theme={{ token: { colorPrimary: '#54BEC1' }, cssVar: { prefix: 'langhuan' } }}
      >
        <LocaleProvider>
          <ThemeProvider>
            <RouterRender />
          </ThemeProvider>
        </LocaleProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
