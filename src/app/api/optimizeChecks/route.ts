import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CACHE_DURATION = 120 * 60 * 1000; // 120 minutes in milliseconds
const CACHE_KEY = 'optimize_checks_result';

const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';

interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
  contractAddress: string;
}
interface CacheData {
    data: any;
    timestamp: number;
  }
  
  async function getCachedData(): Promise<CacheData | null> {
    const cacheData = await kv.get<CacheData>(CACHE_KEY);
    if (cacheData && Date.now() - cacheData.timestamp < CACHE_DURATION) {
      return cacheData;
    }
    return null;
  }
  
  async function setCachedData(data: any): Promise<void> {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
    };
    await kv.set(CACHE_KEY, cacheData);
  }
  
async function fetchChecks(contractAddress: string): Promise<CheckToken[]> {
    const cacheKey = `checks_${contractAddress}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${contractAddress}`);
      return cachedData;
    }

    let allTokens: CheckToken[] = [];
    let continuation: string | null = null;
    const batchSize = 100; // Fetch 100 tokens at a time
  
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
  
      console.log("Fetching from URL:", `${tokensUrl}?${params}`);
  
      const tokensResponse = await fetch(`${tokensUrl}?${params}`, {
        headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
      });
  
      if (!tokensResponse.ok) {
        throw new Error(`HTTP error! status: ${tokensResponse.status}`);
      }
  
      const tokensData = await tokensResponse.json();
  
      if (tokensData.tokens && Array.isArray(tokensData.tokens)) {
        const batchTokens = tokensData.tokens
          .filter((token: any) => token.market?.floorAsk?.price?.amount?.native)
          .map((token: any) => ({
            tokenId: token.token?.tokenId || 'Unknown',
            name: token.token?.name || 'Unnamed',
            gridSize: contractAddress === CHECKS_CONTRACT_ADDRESS ? (parseInt(token.token?.name.split(' ')[0]) || 80) : 80,
            floorAskPrice: token.market.floorAsk.price.amount.native,
            contractAddress: contractAddress,
          }));
  
        allTokens = [...allTokens, ...batchTokens];
        continuation = tokensData.continuation;
      } else {
        break;
      }
    } while (continuation && allTokens.length < 1000); // Fetch up to 1000 tokens or until no more continuation
  
    setCachedData(cacheKey, allTokens);
    return allTokens;
}

function calculateOptimalCombination(checks: CheckToken[]) {
  const gridSizes = [80, 40, 20, 10, 5, 4, 2, 1];
  const dp: number[] = new Array(65).fill(Infinity);
  dp[0] = 0;
  const combination: { [key: number]: CheckToken[] } = { 0: [] };

  // Group checks by grid size
  const checksByGridSize: { [key: string]: CheckToken[] } = {};
  checks.forEach(check => {
    const key = check.contractAddress === EDITIONS_CONTRACT_ADDRESS ? 'Editions' : check.gridSize.toString();
    if (!checksByGridSize[key]) {
      checksByGridSize[key] = [];
    }
    checksByGridSize[key].push(check);
  });

  // Sort checks in each group by price
  Object.values(checksByGridSize).forEach(group => {
    group.sort((a, b) => a.floorAskPrice - b.floorAskPrice);
  });

  for (let i = 1; i <= 64; i++) {
    for (const size of ['Editions', ...gridSizes.map(String)]) {
      const numericSize = size === 'Editions' ? 80 : parseInt(size);
      if (i >= 80 / numericSize && checksByGridSize[size] && checksByGridSize[size].length > 0) {
        const check = checksByGridSize[size][0];
        const newCost = dp[i - Math.floor(80 / numericSize)] + check.floorAskPrice;
        if (newCost < dp[i]) {
          dp[i] = newCost;
          combination[i] = [...combination[i - Math.floor(80 / numericSize)], check];
          checksByGridSize[size] = checksByGridSize[size].slice(1);
        }
      }
    }
  }

  if (dp[64] === Infinity) {
    return null;
  } else {
    const optimalChecks = combination[64];
    const groupedOptimal = groupChecksByTier(optimalChecks);
    return {
      totalCost: dp[64],
      combination: Object.entries(groupedOptimal).map(([tier, checks]) => ({
        gridSize: tier === 'Editions' ? 80 : parseInt(tier),
        count: checks.length,
        isEdition: tier === 'Editions'
      })).filter(item => item.count > 0),
      groupedChecks: groupedOptimal
    };
  }
}

function groupChecksByTier(checks: CheckToken[]) {
  const grouped: { [key: string]: CheckToken[] } = {
    'Editions': [],
    '80 grid': [],
    '40 grid': [],
    '20 grid': [],
    '10 grid': [],
    '5 grid': [],
    '4 grid': [],
    '2 grid': [],
    '1 grid': [],
  };

  checks.forEach(check => {
    if (check.contractAddress === EDITIONS_CONTRACT_ADDRESS) {
      grouped['Editions'].push(check);
    } else {
      const key = `${check.gridSize} grid`;
      if (grouped[key]) {
        grouped[key].push(check);
      }
    }
  });

  return grouped;
}

export async function GET(req: NextRequest) {
    try {
      console.log('API Route called');
      const start = Date.now();
  
      const cachedResult = await getCachedData();
      if (cachedResult) {
        console.log('Using cached data');
        const timeSinceLastCache = Date.now() - cachedResult.timestamp;
        return NextResponse.json({
          ...cachedResult.data,
          isCached: true,
          apiDuration: Date.now() - start,
          lastCacheTime: cachedResult.timestamp,
          timeSinceLastCache,
        });
      }
  
      console.log('Fetching checks from Reservoir API...');
      const checksTokens = await fetchChecks(CHECKS_CONTRACT_ADDRESS);
      console.log(`Fetched ${checksTokens.length} checks`);
      
      const editionsTokens = await fetchChecks(EDITIONS_CONTRACT_ADDRESS);
      console.log(`Fetched ${editionsTokens.length} editions`);
      
      const allTokens = [...checksTokens, ...editionsTokens];
      console.log(`Total tokens: ${allTokens.length}`);
  
      console.log('Calculating optimal combination...');
      const result = calculateOptimalCombination(allTokens);
      console.log('Calculation complete');
      
      if (result) {
        await setCachedData(result);
        
        const end = Date.now();
        return NextResponse.json({
          ...result,
          isCached: false,
          apiDuration: end - start,
          lastCacheTime: end,
          timeSinceLastCache: null,
        });
      } else {
        console.error('Unable to calculate optimal combination');
        return NextResponse.json({ 
          error: 'Unable to calculate optimal combination',
          apiDuration: Date.now() - start,
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error in optimization:', error);
      return NextResponse.json({ 
        error: 'An error occurred during optimization',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        apiDuration: Date.now() - start,
      }, { status: 500 });
    }
}
