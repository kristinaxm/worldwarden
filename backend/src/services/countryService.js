// Databaslogik för countries

const { pool } = require('../db');

async function getAll() {
  const [rows] = await pool.query('SELECT * FROM countries ORDER BY name');
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM countries WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = {
  getAll,
  getById
};