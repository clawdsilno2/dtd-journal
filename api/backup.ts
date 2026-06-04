import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getToken, readFile, writeFile } from './github.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getToken();
  if (!token) return res.status(500).json({ error: 'Token not configured' });

  const instanceId = req.query.id as string || req.body?.instanceId;
  if (!instanceId) return res.status(400).json({ error: 'Instance ID required' });

  const filePath = `data-${instanceId}.json`;

  // GET — load instance data
  if (req.method === 'GET') {
    const file = await readFile(token, filePath);
    if (!file) return res.status(404).json({ error: 'No data found' });
    try {
      return res.status(200).json(JSON.parse(file.content));
    } catch {
      return res.status(200).json({});
    }
  }

  // POST — save instance data
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid payload' });

      const existing = await readFile(token, filePath);
      await writeFile(
        token,
        filePath,
        JSON.stringify(body, null, 2),
        `Backup ${instanceId} — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
        existing?.sha
      );

      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Backup failed', details: String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
