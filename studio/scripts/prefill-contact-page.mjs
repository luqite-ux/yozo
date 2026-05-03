import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { attachContactPageUploadedImages, getContactPageSeedDoc } from '../seed/contactPageSeed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(__dirname, '..');
const repoRoot = join(studioRoot, '..');

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const env = {
  ...process.env,
  ...parseEnvFile(join(repoRoot, 'webhook', '.env')),
  ...parseEnvFile(join(repoRoot, 'website', '.env.local')),
  ...parseEnvFile(join(studioRoot, '.env.local')),
};

const projectId =
  env.SANITY_PROJECT_ID ||
  env.SANITY_STUDIO_PROJECT_ID ||
  env.VITE_SANITY_PROJECT_ID ||
  '';
const dataset = env.SANITY_DATASET || env.SANITY_STUDIO_DATASET || env.VITE_SANITY_DATASET || 'production';
const token = env.SANITY_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN || '';

if (!projectId || !token) {
  throw new Error('Missing SANITY projectId/write token for prefill-contact-page');
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const contactImageUrl =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000';

async function uploadContactImage() {
  try {
    const res = await fetch(contactImageUrl);
    if (!res.ok) throw new Error(`Failed downloading contact image: ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload('image', buf, {
      filename: 'contact-global-network.jpg',
      contentType,
    });
    return asset?._id;
  } catch {
    const fallback = await client.fetch(
      '*[_type == "simplePage" && _id == "contact"][0]{"assetRef": banner.backgroundImage.asset._ref}',
    );
    if (fallback?.assetRef) return fallback.assetRef;
    throw new Error('Failed downloading contact image and no existing contact image asset found');
  }
}

async function main() {
  const imageAssetRef = await uploadContactImage();
  const base = structuredClone(getContactPageSeedDoc());
  const doc = attachContactPageUploadedImages(base, imageAssetRef);
  await client.createOrReplace(doc);
  console.log('[prefill-contact-page] upserted simplePage#contact with EN/ES/PT/AR/RU pre-translations');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
