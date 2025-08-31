import { ConfigProvider } from 'antd'

import { ThemeProvider } from './components/theme';
import { LocaleProvider } from './components/locale';
import RouterRender from './routes';

function App() {

  return (
    <ConfigProvider prefixCls="langhuan" theme={{ token: { colorPrimary: '#54BEC1' }, cssVar: true }}>
      <LocaleProvider>
        <ThemeProvider>
          <RouterRender />
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>
  )
}

export default App
