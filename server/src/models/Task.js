const pool = require('../config/database');

class Task {
  static async findById(id, userId) {
    const result = await pool.query(`
        SELECT t.*, o.name as owner_name, s.status_type, team.name as team_name
        FROM tasks t
        LEFT JOIN owners o ON t.owner_id = o.owner_id
        LEFT JOIN status s ON t.status_id = s.status_id
        LEFT JOIN teams team ON o.team_id = team.team_id
        WHERE t.id = $1 AND t.user_id = $2
      `, [id, userId]);
    return result.rows[0];
  }

  static async findAll(userId) {
    const result = await pool.query(`
        SELECT t.*, o.name as owner_name, s.status_type, team.name as team_name
        FROM tasks t
        LEFT JOIN owners o ON t.owner_id = o.owner_id
        LEFT JOIN status s ON t.status_id = s.status_id
        LEFT JOIN teams team ON o.team_id = team.team_id
        WHERE t.user_id = $1
        ORDER BY t.start_date
      `, [userId]);
    return result.rows;
  }

  static async create(data, userId) {
    const { title, start_date, end_date, description, owner_id, status_id } = data;

    const result = await pool.query(
      `INSERT INTO tasks (
            title, 
            start_date, 
            end_date, 
            description, 
            owner_id, 
            status_id, 
            user_id
        ) VALUES ($1, $2::date, $3::date, $4, $5, $6, $7) 
        RETURNING *`,
      [title, start_date, end_date, description, owner_id, status_id, userId]
    );
    return result.rows[0];
  }

  static async update(id, data, user_id) {
    if (data.status_id && Object.keys(data).length === 1) {
      return this.updateStatus(id, data.status_id, user_id);
    }

    const { title, start_date, end_date, owner_id, status_id, description } = data;

    const result = await pool.query(
      `UPDATE tasks 
      SET 
          title = $1, 
          start_date = $2::date, 
          end_date = $3::date, 
          owner_id = $4, 
          status_id = $5, 
          description = $6 
      WHERE id = $7 AND user_id = $8 
      RETURNING *`,
      [title, start_date, end_date, owner_id, status_id, description, id, user_id]
    );
    return result.rows[0];
  }

  static async findByStatus(statusId, userId) {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE status_id = $1 AND user_id = $2 ORDER BY start_date',
      [statusId, userId]
    );
    return result.rows;
  }

  static async findByOwner(ownerId, userId) {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE owner_id = $1 AND user_id = $2 ORDER BY start_date',
      [ownerId, userId]
    );
    return result.rows;
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Task not found or you do not have permission to delete');
    }

    return result.rows[0];
  }
}

module.exports = { Task };