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

async function create({ code, name, capital, continent }) {
  const [result] = await pool.query('INSERT INTO countries (code, name, capital, continent) VALUES (?, ?, ?, ?)', [code, name, capital, continent]);
  return getById(result.insertId);
}

async function update(id, { code, name, capital, continent }) {
    const [result] = await pool.query('UPDATE countries SET code = ?, name = ?, capital = ?, continent = ? WHERE id = ?', [code, name, capital, continent, id]);
    if (result.affectedRows === 0) {
        return null;
    }
    return getById(id);
}
module.exports = {
  getAll,
  getById,
  create,
  update
};