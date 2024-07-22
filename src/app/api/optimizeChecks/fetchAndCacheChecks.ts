/**
 * This module handles fetching and caching of Check tokens from the Reservoir API.
 * It provides functionality to retrieve Check tokens of various grid sizes and Editions,
 * and caches the results for improved performance.
 */

import { kv } from '@vercel/kv';

// API and contract constants
const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';
const CACHE_KEY = 'checks_cache';
const CACHE_TIMESTAMP_KEY = 'checks_cache_timestamp';
const CACHE_DURATION = 60 * 60; // 1 hour in seconds

// Interface representing a Check token
export interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
  contractAddress: string;
  image: string;
}

/**
 * Fetches tokens from the Reservoir API for a given contract address and attributes.
 * 
 * @param contractAddress - The address of the contract to fetch tokens for.
 * @param attributes - Optional attributes to filter the tokens.
 * @returns An array of token data from the API.
 */
async function fetchTokens(contractAddress: string, attributes?: Record<string, string>): Promise<any[]> {
  let allTokens: any[] = [];
  let continuation: string | null = null;
  const batchSize = 100;

  do {
    const tokensUrl = `https://api.reservoir.tools/tokens/v6`;
    const params = new URLSearchParams({
      collection: contractAddress,
      limit: batchSize.toString(),
      sortBy: 'floorAskPrice',
      sortDirection: 'asc',
    });

    if (continuation) {
      params.append('continuation', continuation);
    }

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        params.append(`attributes[${key}]`, value);
      }
    }

    const response = await fetch(`${tokensUrl}?${params}`, {
      headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.tokens && Array.isArray(data.tokens)) {
      allTokens = [...allTokens, ...data.tokens];
      continuation = data.continuation;
    } else {
      break;
    }
  } while (continuation && allTokens.length < 1000);

  return allTokens;
}

/**
 * Fetches and caches Check tokens and Editions.
 * 
 * @param forceRefresh - If true, bypasses the cache and fetches fresh data.
 * @returns An array of CheckToken objects.
 */
export async function fetchAndCacheChecks(forceRefresh: boolean = false): Promise<CheckToken[]> {
  const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
  
  if (!forceRefresh) {
    // Try to get the cache timestamp from KV store
    const lastCacheTime = await kv.get<number>(CACHE_TIMESTAMP_KEY);
    
    if (lastCacheTime && (currentTime - lastCacheTime < CACHE_DURATION)) {
      // If the cache is still valid, return the cached data
      const cachedChecks = await kv.get<CheckToken[]>(CACHE_KEY);
      if (cachedChecks) {
        return cachedChecks;
      }
    }
  }

  try {
    let allChecks: CheckToken[] = [];
    const gridSizes = [1, 4, 5, 10, 20, 40, 80];

    // Fetch Checks tokens
    for (const size of gridSizes) {
      try {
        const tokens = await fetchTokens(CHECKS_CONTRACT_ADDRESS, { 'Checks': size.toString() });
        const filteredTokens = tokens.filter((token: any) => token.market?.floorAsk?.price?.amount?.native);
        
        const processedTokens = filteredTokens.map((token: any) => ({
          tokenId: token.token?.tokenId || 'Unknown',
          name: token.token?.name || 'Unnamed',
          gridSize: size,
          floorAskPrice: token.market.floorAsk.price.amount.native,
          contractAddress: CHECKS_CONTRACT_ADDRESS,
          image: token.token?.image || '',
        }));
        allChecks = [...allChecks, ...processedTokens];
      } catch (error) {
        console.error(`Error fetching ${size} checks:`, error);
      }
    }

    // Fetch Editions tokens
    try {
      const editionsTokens = await fetchTokens(EDITIONS_CONTRACT_ADDRESS);
      const filteredEditions = editionsTokens.filter((token: any) => token.market?.floorAsk?.price?.amount?.native);
      
      const processedEditions = filteredEditions.map((token: any) => ({
        tokenId: token.token?.tokenId || 'Unknown',
        name: token.token?.name || 'Unnamed',
        gridSize: 80, // Editions are always 80
        floorAskPrice: token.market.floorAsk.price.amount.native,
        contractAddress: EDITIONS_CONTRACT_ADDRESS,
        image: token.token?.image || '',
      }));
      allChecks = [...allChecks, ...processedEditions];
    } catch (error) {
      console.error('Error fetching Editions tokens:', error);
    }

    if (allChecks.length === 0) {
      console.warn('No checks were processed. This might indicate an issue with the data or filtering.');
    } else {
      // Update the KV store with the new data and timestamp
      await kv.set(CACHE_KEY, allChecks);
      await kv.set(CACHE_TIMESTAMP_KEY, currentTime);
    }

    return allChecks;
  } catch (error) {
    console.error('Error in fetchAndCacheChecks:', error);
    throw error;
  }
}