import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import yaml from "js-yaml";

interface TestMatrix {
  version: string;
  lastUpdated: string;
  components: {
    [key: string]: {
      path: string;
      tests: {
        unit?: {
          status: "passing" | "failing" | "missing";
          lastRun?: string;
          coverage?: number;
        };
        integration?: {
          status: "passing" | "failing" | "missing";
          lastRun?: string;
          coverage?: number;
        };
        e2e?: {
          status: "passing" | "failing" | "missing";
          lastRun?: string;
          coverage?: number;
        };
      };
      dependencies: string[];
      critical: boolean;
    };
  };
  summary: {
    totalComponents: number;
    testedComponents: number;
    coverage: {
      unit: number;
      integration: number;
      e2e: number;
    };
  };
}

const MATRIX_FILE = "qa-matrix.yaml";
const COMPONENTS_DIR = "src/components";
const TESTS_DIR = "tests/unit/components";
const INTEGRATION_DIR = "tests/integration";
const E2E_DIR = "tests/e2e";

function getComponentFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return getComponentFiles(fullPath);
    if (entry.name.endsWith(".tsx")) return [fullPath];
    return [];
  });
}

function getTestStatus(testPath: string): "passing" | "failing" | "missing" {
  if (!fs.existsSync(testPath)) return "missing";
  
  try {
    const result = execSync(`npx vitest run ${testPath} --reporter=json`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const output = JSON.parse(result);
    return output.numFailedTests === 0 ? "passing" : "failing";
  } catch {
    return "failing";
  }
}

function getTestCoverage(testPath: string): number {
  try {
    const result = execSync(`npx vitest run ${testPath} --coverage --reporter=json`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const output = JSON.parse(result);
    return output.coverage?.total?.statements?.pct || 0;
  } catch {
    return 0;
  }
}

function getDependencies(componentPath: string): string[] {
  const content = fs.readFileSync(componentPath, "utf-8");
  const imports = content.match(/from ['"]([^'"]+)['"]/g) || [];
  return imports
    .map(imp => imp.match(/from ['"]([^'"]+)['"]/)?.[1])
    .filter(Boolean)
    .filter(imp => imp?.startsWith("@/") || imp?.startsWith("./"));
}

function isCriticalComponent(componentPath: string): boolean {
  const content = fs.readFileSync(componentPath, "utf-8");
  return content.includes("@critical") || content.includes("critical: true");
}

function updateMatrix() {
  const matrix: TestMatrix = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    components: {},
    summary: {
      totalComponents: 0,
      testedComponents: 0,
      coverage: {
        unit: 0,
        integration: 0,
        e2e: 0,
      },
    },
  };

  const componentFiles = getComponentFiles(COMPONENTS_DIR);
  matrix.summary.totalComponents = componentFiles.length;

  componentFiles.forEach(componentPath => {
    const componentName = path.basename(componentPath, ".tsx");
    const relativePath = path.relative(process.cwd(), componentPath);
    
    const unitTestPath = path.join(TESTS_DIR, `${componentName}.test.tsx`);
    const integrationTestPath = path.join(INTEGRATION_DIR, `${componentName}.test.tsx`);
    const e2eTestPath = path.join(E2E_DIR, `${componentName}.spec.ts`);

    matrix.components[componentName] = {
      path: relativePath,
      tests: {
        unit: {
          status: getTestStatus(unitTestPath),
          lastRun: new Date().toISOString(),
          coverage: getTestCoverage(unitTestPath),
        },
        integration: {
          status: getTestStatus(integrationTestPath),
          lastRun: new Date().toISOString(),
          coverage: getTestCoverage(integrationTestPath),
        },
        e2e: {
          status: getTestStatus(e2eTestPath),
          lastRun: new Date().toISOString(),
          coverage: getTestCoverage(e2eTestPath),
        },
      },
      dependencies: getDependencies(componentPath),
      critical: isCriticalComponent(componentPath),
    };

    // Update summary
    if (
      matrix.components[componentName].tests.unit?.status === "passing" ||
      matrix.components[componentName].tests.integration?.status === "passing" ||
      matrix.components[componentName].tests.e2e?.status === "passing"
    ) {
      matrix.summary.testedComponents++;
    }

    // Update coverage averages
    matrix.summary.coverage.unit += matrix.components[componentName].tests.unit?.coverage || 0;
    matrix.summary.coverage.integration += matrix.components[componentName].tests.integration?.coverage || 0;
    matrix.summary.coverage.e2e += matrix.components[componentName].tests.e2e?.coverage || 0;
  });

  // Calculate average coverage
  matrix.summary.coverage.unit = matrix.summary.coverage.unit / matrix.summary.totalComponents;
  matrix.summary.coverage.integration = matrix.summary.coverage.integration / matrix.summary.totalComponents;
  matrix.summary.coverage.e2e = matrix.summary.coverage.e2e / matrix.summary.totalComponents;

  // Save matrix
  fs.writeFileSync(MATRIX_FILE, yaml.dump(matrix));
  console.log(`✅ Updated ${MATRIX_FILE}`);
  console.log(`📊 Coverage Summary:`);
  console.log(`   Unit: ${matrix.summary.coverage.unit.toFixed(1)}%`);
  console.log(`   Integration: ${matrix.summary.coverage.integration.toFixed(1)}%`);
  console.log(`   E2E: ${matrix.summary.coverage.e2e.toFixed(1)}%`);
}

updateMatrix(); 