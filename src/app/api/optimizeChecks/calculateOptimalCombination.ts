import { CheckToken } from './fetchChecks';

export interface OptimizationResult {
  totalCost: number;
  combination: { 
    gridSize: number | 'Editions'; 
    count: number; 
    isEdition: boolean;
    cheapestCheck: CheckToken | null;
  }[];
  groupedChecks: { [key: string]: CheckToken[] };
}

const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';

export function calculateOptimalCombination(checks: CheckToken[]): OptimizationResult {
  const gridSizes = [80, 40, 20, 10, 5, 4, 1];
  const dp: number[] = new Array(65).fill(Infinity);
  dp[0] = 0;
  const combination: { [key: number]: CheckToken[] } = { 0: [] };

  // Group checks by grid size, including Editions with 80 grid size
  const checksByGridSize: { [key: string]: CheckToken[] } = {};
  checks.forEach(check => {
    const key = check.gridSize.toString();
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
    for (const size of gridSizes) {
      if (i >= 80 / size && checksByGridSize[size.toString()] && checksByGridSize[size.toString()].length > 0) {
        const check = checksByGridSize[size.toString()][0];
        const newCost = dp[i - Math.floor(80 / size)] + check.floorAskPrice;
        if (newCost < dp[i]) {
          dp[i] = newCost;
          combination[i] = [...combination[i - Math.floor(80 / size)], check];
          checksByGridSize[size.toString()] = checksByGridSize[size.toString()].slice(1);
        }
      }
    }
  }

  const optimalChecks = combination[64];
  const groupedOptimal = groupChecksByTier(optimalChecks);

  const sortedCombination: OptimizationResult['combination'] = Object.entries(groupedOptimal)
    .map(([tier, checks]): OptimizationResult['combination'][number] => {
      const isEdition = tier === 'Editions';
      return {
        gridSize: isEdition ? 'Editions' : parseInt(tier),
        count: checks.length,
        isEdition: isEdition,
        cheapestCheck: checks.length > 0 ? checks[0] : null
      };
    })
    .filter(item => item.count > 0)
    .sort((a, b) => {
      if (a.gridSize === 'Editions') return -1;
      if (b.gridSize === 'Editions') return 1;
      return (b.gridSize as number) - (a.gridSize as number);
    });

  return {
    totalCost: dp[64],
    combination: sortedCombination,
    groupedChecks: groupedOptimal
  };
}

function groupChecksByTier(checks: CheckToken[]) {
  const grouped: { [key: string]: CheckToken[] } = {
    'Editions': [],
    '80': [],
    '40': [],
    '20': [],
    '10': [],
    '5': [],
    '4': [],
    '1': [],
  };

  checks.forEach(check => {
    if (check.contractAddress === EDITIONS_CONTRACT_ADDRESS) {
      grouped['Editions'].push(check);
    } else {
      const key = check.gridSize.toString();
      if (grouped[key]) {
        grouped[key].push(check);
      }
    }
  });

  // Sort each group by price
  Object.values(grouped).forEach(group => {
    group.sort((a, b) => a.floorAskPrice - b.floorAskPrice);
  });

  return grouped;
}