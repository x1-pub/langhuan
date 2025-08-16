import Router from '@koa/router';

import config from '../config';
import ConnectionController from '../controller/connection';
import DatabaseController from '../controller/database';
import TableController from '../controller/table';
import RedisController from '../controller/redis';
import MysqlController from '../controller/mysql';
import AuthController from '@/controller/auth';

const router = new Router({
  prefix: config.koa.globalPrefix
})

router.get('/auth/ticket', AuthController.ticket)

router.post('/connection/create_connection', ConnectionController.create)
router.get('/connection/connection_list', ConnectionController.list)
router.get('/connection/connection_details', ConnectionController.details)
router.post('/connection/modify_connection', ConnectionController.modify)
router.post('/connection/delete_connection', ConnectionController.delete)
router.post('/connection/test_connection', ConnectionController.test)

router.get('/db/db_list', DatabaseController.list)
router.post('/db/create_db', DatabaseController.create)
router.post('/db/delete_db', DatabaseController.delete)
router.post('/db/modify_db', DatabaseController.modify)

router.get('/table/table_list', TableController.list)
router.post('/table/create_table', TableController.create)
router.post('/table/delete_table', TableController.delete)
router.post('/table/modify_table', TableController.modify)

router.get('/redis/redis_keys', RedisController.onlyKeys)
router.get('/redis/redis_value', RedisController.getValue)
router.post('/redis/redis_add_value', RedisController.addValue)
router.post('/redis/redis_delete_value', RedisController.delete)
router.post('/redis/redis_execute', RedisController.execute)

router.get('/mysql/mysql_data', MysqlController.list)
router.post('/mysql/mysql_update', MysqlController.update)
router.post('/mysql/mysql_insert_one', MysqlController.insertOne)
router.post('/mysql/mysql_batch_delete', MysqlController.batchDelete)
router.post('/mysql/mysql_table_ddl', MysqlController.tableDDL)
router.post('/mysql/mysql_table_columns', MysqlController.showColumns)
router.post('/mysql/mysql_table_index', MysqlController.showIndex)
router.post('/mysql/mysql_table_status', MysqlController.status)
router.post('/mysql/mysql_add_index', MysqlController.addIndex)
router.post('/mysql/mysql_delete_index', MysqlController.deleteIndex)
router.post('/mysql/mysql_update_index', MysqlController.updateIndex)
router.post('/mysql/mysql_add_or_update_column', MysqlController.addOrUpdateColumn)
router.post('/mysql/mysql_delete_column', MysqlController.deleteColumn)
router.post('/mysql/mysql_execute', MysqlController.execute)
router.post('/mysql/mysql_export', MysqlController.exportData)
router.post('/mysql/mysql_column_order', MysqlController.columnOrder)

export default router
