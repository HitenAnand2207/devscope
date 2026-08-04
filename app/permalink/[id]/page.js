import fs from 'fs';
import path from 'path';
import { generateHTMLReport } from '../../utils/exportUtils';

export default async function PermalinkPage({ params }) {
  const { id } = params || {};
  const STORE_PATH = path.resolve(process.cwd(), 'data', 'permalinks.json');

  try {
    const raw = await fs.promises.readFile(STORE_PATH, 'utf8');
    const store = JSON.parse(raw || '{}');
    const entry = store[id];
    if (!entry) {
      return (
        <div className="container mx-auto p-8">
          <h2 className="text-xl font-semibold">Permalink not found</h2>
          <p className="text-sm text-slate-400">The requested permalink does not exist or has been removed.</p>
        </div>
      );
    }

    const html = generateHTMLReport(entry.payload, entry.meta);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (err) {
    return (
      <div className="container mx-auto p-8">
        <h2 className="text-xl font-semibold">Error loading permalink</h2>
        <pre className="mt-4 text-xs text-red-400">{String(err)}</pre>
      </div>
    );
  }
}
