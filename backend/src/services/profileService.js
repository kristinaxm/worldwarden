const { pool } = require('../db');

async function getById(userId) {
    const [rows] = await pool.execute(
    'SELECT id, email, display_name, avatar, created_at FROM users WHERE id = ?', [userId],
  )
    return rows[0] || null
}

async function updateProfile(userId, displayName, avatar) {
    await pool.execute(
        'UPDATE users SET display_name = ?, avatar = ? WHERE id = ?',
        [displayName, avatar, userId]
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