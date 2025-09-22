const API = process.env.NEXT_PUBLIC_AGENT2_API_URL as string

async function getLeads() {
  const res = await fetch(`${API}/leads`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load leads')
  return res.json()
}

export default async function LeadsPage() {
  const data = await getLeads()
  return (
    <div>
      <h2>Leads</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
