const pool = require('../config/database');

class Team {
  static async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM teams WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  static async findByName(name, userId) {
    const result = await pool.query(
      'SELECT * FROM teams WHERE name = $1 AND user_id = $2',
      [name, userId]
    );
    return result.rows[0];
  }

  static async create(data, userId) {
    const { name } = data;
    const result = await pool.query(
      'INSERT INTO teams (name, user_id) VALUES ($1, $2) RETURNING *',
      [name, userId]
    );
    return result.rows[0];
  }

  static async update(id, data, userId) {
    const { name } = data;
    const result = await pool.query(
      'UPDATE teams SET name = $1 WHERE team_id = $2 AND user_id = $3 RETURNING *',
      [name, id, userId]
    );
    return result.rows[0];
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM teams WHERE team_id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  static async findAll(userId) {
    const result = await pool.query(
      'SELECT * FROM teams WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return result.rows;
  }
}

module.exports = { Team };