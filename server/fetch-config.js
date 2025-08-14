const Doraemon = require('@x1.pub/doraemon')
const fs = require('fs')
const { app, secret } = require('./sensitive-config.json')

const testService = new Doraemon({ app, secret, env: 'test' })
const prodService = new Doraemon({ app, secret, env: 'prod' })

async function main() {
  const testRes = await testService.GetData('server', 'sensitive')
  const prodRes = await prodService.GetData('server', 'sensitive')

  if (testRes.code !== 0 || testRes.data?.length !== 1) {
    throw new Error(testRes.message || '获取 Test Doraemon 敏感配置失败')
  }
  if (prodRes.code !== 0 || prodRes.data?.length !== 1) {
    throw new Error(prodRes.message || '获取 Prod Doraemon 敏感配置失败')
  }

  const config = {
    test: JSON.parse(testRes.data[0].content),
    prod: JSON.parse(prodRes.data[0].content),
  }
  fs.writeFileSync('./doraemon.json', JSON.stringify(config))
}

main()
