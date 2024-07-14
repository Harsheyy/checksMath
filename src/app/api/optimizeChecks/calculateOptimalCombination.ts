import { CheckToken } from './fetchAndCacheChecks';

export interface OptimizationResult {
  totalCost: number;
  combination: { gridSize: number; count: number; isEdition: boolean }[];
  groupedChecks: { [key: string]: CheckToken[] };
}

export function calculateOptimalCombination(checks: CheckToken[]): OptimizationResult {
  const gridSizes = [80, 40, 20, 10, 5, 4, 2, 1];
  const dp: number[] = new Array(65).fill(Infinity);
  dp[0] = 0;
  const combination: { [key: number]: CheckToken[] } = { 0: [] };

  // Group checks by grid size
  const checksByGridSize: { [key: string]: CheckToken[] } = {};
  checks.forEach(check => {
    const key = check.contractAddress === '0x34eebee6942d8def3c125458d1a86e0a897fd6f9' ? 'Editions' : check.gridSize.toString();
    if (!checksByGridSize[key]) {
      checksByGridSize[key] = [];
    }
    checksByGridSize[key].push(check);
  });

  // Sort checks in each group by price
  Object.values(checksByGridSize).forEach(group => {
    group.sort((a, b) => a.floorAskPrice - b.floorAskPrice);
  });

  for (let i = 1; i <= 64; i++) {
    for (const size of ['Editions', ...gridSizes.map(String)]) {
      const numericSize = size === 'Editions' ? 80 : parseInt(size);
      if (i >= 80 / numericSize && checksByGridSize[size] && checksByGridSize[size].length > 0) {
        const check = checksByGridSize[size][0];
        const newCost = dp[i - Math.floor(80 / numericSize)] + check.floorAskPrice;
        if (newCost < dp[i]) {
          dp[i] = newCost;
          combination[i] = [...combination[i - Math.floor(80 / numericSize)], check];
          checksByGridSize[size] = checksByGridSize[size].slice(1);
        }
      }
    }
  }

  const optimalChecks = combination[64];
  const groupedOptimal = groupChecksByTier(optimalChecks);

  return {
    totalCost: dp[64],
    combination: Object.entries(groupedOptimal).map(([tier, checks]) => ({
      gridSize: tier === 'Editions' ? 80 : parseInt(tier),
      count: checks.length,
      isEdition: tier === 'Editions'
    })).filter(item => item.count > 0),
    groupedChecks: groupedOptimal
  };
}

function groupChecksByTier(checks: CheckToken[]) {
  const grouped: { [key: string]: CheckToken[] } = {
    'Editions': [],
    '80 grid': [],
    '40 grid': [],
    '20 grid': [],
    '10 grid': [],
    '5 grid': [],
    '4 grid': [],
    '2 grid': [],
    '1 grid': [],
  };

  checks.forEach(check => {
    if (check.contractAddress === '0x34eebee6942d8def3c125458d1a86e0a897fd6f9') {
      grouped['Editions'].push(check);
    } else {
      const key = `${check.gridSize} grid`;
      if (grouped[key]) {
        grouped[key].push(check);
      }
    }
  });

  return grouped;
}