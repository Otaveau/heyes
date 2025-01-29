const pool = require('../config/database');

class Status {
 static async findById(id) {
   const result = await pool.query(
     'SELECT * FROM status WHERE status_id = $1',
     [id]
   );
   return result.rows[0];
 }

 static async findByType(type) {
   const result = await pool.query(
     'SELECT * FROM status WHERE status_type = $1',
     [type]
   );
   return result.rows[0];
 }

 static async create(data) {
   const { status_type } = data;
   const result = await pool.query(
     'INSERT INTO status (status_type) VALUES ($1) RETURNING *',
     [status_type]
   );
   return result.rows[0];
 }

 static async update(id, data) {
   const { status_type } = data;
   const result = await pool.query(
     'UPDATE status SET status_type = $1 WHERE status_id = $2 RETURNING *',
     [status_type, id]
   );
   return result.rows[0];
 }

 static async delete(id) {
   const result = await pool.query(
     'DELETE FROM status WHERE status_id = $1 RETURNING *',
     [id]
   );
   return result.rows[0];
 }

 static async findAll() {
   const result = await pool.query('SELECT * FROM status ORDER BY status_type');
   return result.rows;
 }
}

module.exports = { Status };