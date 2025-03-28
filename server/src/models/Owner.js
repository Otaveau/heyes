const pool = require('../config/database');

class Owner {
    static async findById(id, userId) {
      const result = await pool.query(
        'SELECT o.*, t.name as team_name FROM owners o LEFT JOIN teams t ON o.team_id = t.team_id WHERE o.owner_id = $1 AND o.user_id = $2',
        [id, userId]
      );
      return result.rows[0];
    }
  
    static async create(data, userId) {
      const { name, teamId } = data;
      const result = await pool.query(
        'INSERT INTO owners (name, team_id, user_id) VALUES ($1, $2, $3) RETURNING *',
        [name, teamId, userId]
      );
      return result.rows[0];
    }
  
    static async update(id, data, userId) {
      const { name, teamId } = data;
      const result = await pool.query(
        'UPDATE owners SET name = $1, team_id = $2, updated_at = CURRENT_TIMESTAMP WHERE owner_id = $3 AND user_id = $4 RETURNING *',
        [name, teamId, id, userId]
      );
      return result.rows[0];
    }
  
    static async delete(id, userId) {
      const result = await pool.query(
        'DELETE FROM owners WHERE owner_id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
      return result.rows[0];
    }
  
    static async findAll(userId) {
      const result = await pool.query(
        'SELECT o.*, t.name as team_name FROM owners o LEFT JOIN teams t ON o.team_id = t.team_id WHERE o.user_id = $1 ORDER BY o.name',
        [userId]
      );
      return result.rows;
    }
  
    static async findByTeam(teamId, userId) {
      const result = await pool.query(
        'SELECT * FROM owners WHERE team_id = $1 AND user_id = $2 ORDER BY name',
        [teamId, userId]
      );
      return result.rows;
    }
  }
  module.exports = { Owner };
