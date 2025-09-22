const API = process.env.NEXT_PUBLIC_AGENT2_API_URL as string

async function getCampaigns() {
  const res = await fetch(`${API}/campaigns`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load campaigns')
  return res.json()
}

export default async function CampaignsPage() {
  const data = await getCampaigns()
  return (
    <div>
      <h2>Campaigns</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
