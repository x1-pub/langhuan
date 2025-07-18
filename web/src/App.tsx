import { ConfigProvider } from 'antd'

import { ThemeProvider } from './components/theme';
import { LocaleProvider } from './components/locale';
import RouterRender from './routes';
import NotifyProvider from './components/notify';

function App() {

  return (
    <ConfigProvider prefixCls="langhuan" theme={{ token: { colorPrimary: '#54BEC1' }, cssVar: true }}>
      <LocaleProvider>
        <ThemeProvider>
          <NotifyProvider>
            <RouterRender />
          </NotifyProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>
  )
}

export default App
