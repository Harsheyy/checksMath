const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';

export interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
  contractAddress: string;
  image: string;
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
  
  const response = await fetch(`${tokensUrl}?${params}`, {
    headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.tokens || [];
}

export async function fetchChecks(): Promise<CheckToken[]> {
  try {
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

    return allChecks;
  } catch (error) {
    console.error('Error in fetchChecks:', error);
    throw error;
  }
}
