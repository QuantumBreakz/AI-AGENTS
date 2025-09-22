import Link from 'next/link'

const ADMIN_PATH = process.env.ADMIN_PATH || 'admin'

export default function Page() {
  return (
    <div>
      <h1>Agents Dashboard</h1>
      <ul>
        <li><Link href={`/${ADMIN_PATH}/leads`}>Leads</Link></li>
        <li><Link href={`/${ADMIN_PATH}/campaigns`}>Campaigns</Link></li>
        <li><Link href={`/${ADMIN_PATH}/calls`}>Calls</Link></li>
      </ul>
    </div>
  )
}
