import { CheckToken } from './fetchChecks';

const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';

function calculateCheapestSingleCheck(checks: CheckToken[]): CheckToken | null {
  const singleChecks = checks.filter(check => 
    check.gridSize === 1 && check.contractAddress === CHECKS_CONTRACT_ADDRESS
  );

  if (singleChecks.length === 0) {
    return null;
  }

  return singleChecks.reduce((cheapest, current) => 
    current.floorAskPrice < cheapest.floorAskPrice ? current : cheapest
  );
}