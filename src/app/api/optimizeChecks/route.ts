/**
 * This module handles the API route for fetching and processing Check token data.
 * It provides endpoints for retrieving optimal combinations, sweep prices, and the cheapest single check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { fetchAndCacheChecks, CheckToken } from './fetchAndCacheChecks';
import { calculateOptimalCombination } from './calculateOptimalCombination';
import { calculateSweepPrice } from './calculateSweepPrice';

const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';

/**
 * Handles GET requests to the API endpoint.
 * 
 * @param req - The incoming request object
 * @returns A JSON response with check data or an error message
 */
export async function GET(req: NextRequest) {
  try {
    const start = Date.now();

    // Fetch and cache checks
    let allChecks: CheckToken[];
    try {
      allChecks = await fetchAndCacheChecks(true); // Force refresh
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

    // Update last update time in KV store
    try {
      await kv.set('last_update_time', Date.now());
    } catch (kvError) {
      console.error('Failed to update last_update_time in KV store:', kvError);
    }

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