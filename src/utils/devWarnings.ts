/**
 * Development-only warnings for common React issues
 */

export const warnInfiniteLoop = (componentName: string, dependency: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ Potential infinite loop detected in ${componentName}. ` +
        `Check dependencies for '${dependency}'`
    );
  }
};

export const warnMissingDependency = (componentName: string, dependency: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ Missing dependency in ${componentName}. ` +
        `Consider adding '${dependency}' to the dependency array`
    );
  }
};

export const warnUnnecessaryRerender = (componentName: string, propName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ Unnecessary rerender detected in ${componentName}. ` +
        `Check if '${propName}' needs to be memoized`
    );
  }
};
