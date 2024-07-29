import { kv } from '@vercel/kv';

const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';

const CACHE_KEY = 'checks_data';
const CACHE_DURATION = 60 * 15; // 15 minutes in seconds
const CACHE_REFRESH_THRESHOLD = 60 * 1; // 1 minute in seconds

export interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
  contractAddress: string;
  image: string;
}

interface CachedData {
  checks: CheckToken[];
  timestamp: number;
}

async function fetchTokens(contractAddress: string, attributes?: Record<string, string>): Promise<any[]> {
  const tokensUrl = `https://api.reservoir.tools/tokens/v6`;
  const params = new URLSearchParams({
    collection: contractAddress,
    limit: '100',
    sortBy: 'floorAskPrice',
    sortDirection: 'asc',
  });

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      params.append(`attributes[${key}]`, value);
    }
  }

  console.log(`Fetching tokens from URL: ${tokensUrl}?${params}`);
  
  const response = await fetch(`${tokensUrl}?${params}`, {
    headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.tokens || [];
}

async function getCachedChecks(): Promise<CachedData | null> {
  try {
    const cachedData = await kv.get<CachedData>(CACHE_KEY);
    if (cachedData) {
      console.log(`Retrieved checks from cache at timestamp: ${cachedData.timestamp}`);
      return cachedData;
    } else {
      console.log('No cached data found');
    }
  } catch (error) {
    console.error('Error accessing cache:', error);
  }
  return null;
}

async function setCachedChecks(checks: CheckToken[]): Promise<void> {
  try {
    const cachedData: CachedData = {
      checks,
      timestamp: Date.now(),
    };
    await kv.set(CACHE_KEY, cachedData, { ex: CACHE_DURATION });
    console.log(`Stored checks in cache with timestamp: ${cachedData.timestamp}`);
  } catch (error) {
    console.error('Error storing in cache:', error);
  }
}

export async function fetchChecks(): Promise<CheckToken[]> {
  try {
    console.log('Attempting to fetch checks');
    
    const cachedData = await getCachedChecks();
    const now = Date.now();

    if (cachedData) {
      console.log(`Current timestamp: ${now}, Cached timestamp: ${cachedData.timestamp}, Time difference: ${(now - cachedData.timestamp) / 1000} seconds`);
    }

    if (cachedData && (now - cachedData.timestamp) / 1000 < CACHE_REFRESH_THRESHOLD) {
      console.log('Using cached data');
      return cachedData.checks;
    }

    console.log('Fetching fresh check data from API');
    let allChecks: CheckToken[] = [];
    const gridSizes = [1, 4, 5, 10, 20, 40, 80];

    // Fetch Checks tokens
    for (const size of gridSizes) {
      const tokens = await fetchTokens(CHECKS_CONTRACT_ADDRESS, { 'Checks': size.toString() });
      const processedTokens = tokens
        .filter((token: any) => token.market?.floorAsk?.price?.amount?.native)
        .map((token: any) => ({
          tokenId: token.token?.tokenId || 'Unknown',
          name: token.token?.name || 'Unnamed',
          gridSize: size,
          floorAskPrice: token.market.floorAsk.price.amount.native,
          contractAddress: CHECKS_CONTRACT_ADDRESS,
          image: token.token?.image || '',
        }));
      allChecks = [...allChecks, ...processedTokens];
    }

    // Fetch Editions tokens
    const editionsTokens = await fetchTokens(EDITIONS_CONTRACT_ADDRESS);
    const processedEditions = editionsTokens
      .filter((token: any) => token.market?.floorAsk?.price?.amount?.native)
      .map((token: any) => ({
        tokenId: token.token?.tokenId || 'Unknown',
        name: token.token?.name || 'Unnamed',
        gridSize: 80,
        floorAskPrice: token.market.floorAsk.price.amount.native,
        contractAddress: EDITIONS_CONTRACT_ADDRESS,
        image: token.token?.image || '',
      }));
    allChecks = [...allChecks, ...processedEditions];

    // Cache the new data
    await setCachedChecks(allChecks);

    return allChecks;
  } catch (error) {
    console.error('Error in fetchChecks:', error);
    throw error;
  }
}
