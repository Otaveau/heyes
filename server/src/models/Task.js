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

  static async create(data, userId) {
    const { title, startDate, endDate, ownerId, statusId } = data;
    console.log('Data to insert:', { title, startDate, endDate, ownerId, statusId, userId });
    const result = await pool.query(
      'INSERT INTO tasks (title, start_date, end_date, owner_id, status_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, startDate, endDate, ownerId, statusId, userId]
    );
    return result.rows[0];
  }

  static async updateStatus(id, statusId, userId) {
    const result = await pool.query(
      'UPDATE tasks SET status_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [statusId, id, userId]
    );
    return result.rows[0];
  }

  static async update(id, data, userId) {
    // Si seul le statut est fourni, utiliser updateStatus
    if (data.statusId && Object.keys(data).length === 1) {
      return this.updateStatus(id, data.statusId, userId);
    }

    const { title, startDate, endDate, ownerId, statusId } = data;
    const result = await pool.query(
      'UPDATE tasks SET title = $1, start_date = $2, end_date = $3, owner_id = $4, status_id = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [title, startDate, endDate, ownerId, statusId, id, userId]
    );
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
}

module.exports = { Task };