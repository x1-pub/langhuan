const Doraemon = require('@x1.pub/doraemon')
const fs = require('fs')
const { app, secret } = require('./sensitive-config.json')

const service = new Doraemon({ app, secret })

async function main() {
  const res = await service.GetDataByGroupName('sensitive')
  if (res.code !== 0) {
    throw new Error(res.message || '获取 Doraemon 敏感配置失败')
  }
  const config = res.data.find(item => item.name === 'server')
  if (!config) {
    throw new Error('请检查 Doraemon 配置是否存在')
  }
  fs.writeFileSync('./doraemon.json', config.content)
}

main()
