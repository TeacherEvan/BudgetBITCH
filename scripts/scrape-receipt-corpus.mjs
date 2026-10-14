#!/usr/bin/env node
/**
 * Scrape a small corpus of REAL receipt photographs from public Hugging Face
 * datasets into a local (git-ignored) working directory.
 *
 * The images themselves are deliberately NOT committed: the manifest records a
 * stable dataset coordinate (dataset / config / split / row) plus a sha256 so a
 * later run can re-download the exact same bytes. Committed test fixtures are
 * the *captured bot output* (tests/fixtures/receipts/hf-bot/*.json), which keeps
 * the suite deterministic and offline.
 *
 * Usage:
 *   node scripts/scrape-receipt-corpus.mjs [--limit 8]
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('tests/fixtures/receipts/.corpus');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

/** Public, redistributable receipt corpora with per-row ground truth. */
const SOURCES = [
  {
    key: 'cord',
    dataset: 'naver-clova-ix/cord-v2',
    config: 'default',
    split: 'test',
    license: 'CC BY 4.0',
    homepage: 'https://huggingface.co/datasets/naver-clova-ix/cord-v2',
    note: 'Real photographed Indonesian retail receipts (CORD v2).',
    groundTruth: (row) => {
      const gt = JSON.parse(row.ground_truth);
      const parse = gt.gt_parse ?? {};
      const total = parse.total?.total_price ?? parse.sub_total?.subtotal_price ?? null;
      return {
        totalRaw: total,
        subtotalRaw: parse.sub_total?.subtotal_price ?? null,
        taxRaw: parse.sub_total?.tax_price ?? null,
        imageSize: gt.meta?.image_size ?? null,
      };
    },
    /** Human-verified transcription of the photo, in reading order. */
    ocrText: (row) => {
      const gt = JSON.parse(row.ground_truth);
      return (gt.valid_line ?? [])
        .map((vl) => ({
          y: Math.min(...vl.words.map((w) => w.quad.y1)),
          x: Math.min(...vl.words.map((w) => w.quad.x1)),
          text: vl.words.map((w) => w.text).join(' '),
        }))
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map((l) => l.text)
        .join('\n');
    },
  },
  {
    key: 'invoice',
    dataset: 'mychen76/invoices-and-receipts_ocr_v1',
    config: 'default',
    split: 'test',
    license: 'Apache-2.0',
    homepage: 'https://huggingface.co/datasets/mychen76/invoices-and-receipts_ocr_v1',
    note: 'Scanned invoice/receipt images with parsed header + summary ground truth.',
    groundTruth: (row) => {
      const parsed = JSON.parse(row.parsed_data);
      // `json` is a python-repr string; keep it raw for provenance, pull the
      // numbers we can read out of it without eval.
      const raw = String(parsed.json ?? '');
      const total = raw.match(/'total'\s*:\s*'([^']+)'/)?.[1] ?? null;
      const date = raw.match(/'invoice_date'\s*:\s*'([^']+)'/)?.[1] ?? null;
      const seller = raw.match(/'seller'\s*:\s*'([^']+)'/)?.[1] ?? null;
      return { totalRaw: total, dateRaw: date, sellerRaw: seller };
    },
    ocrText: (row) => {
      const raw = JSON.parse(row.raw_data);
      // ocr_words is a python-repr list of quoted strings.
      const words = String(raw.ocr_words ?? '')
        .match(/'((?:[^'\\]|\\.)*)'/g)
        ?.map((s) => s.slice(1, -1).replace(/\\'/g, "'"));
      return (words ?? []).join('\n');
    },
  },
];

const ROWS_API = 'https://datasets-server.huggingface.co/rows';

async function fetchRows(source, limit) {
  const url =
    `${ROWS_API}?dataset=${encodeURIComponent(source.dataset)}` +
    `&config=${encodeURIComponent(source.config)}` +
    `&split=${encodeURIComponent(source.split)}&offset=0&length=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`rows API ${res.status} for ${source.dataset}`);
  return (await res.json()).rows ?? [];
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const perSource = limitArg > -1 ? Number(process.argv[limitArg + 1]) : 5;

  await mkdir(OUT_DIR, { recursive: true });
  const entries = [];

  for (const source of SOURCES) {
    const rows = await fetchRows(source, perSource);
    for (const { row_idx: rowIdx, row } of rows) {
      const src = row.image?.src;
      if (!src) continue;

      const imgRes = await fetch(src);
      if (!imgRes.ok) {
        console.warn(`skip ${source.key}-${rowIdx}: image HTTP ${imgRes.status}`);
        continue;
      }
      const bytes = Buffer.from(await imgRes.arrayBuffer());
      const id = `${source.key}-${String(rowIdx).padStart(3, '0')}`;
      const file = `${id}.jpg`;
      await writeFile(path.join(OUT_DIR, file), bytes);

      entries.push({
        id,
        file,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        bytes: bytes.length,
        source: {
          dataset: source.dataset,
          config: source.config,
          split: source.split,
          rowIdx,
          license: source.license,
          homepage: source.homepage,
          note: source.note,
        },
        groundTruth: source.groundTruth(row),
        ocrText: source.ocrText(row),
      });
      console.log(`saved ${file} (${bytes.length} bytes) from ${source.dataset}#${rowIdx}`);
    }
  }

  await writeFile(
    MANIFEST,
    `${JSON.stringify({ scrapedAt: new Date().toISOString(), count: entries.length, entries }, null, 2)}\n`
  );
  console.log(`\nmanifest: ${MANIFEST} (${entries.length} images)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
