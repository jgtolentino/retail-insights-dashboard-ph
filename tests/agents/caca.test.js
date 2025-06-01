import { describe, test, expect } from 'vitest';

// Enhanced error suggestion with regex patterns (duplicated for testing)
function suggestFix(taskName, stderr, exitCode = 1) {
  const patterns = [
    {
      regex: /command not found: (\w+)/i,
      suggestion: (match) => `Install missing command: npm install -D ${match[1]} or check your PATH`,
      category: 'dependency',
      severity: 'high',
      exitCode: 127
    },
    {
      regex: /Cannot find module ['"]([^'"]+)['"]/i,
      suggestion: (match) => `Install missing module: npm install ${match[1]}`,
      category: 'dependency',
      severity: 'high'
    },
    {
      regex: /ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i,
      suggestion: () => 'Check network connection, DNS settings, or proxy configuration',
      category: 'network',
      severity: 'medium'
    },
    {
      regex: /Unexpected any\. Specify a different type/i,
      suggestion: () => 'Replace "any" with specific TypeScript types (string, number, object, etc.)',
      category: 'typescript',
      severity: 'low'
    },
    {
      regex: /React Hook .* cannot be called at the top level/i,
      suggestion: () => 'Move React Hooks inside component functions, not at top level',
      category: 'react',
      severity: 'high'
    },
    {
      regex: /React Hook .* has a missing dependency/i,
      suggestion: () => 'Add missing dependencies to useEffect dependency array or wrap in useCallback',
      category: 'react',
      severity: 'medium'
    },
    {
      regex: /tailwindcss.*not found|Tailwind.*error/i,
      suggestion: () => 'Install Tailwind CSS: npm install -D tailwindcss && npx tailwindcss init',
      category: 'build',
      severity: 'high'
    }
  ];

  for (const pattern of patterns) {
    if (pattern.exitCode && exitCode !== pattern.exitCode) continue;
    
    const match = stderr.match(pattern.regex);
    if (match) {
      const suggestion = typeof pattern.suggestion === 'function' 
        ? pattern.suggestion(match) 
        : pattern.suggestion;
      
      return {
        suggestion,
        category: pattern.category,
        severity: pattern.severity
      };
    }
  }

  const taskFallbacks = {
    'build-css': 'Check Tailwind installation and config',
    'lint': 'Check ESLint config and file patterns',
    'test': 'Check test framework setup and dependencies',
    'deploy': 'Check deployment credentials and config'
  };

  const fallback = taskFallbacks[taskName] || 'Check the error message and consult the documentation';
  
  return {
    suggestion: fallback,
    category: 'general',
    severity: 'medium'
  };
}

describe('Caca Agent', () => {
  test('should detect command not found error', () => {
    const stderr = 'sh: tailwindcss: command not found';
    const result = suggestFix('build-css', stderr, 127);
    
    expect(result).toMatchObject({
      suggestion: 'Install missing command: npm install -D tailwindcss or check your PATH',
      category: 'dependency',
      severity: 'high'
    });
  });

  test('should detect module not found error', () => {
    const stderr = 'Cannot find module \'@octokit/rest\'';
    const result = suggestFix('deploy', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Install missing module: npm install @octokit/rest',
      category: 'dependency',
      severity: 'high'
    });
  });

  test('should detect network errors', () => {
    const stderr = 'Error: getaddrinfo ENOTFOUND localhost';
    const result = suggestFix('test', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Check network connection, DNS settings, or proxy configuration',
      category: 'network',
      severity: 'medium'
    });
  });

  test('should detect TypeScript any errors', () => {
    const stderr = 'Unexpected any. Specify a different type';
    const result = suggestFix('lint', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Replace "any" with specific TypeScript types (string, number, object, etc.)',
      category: 'typescript',
      severity: 'low'
    });
  });

  test('should detect React Hook errors', () => {
    const stderr = 'React Hook "useEffect" cannot be called at the top level';
    const result = suggestFix('lint', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Move React Hooks inside component functions, not at top level',
      category: 'react',
      severity: 'high'
    });
  });

  test('should detect React Hook dependency errors', () => {
    const stderr = 'React Hook useEffect has a missing dependency: \'fetchData\'';
    const result = suggestFix('lint', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Add missing dependencies to useEffect dependency array or wrap in useCallback',
      category: 'react',
      severity: 'medium'
    });
  });

  test('should detect Tailwind errors', () => {
    const stderr = 'tailwindcss not found in PATH';
    const result = suggestFix('build-css', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Install Tailwind CSS: npm install -D tailwindcss && npx tailwindcss init',
      category: 'build',
      severity: 'high'
    });
  });

  test('should provide task-specific fallback for unknown errors', () => {
    const stderr = 'Unknown error occurred';
    const result = suggestFix('build-css', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Check Tailwind installation and config',
      category: 'general',
      severity: 'medium'
    });
  });

  test('should provide general fallback for unknown task and error', () => {
    const stderr = 'Unknown error occurred';
    const result = suggestFix('unknown-task', stderr);
    
    expect(result).toMatchObject({
      suggestion: 'Check the error message and consult the documentation',
      category: 'general',
      severity: 'medium'
    });
  });
});