import { Sequelize } from 'sequelize'
import chalk from 'chalk';

import config from '@/config/index'

const sequelize = new Sequelize(
  config.mysql.database,
  config.mysql.username,
  config.mysql.password,
  { ...config.mysql.option }
);


sequelize.authenticate()
  .then(() => {
    console.log(
      chalk.green('  ➜  ') +
      'MySQL:  ' +
      chalk.hex('#8EFAFD')('Connection successful.')
    )
    console.log('')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  })

sequelize.sync()

export default sequelize
