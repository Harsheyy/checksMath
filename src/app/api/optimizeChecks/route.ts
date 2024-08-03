import { NextResponse } from 'next/server';
import { fetchChecks } from './fetchChecks';
import { calculateOptimalCombination } from './calculateOptimalCombination';
import { calculateSweepPrice } from './calculateSweepPrice';
import { calculateCheapestSingleCheck } from './calculateCheapestSingleCheck';

export const runtime = 'edge';

export async function GET() {
  try {
    const start = performance.now();

    const allChecks = await fetchChecks();
    const optimalCombination = calculateOptimalCombination(allChecks);
    const sweepPrices = calculateSweepPrice(allChecks);
    const cheapestSingleCheck = calculateCheapestSingleCheck(allChecks);

    const end = performance.now();
    const apiDuration = end - start;

    return NextResponse.json({
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
      cacheTimestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=59',
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
      },
    });
  }
}