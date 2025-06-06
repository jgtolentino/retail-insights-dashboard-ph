import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  token: string
  expires_in: number
} | {
  error: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!
  const PROJECT_REF = process.env.SUPABASE_PROJECT_REF!

  const resp = await fetch(
    `https://${PROJECT_REF}.supabase.co/mcp/v1/token`,
    {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  )

  if (!resp.ok) {
    const text = await resp.text()
    return res.status(resp.status).json({ error: `Failed to fetch MCP token: ${text}` })
  }

  const { token, expires_in } = await resp.json()
  return res.status(200).json({ token, expires_in })
} 