const { pool } = require('../db');

async function getById(userId) {
    const [rows] = await pool.execute(
    'SELECT id, email, display_name, avatar, created_at FROM users WHERE id = ?', [userId],
  )
    return rows[0] || null
}

// changes: { display_name?, avatar? } – bara kolumnerna som finns med uppdateras.
// Kolumnnamnen kommer från controllern, aldrig från klienten.
async function updateProfile(userId, changes) {
    const columns = Object.keys(changes)
    await pool.execute(
        `UPDATE users SET ${columns.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
        [...columns.map((column) => changes[column]), userId]
    )
    return getById(userId);
}

async function updateEmail(userId, newEmail) {
    await pool.execute(
        'UPDATE users SET email = ? WHERE id = ?',
        [newEmail, userId]
    )
    return getById(userId);
}

async function updatePassword(userId, newPasswordHash) {
    await pool.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
    )
}

async function deleteUser(userId) {
    await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
    )
}

module.exports = {
    getById,
    updateProfile,
    updateEmail,
    updatePassword,
    deleteUser,
};