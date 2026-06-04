// Shared GitHub helpers for all API routes
const REPO_OWNER = 'clawdsilno2';
const REPO_NAME = 'dtd-journal-backups';
const BRANCH = 'main';

export function getToken() {
  return process.env.GITHUB_BACKUP_TOKEN || '';
}

export async function readFile(token: string, path: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'dtd-journal' } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
}

export async function writeFile(token: string, path: string, content: string, message: string, sha?: string) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'dtd-journal',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch: BRANCH,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${err}`);
  }
  return res.json();
}
