import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getToken, readFile, writeFile } from './github.js';
import { createHash } from 'crypto';

const REGISTRY_PATH = 'instances.json';

interface Instance {
  id: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex');
}

async function loadRegistry(token: string): Promise<{ instances: Instance[]; sha?: string }> {
  const file = await readFile(token, REGISTRY_PATH);
  if (!file) return { instances: [] };
  try {
    return { instances: JSON.parse(file.content), sha: file.sha };
  } catch {
    return { instances: [], sha: file.sha };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getToken();
  if (!token) return res.status(500).json({ error: 'Token not configured' });

  // GET — list all instances (names + ids, no passwords)
  if (req.method === 'GET') {
    const { instances } = await loadRegistry(token);
    return res.status(200).json(instances.map(i => ({ id: i.id, name: i.name, createdAt: i.createdAt })));
  }

  // POST — create new instance or verify password
  if (req.method === 'POST') {
    const { action, name, password, instanceId } = req.body || {};

    if (action === 'create') {
      if (!name || !password) return res.status(400).json({ error: 'Name and password required' });

      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40) + '-' + Date.now().toString(36);
      const instance: Instance = {
        id,
        name: String(name).slice(0, 60),
        passwordHash: hashPassword(String(password)),
        createdAt: new Date().toISOString(),
      };

      const { instances, sha } = await loadRegistry(token);
      instances.push(instance);
      await writeFile(token, REGISTRY_PATH, JSON.stringify(instances, null, 2), `New instance: ${instance.name}`, sha);

      // Create empty data file for this instance
      await writeFile(token, `data-${id}.json`, JSON.stringify({ profiles: [], trades: {}, settings: {} }, null, 2), `Init data: ${instance.name}`);

      return res.status(201).json({ id: instance.id, name: instance.name });
    }

    if (action === 'verify') {
      if (!instanceId || !password) return res.status(400).json({ error: 'Instance ID and password required' });

      const { instances } = await loadRegistry(token);
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) return res.status(404).json({ error: 'Instance not found' });

      const valid = instance.passwordHash === hashPassword(String(password));
      return res.status(200).json({ valid });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
