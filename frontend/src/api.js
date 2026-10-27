export async function request(path, body, method) {
  const response = await fetch(`/api${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json', 
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 204) {
    return null
  }
  const data = await response.json()
  if (!response.ok) {
    throw Object.assign(new Error(data.error || 'Något gick fel.'), { status: response.status })
  }
  return data
}
