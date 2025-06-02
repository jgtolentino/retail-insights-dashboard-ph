import fs from 'fs';
import path from 'path';

const componentBase = 'src/components';
const testBase = 'tests/unit/components';

const components = fs.readdirSync(componentBase).flatMap(dir =>
  fs.readdirSync(path.join(componentBase, dir)).map(file => path.basename(file, '.tsx'))
);

const tests = fs.readdirSync(testBase).filter(f => f.endsWith('.test.tsx'));

const orphans = tests.filter(t => {
  const componentName = path.basename(t, '.test.tsx');
  return !components.includes(componentName);
});

if (orphans.length > 0) {
  console.error('❌ Orphaned test files detected:');
  orphans.forEach(f => console.error(` - ${f}`));
  process.exit(1);
} else {
  console.log('✅ No orphaned test files detected.');
} 