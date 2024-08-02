import { NextRequest, NextResponse } from 'next/server';
import { fetchChecks, CheckToken } from './fetchChecks';
import { calculateOptimalCombination } from './calculateOptimalCombination';
import { calculateSweepPrice } from './calculateSweepPrice';

const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const timestamp = Date.now();
    const start = performance.now();

    const allChecks = await fetchChecks();
    const optimalCombination = calculateOptimalCombination(allChecks);
    const sweepPrices = calculateSweepPrice(allChecks);
    const cheapestSingleCheck = calculateCheapestSingleCheck(allChecks);

    const end = performance.now();
    const apiDuration = end - start;

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
      apiDuration,
      timestamp,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: 'An error occurred while processing checks',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  }
}

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