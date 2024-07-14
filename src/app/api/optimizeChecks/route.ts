import { NextRequest, NextResponse } from 'next/server';
import { fetchAndCacheChecks } from './fetchAndCacheChecks';
import { calculateOptimalCombination } from './calculateOptimalCombination';
import { calculateSweepPrice } from './calculateSweepPrice';
import { calculateCheapestSingleCheck } from './calculateCheapestSingleCheck';

export async function GET(req: NextRequest) {
  try {
    const start = Date.now();

    // Fetch and cache all check data
    const allChecks = await fetchAndCacheChecks();

    // Calculate optimal combination
    const optimalCombination = calculateOptimalCombination(allChecks);

    // Calculate sweep prices
    const sweepPrices = calculateSweepPrice(allChecks);

    // Find cheapest single check
    const cheapestSingleCheck = calculateCheapestSingleCheck(allChecks);

    const end = Date.now();

    return NextResponse.json({
      optimalCombination,
      sweepPrices,
      cheapestSingleCheck,
      apiDuration: end - start,
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: 'An error occurred during processing',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}