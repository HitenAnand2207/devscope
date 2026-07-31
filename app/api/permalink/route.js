import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'permalinks.json');

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(STORE_PATH);
    } catch (e) {
      await fs.writeFile(STORE_PATH, JSON.stringify({}), 'utf8');
    }
  } catch (err) {
    console.error('Failed to ensure permalink store', err);
  }
}

function shortId() {
  return Math.random().toString(36).slice(2, 9);
}

export async function POST(request) {
  try {
    await ensureStore();
    const body = await request.json();
    if (!body || !body.payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const storeRaw = await fs.readFile(STORE_PATH, 'utf8');
    const store = JSON.parse(storeRaw || '{}');

    // Create a short id and persist a snapshot
    const id = shortId();
    store[id] = {
      createdAt: new Date().toISOString(),
      payload: body.payload,
      meta: body.meta || {},
    };

    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

    const base = request.nextUrl ? `${request.nextUrl.origin}` : '';
    return NextResponse.json({ id, url: `${base}/permalink/${id}` }, { status: 201 });
  } catch (err) {
    console.error('Permalink POST error', err);
    return NextResponse.json({ error: 'Failed to create permalink' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await ensureStore();
    const url = new URL(request.url);
    const pathname = url.pathname || '';

    // Expect /api/permalink?id=xxxxx or /api/permalink/<id>
    const idQuery = url.searchParams.get('id');
    const parts = pathname.split('/').filter(Boolean);
    const idPath = parts.length > 0 ? parts[parts.length - 1] : null;
    const id = idQuery || idPath;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const storeRaw = await fs.readFile(STORE_PATH, 'utf8');
    const store = JSON.parse(storeRaw || '{}');
    const entry = store[id];
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(entry, { status: 200 });
  } catch (err) {
    console.error('Permalink GET error', err);
    return NextResponse.json({ error: 'Failed to read permalink' }, { status: 500 });
  }
}
