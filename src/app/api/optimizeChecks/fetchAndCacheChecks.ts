import { kv } from '@vercel/kv';

const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

export interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
  contractAddress: string;
}

interface CacheData {
  data: CheckToken[];
  timestamp: number;
}

async function fetchChecksFromAPI(contractAddress: string): Promise<CheckToken[]> {
  let allTokens: CheckToken[] = [];
  let continuation: string | null = null;

  do {
    const tokensUrl = `https://api.reservoir.tools/tokens/v6`;
    const params = new URLSearchParams({
      collection: contractAddress,
      limit: '100',
      sortBy: 'floorAskPrice',
      sortDirection: 'asc',
    });

    if (continuation) {
      params.append('continuation', continuation);
    }

    const response = await fetch(`${tokensUrl}?${params}`, {
      headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.tokens && Array.isArray(data.tokens)) {
      const batchTokens = data.tokens
        .filter((token: any) => token.market?.floorAsk?.price?.amount?.native)
        .map((token: any) => ({
          tokenId: token.token?.tokenId || 'Unknown',
          name: token.token?.name || 'Unnamed',
          gridSize: contractAddress === CHECKS_CONTRACT_ADDRESS ? (parseInt(token.token?.name.split(' ')[0]) || 80) : 80,
          floorAskPrice: token.market.floorAsk.price.amount.native,
          contractAddress: contractAddress,
        }));

      allTokens = [...allTokens, ...batchTokens];
      continuation = data.continuation;
    } else {
      break;
    }
  } while (continuation && allTokens.length < 1000);

  return allTokens;
}

export async function fetchAndCacheChecks(): Promise<CheckToken[]> {
  const cacheKey = 'all_checks_data';
  const cachedData = await kv.get<CacheData>(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log('Using cached check data');
    return cachedData.data;
  }

  console.log('Fetching fresh check data');
  const checksTokens = await fetchChecksFromAPI(CHECKS_CONTRACT_ADDRESS);
  const editionsTokens = await fetchChecksFromAPI(EDITIONS_CONTRACT_ADDRESS);
  const allTokens = [...checksTokens, ...editionsTokens];

  const cacheData: CacheData = {
    data: allTokens,
    timestamp: Date.now(),
  };

  await kv.set(cacheKey, cacheData);
  return allTokens;
}