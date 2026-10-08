// Creates an error that the error handler in app.js turns into a JSON response,
// e.g. throw httpError(404, 'Quiz not found') -> 404 { "error": "Quiz not found" }
function httpError(status, message) {
  return Object.assign(new Error(message), { status, expose: true })
}

module.exports = { httpError }
