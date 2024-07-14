import { CheckToken } from './fetchAndCacheChecks';

export interface SweepPriceResult {
  editionsSweepPrice: number;
  checksSweepPrice: number;
  editionsChecks: CheckToken[];
  checksChecks: CheckToken[];
}

export function calculateSweepPrice(checks: CheckToken[]): SweepPriceResult {
  // Separate Editions and Checks
  const editionsChecks = checks.filter(check => check.contractAddress === '0x34eebee6942d8def3c125458d1a86e0a897fd6f9');
  const checksChecks = checks.filter(check => check.contractAddress === '0x036721e5a769cc48b3189efbb9cce4471e8a48b1');

  // Sort both arrays by price (ascending)
  const sortedEditions = [...editionsChecks].sort((a, b) => a.floorAskPrice - b.floorAskPrice);
  const sortedChecks = [...checksChecks].sort((a, b) => a.floorAskPrice - b.floorAskPrice);

  // Take the 64 cheapest from each
  const cheapestEditions = sortedEditions.slice(0, 64);
  const cheapestChecks = sortedChecks.slice(0, 64);

  // Calculate total price for each
  const editionsSweepPrice = cheapestEditions.reduce((sum, check) => sum + check.floorAskPrice, 0);
  const checksSweepPrice = cheapestChecks.reduce((sum, check) => sum + check.floorAskPrice, 0);

  return {
    editionsSweepPrice,
    checksSweepPrice,
    editionsChecks: cheapestEditions,
    checksChecks: cheapestChecks
  };
}