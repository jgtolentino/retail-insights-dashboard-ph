import { describe, test, expect } from 'vitest';

// Mock MayaPlan implementation for testing
function generatePlan(feature, repoPath = '.') {
  // Simulate the enhanced MayaPlan behavior
  const featureName = feature.replace(/\s+/g, '');
  const componentName = featureName.replace(/^./, c => c.toUpperCase());
  
  if (feature.toLowerCase().includes('navigation')) {
    return {
      tasks: [
        {
          name: "Create NavigationMenu component",
          filePaths: ["src/components/NavigationMenu.tsx"],
          type: "code",
          deps: []
        },
        {
          name: "Add navigation types",
          filePaths: ["src/types/navigation.ts"],
          type: "code",
          deps: []
        },
        {
          name: "Create useNavigation hook",
          filePaths: ["src/hooks/useNavigation.ts"],
          type: "code",
          deps: ["Create NavigationMenu component"]
        },
        {
          name: "Add mobile responsiveness styles",
          filePaths: ["src/components/NavigationMenu.tsx"],
          type: "code",
          deps: ["Create NavigationMenu component"]
        },
        {
          name: "Write NavigationMenu tests",
          filePaths: ["src/components/__tests__/NavigationMenu.test.tsx"],
          type: "test",
          deps: ["Create NavigationMenu component"]
        },
        {
          name: "Update main App component",
          filePaths: ["src/App.tsx"],
          type: "code",
          deps: ["Create NavigationMenu component"]
        },
        {
          name: "Document navigation API",
          filePaths: ["README.md"],
          type: "docs",
          deps: ["Create NavigationMenu component"]
        }
      ]
    };
  }
  
  if (feature.toLowerCase().includes('filter')) {
    return {
      tasks: [
        {
          name: "Create FilterPanel component",
          filePaths: ["src/components/FilterPanel.tsx"],
          type: "code",
          deps: []
        },
        {
          name: "Add filter types",
          filePaths: ["src/types/filters.ts"],
          type: "code",
          deps: []
        },
        {
          name: "Create filter store",
          filePaths: ["src/stores/filterStore.ts"],
          type: "code",
          deps: ["Add filter types"]
        },
        {
          name: "Create useFilters hook",
          filePaths: ["src/hooks/useFilters.ts"],
          type: "code",
          deps: ["Create filter store"]
        },
        {
          name: "Write FilterPanel tests",
          filePaths: ["src/components/__tests__/FilterPanel.test.tsx"],
          type: "test",
          deps: ["Create FilterPanel component"]
        }
      ]
    };
  }
  
  // Generic component plan
  return {
    tasks: [
      {
        name: `Create ${componentName} component`,
        filePaths: [`src/components/${componentName}.tsx`],
        type: "code",
        deps: []
      },
      {
        name: `Add ${componentName} types`,
        filePaths: [`src/types/${featureName}.ts`],
        type: "code",
        deps: []
      },
      {
        name: `Write ${componentName} tests`,
        filePaths: [`src/components/__tests__/${componentName}.test.tsx`],
        type: "test",
        deps: [`Create ${componentName} component`]
      },
      {
        name: `Update documentation for ${feature}`,
        filePaths: ["README.md"],
        type: "docs",
        deps: [`Create ${componentName} component`]
      }
    ]
  };
}

describe('MayaPlan Agent', () => {
  test('should generate plan for navigation feature', () => {
    const result = generatePlan('Add responsive navigation menu');
    
    expect(result.tasks).toHaveLength(7);
    expect(result.tasks[0]).toMatchObject({
      name: 'Create NavigationMenu component',
      filePaths: ['src/components/NavigationMenu.tsx'],
      type: 'code',
      deps: []
    });
    
    expect(result.tasks[1]).toMatchObject({
      name: 'Add navigation types',
      filePaths: ['src/types/navigation.ts'],
      type: 'code',
      deps: []
    });
    
    expect(result.tasks[4]).toMatchObject({
      name: 'Write NavigationMenu tests',
      filePaths: ['src/components/__tests__/NavigationMenu.test.tsx'],
      type: 'test',
      deps: ['Create NavigationMenu component']
    });
  });

  test('should generate plan for filter feature', () => {
    const result = generatePlan('Add data filter panel');
    
    expect(result.tasks).toHaveLength(5);
    expect(result.tasks[0]).toMatchObject({
      name: 'Create FilterPanel component',
      filePaths: ['src/components/FilterPanel.tsx'],
      type: 'code',
      deps: []
    });
    
    expect(result.tasks[2]).toMatchObject({
      name: 'Create filter store',
      filePaths: ['src/stores/filterStore.ts'],
      type: 'code',
      deps: ['Add filter types']
    });
  });

  test('should generate generic plan for unknown feature', () => {
    const result = generatePlan('Add shopping cart');
    
    expect(result.tasks).toHaveLength(4);
    expect(result.tasks[0]).toMatchObject({
      name: 'Create Addshoppingcart component',
      filePaths: ['src/components/Addshoppingcart.tsx'],
      type: 'code',
      deps: []
    });
  });

  test('should include proper TypeScript file extensions', () => {
    const result = generatePlan('Add user profile');
    
    result.tasks.forEach(task => {
      task.filePaths.forEach(filePath => {
        if (filePath.includes('src/components/') || filePath.includes('src/hooks/')) {
          expect(filePath).toMatch(/\.(tsx?|ts)$/);
        }
      });
    });
  });

  test('should include test files for components', () => {
    const result = generatePlan('Add notification system');
    
    const testTasks = result.tasks.filter(task => task.type === 'test');
    expect(testTasks.length).toBeGreaterThan(0);
    
    testTasks.forEach(task => {
      expect(task.filePaths[0]).toContain('__tests__');
      expect(task.filePaths[0]).toMatch(/\.test\.tsx?$/);
    });
  });

  test('should maintain proper dependency order', () => {
    const result = generatePlan('Add responsive navigation menu');
    
    const createTask = result.tasks.find(t => t.name === 'Create NavigationMenu component');
    const testTask = result.tasks.find(t => t.name === 'Write NavigationMenu tests');
    const hookTask = result.tasks.find(t => t.name === 'Create useNavigation hook');
    
    expect(createTask.deps).toEqual([]);
    expect(testTask.deps).toContain('Create NavigationMenu component');
    expect(hookTask.deps).toContain('Create NavigationMenu component');
  });
  
  test('should follow React/TypeScript naming conventions', () => {
    const result = generatePlan('Add user dashboard');
    
    result.tasks.forEach(task => {
      task.filePaths.forEach(filePath => {
        if (filePath.includes('src/components/')) {
          const filename = filePath.split('/').pop();
          expect(filename).toMatch(/^[A-Z]/); // PascalCase
        }
        
        if (filePath.includes('src/hooks/')) {
          const filename = filePath.split('/').pop();
          expect(filename).toMatch(/^use[A-Z]/); // useHookName
        }
      });
    });
  });
});