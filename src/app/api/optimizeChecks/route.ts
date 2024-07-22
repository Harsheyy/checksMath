import { NextRequest, NextResponse } from 'next/server';
import { fetchChecks, CheckToken } from './fetchChecks';
import { calculateOptimalCombination } from './calculateOptimalCombination';
import { calculateSweepPrice } from './calculateSweepPrice';

const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';

/**
 * Handles GET requests to the API endpoint.
 * 
 * @param req - The incoming request object
 * @returns A JSON response with check data or an error message
 */
export async function GET(req: NextRequest) {
  try {
    const start = Date.now();

    // Fetch checks
    let allChecks: CheckToken[];
    try {
      allChecks = await fetchChecks();
    } catch (fetchError) {
      console.error('Error fetching checks:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch check data',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error during fetch',
      }, { status: 500 });
    }

    // Calculate optimal combination and sweep prices
    const optimalCombination = calculateOptimalCombination(allChecks);
    const sweepPrices = calculateSweepPrice(allChecks);
    const cheapestSingleCheck = calculateCheapestSingleCheck(allChecks);

    const end = Date.now();

    // Prepare response
    const response = {
      optimalCombination,
      sweepPrices,
      cheapestSingleCheck: cheapestSingleCheck ? {
        tokenId: cheapestSingleCheck.tokenId,
        price: cheapestSingleCheck.floorAskPrice,
        image: cheapestSingleCheck.image,
        url: `https://opensea.io/assets/${cheapestSingleCheck.contractAddress}/${cheapestSingleCheck.tokenId}`,
        contractAddress: cheapestSingleCheck.contractAddress,
        gridSize: cheapestSingleCheck.gridSize,
      } : null,
      apiDuration: end - start,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unhandled error in API route:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Calculates the cheapest single check from the given array of checks.
 * 
 * @param checks - Array of CheckToken objects
 * @returns The cheapest single check or null if no single checks are found
 */
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