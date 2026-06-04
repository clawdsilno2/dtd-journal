import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPO_OWNER = 'clawdsilno2';
const REPO_NAME = 'dtd-journal-backups';
const BRANCH = 'main';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_BACKUP_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Backup token not configured' });
  }

  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || !body.username) {
      return res.status(400).json({ error: 'Invalid payload — username required' });
    }

    // Sanitize username for use as filename
    const username = String(body.username).toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 50);
    const filePath = `backup-${username}.json`;

    const content = Buffer.from(JSON.stringify(body, null, 2)).toString('base64');

    // Get current file SHA (needed for updates)
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'dtd-journal' } }
    );

    let sha: string | undefined;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // Create or update the file
    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'dtd-journal',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Backup ${username} — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`,
          content,
          sha,
          branch: BRANCH,
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return res.status(500).json({ error: 'GitHub API error', details: err });
    }

    return res.status(200).json({ ok: true, user: username, timestamp: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: 'Backup failed', details: String(e) });
  }
}
