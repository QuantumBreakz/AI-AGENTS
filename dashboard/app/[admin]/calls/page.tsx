const API = process.env.NEXT_PUBLIC_AGENT3_API_URL as string

async function getCalls() {
  const res = await fetch(`${API}/calls`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load calls')
  return res.json()
}

export default async function CallsPage() {
  const calls = await getCalls()
  return (
    <div>
      <h2>Calls</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>ID</th>
            <th style={{ textAlign: 'left' }}>Phone</th>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th style={{ textAlign: 'left' }}>Purpose</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c: any) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.phone}</td>
              <td>{c.email}</td>
              <td>{c.purpose}</td>
              <td>{c.status}</td>
              <td>{c.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 style={{ marginTop: 24 }}>Latest Notes</h3>
      {calls.map((c: any) => (
        <div key={`n-${c.id}`} style={{ marginBottom: 16 }}>
          <strong>Call {c.id}</strong>
          <ul>
            {(c.notes || []).map((n: any) => (
              <li key={n.id}>{n.created_at}: {n.content}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
