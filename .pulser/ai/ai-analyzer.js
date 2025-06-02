import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const gitShort = execSync('git rev-parse --short HEAD').toString().trim();
const srcFiles = execSync("git ls-files 'src/**/*.tsx' | head -n 20")
                  .toString().trim().split('\n');

const snippets = srcFiles.map(p => ({
  path: p,
  content: readFileSync(p, 'utf8').slice(0, 4000)   // cap per-file
}));

// Run Claude via the integration script (stdin → stdout JSON)
const output = execSync(
  'node claude-pulser-integration.js analyze --stdin',
  { input: JSON.stringify({ rev: gitShort, snippets }),
    encoding: 'utf8', maxBuffer: 10_000_000 }
);

writeFileSync('analysis-results.json', output);
console.log('✓ analysis-results.json ready (native Claude scan)');