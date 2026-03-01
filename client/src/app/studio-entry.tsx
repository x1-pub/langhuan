import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/components/theme';
import { LocaleProvider } from '@/components/locale';
import RouterRender from '@/routes';
import { queryClient } from '@/utils/trpc';

const StudioEntry = () => {
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
};

export default StudioEntry;
