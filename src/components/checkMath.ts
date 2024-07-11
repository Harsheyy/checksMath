// checkMath.ts

interface Check {
    gridSize: number;
    count: number;
  }
  
  export function calculateTotalChecks(checks: Check[]): number {
    let total = 0;
    checks.forEach(check => {
      total += check.count * (80 / check.gridSize);
    });
    return total;
  }
  
  export function canMakeSingleCheck(checks: Check[]): boolean {
    return calculateTotalChecks(checks) >= 64;
  }
  
  export function optimizeChecks(checks: Check[]): Check[] {
    const gridSizes = [80, 40, 20, 10, 5, 4, 2, 1];
    let optimizedChecks: Check[] = [...checks];
  
    for (let i = 0; i < gridSizes.length - 1; i++) {
      const currentSize = gridSizes[i];
      const nextSize = gridSizes[i + 1];
      
      const currentSizeChecks = optimizedChecks.find(c => c.gridSize === currentSize);
      if (currentSizeChecks && currentSizeChecks.count >= 2) {
        const combinedChecks = Math.floor(currentSizeChecks.count / 2);
        currentSizeChecks.count %= 2;
        
        const nextSizeChecks = optimizedChecks.find(c => c.gridSize === nextSize);
        if (nextSizeChecks) {
          nextSizeChecks.count += combinedChecks;
        } else {
          optimizedChecks.push({ gridSize: nextSize, count: combinedChecks });
        }
      }
    }
  
    return optimizedChecks.filter(c => c.count > 0).sort((a, b) => b.gridSize - a.gridSize);
  }