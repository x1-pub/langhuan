import moduleAlias from 'module-alias'
import path from 'path'

const prod = process.env.NODE_ENV === 'production'
const alise = prod ? path.join(__dirname, '../../dist') : path.join(__dirname, '../../src')

moduleAlias.addAlias('@', alise)

moduleAlias()