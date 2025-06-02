// scripts/qa/generate_test_scaffold.ts

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const COMPONENTS_DIR = "src/components";
const TESTS_DIR = "tests/unit/components";
const LLM_MODEL = "claude-sonnet"; // or switch to DeepSeek if offline

function pascalToFileName(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function getComponentFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return getComponentFiles(fullPath);
    if (entry.name.endsWith(".tsx")) return [fullPath];
    return [];
  });
}

function getComponentName(filePath: string): string {
  return path.basename(filePath, ".tsx");
}

function testFileExists(componentName: string): boolean {
  const testPath = path.join(TESTS_DIR, `${componentName}.test.tsx`);
  return fs.existsSync(testPath);
}

function generatePrompt(componentPath: string, componentName: string): string {
  const content = fs.readFileSync(componentPath, "utf-8");
  return `
You are a TypeScript unit test generator using React Testing Library.
Generate a minimal test file for the following component:

Component Name: ${componentName}
Source:
\`\`\`tsx
${content}
\`\`\`

Return only the test file code using @testing-library/react.
`;
}

function callLLM(prompt: string): string {
  try {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const result = execSync(`bruno "${escapedPrompt}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return result.trim();
  } catch {
    return "// Failed to generate test";
  }
}

function saveTestFile(componentName: string, content: string) {
  const filePath = path.join(TESTS_DIR, `${componentName}.test.tsx`);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`✅ Created test: ${filePath}`);
}

function run() {
  const files = getComponentFiles(COMPONENTS_DIR);
  files.forEach(componentPath => {
    const componentName = getComponentName(componentPath);
    if (!testFileExists(componentName)) {
      console.log(`🧪 Generating test for: ${componentName}`);
      const prompt = generatePrompt(componentPath, componentName);
      const testContent = callLLM(prompt);
      saveTestFile(componentName, testContent);
    }
  });
}

run(); 