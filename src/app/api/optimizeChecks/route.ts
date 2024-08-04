import { NextResponse } from 'next/server';
import { fetchChecks } from './fetchChecks';
import { calculateOptimalCombination } from './calculateOptimalCombination';
import { calculateSweepPrice } from './calculateSweepPrice';
import { calculateCheapestSingleCheck } from './calculateCheapestSingleCheck';

export const runtime = 'edge';

let cachedData: any = null;
let lastUpdateTime: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function GET(request: Request) {
  const currentTime = Date.now();
  const urlObj = new URL(request.url);
  const forceRefresh = urlObj.searchParams.get('forceRefresh') === 'true';

  if (cachedData && !forceRefresh && currentTime - lastUpdateTime < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedData,
      cacheTimestamp: new Date(lastUpdateTime).toISOString(),
    });
  }

  try {
    const start = performance.now();

    const allChecks = await fetchChecks();
    const optimalCombination = calculateOptimalCombination(allChecks);
    const sweepPrices = calculateSweepPrice(allChecks);
    const cheapestSingleCheck = calculateCheapestSingleCheck(allChecks);

    const end = performance.now();
    const apiDuration = end - start;

    cachedData = {
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
    };

    lastUpdateTime = currentTime;

    return NextResponse.json({
      ...cachedData,
      cacheTimestamp: new Date(lastUpdateTime).toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
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