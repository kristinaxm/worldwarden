export async function request(path, body) {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) {
    throw Object.assign(new Error(data.error || 'Något gick fel.'), { status: response.status })
  }
  return data
}
