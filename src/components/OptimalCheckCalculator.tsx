'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";

// Constants
const RESERVOIR_API_KEY = process.env.NEXT_PUBLIC_RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Interfaces
interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
  contractAddress: string;
}

interface GroupedChecks {
  [key: string]: CheckToken[];
}

interface CacheData {
  data: CheckToken[];
  timestamp: number;
}

const OptimalCheckCalculator: React.FC = () => {
  // State variables
  const [groupedChecks, setGroupedChecks] = useState<GroupedChecks>({});
  const [optimalCombination, setOptimalCombination] = useState<{ gridSize: number; count: number; isEdition: boolean }[]>([]);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get cached data
  const getCachedData = (key: string): CheckToken[] | null => {
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      const parsedData: CacheData = JSON.parse(cachedData);
      if (Date.now() - parsedData.timestamp < CACHE_DURATION) {
        return parsedData.data;
      }
    }
    return null;
  };

  // Function to set cached data
  const setCachedData = (key: string, data: CheckToken[]) => {
    const cacheData: CacheData = {
      data: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  };

  // Function to fetch checks from the API
  const fetchChecks = async (contractAddress: string): Promise<CheckToken[]> => {
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
  };

  // Function to group checks by tier
  const groupChecksByTier = (checks: CheckToken[]) => {
    const grouped: GroupedChecks = {
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
  };

  // Function to calculate the optimal combination of checks
  const calculateOptimalCombination = (checks: CheckToken[]) => {
    const gridSizes = [80, 40, 20, 10, 5, 4, 2, 1];
    const dp: number[] = new Array(65).fill(Infinity);
    dp[0] = 0;
    const combination: { [key: number]: CheckToken[] } = { 0: [] };

    // Group checks by grid size
    const checksByGridSize: { [key: number]: CheckToken[] } = {};
    checks.forEach(check => {
      const key = check.contractAddress === EDITIONS_CONTRACT_ADDRESS ? 'Editions' : check.gridSize;
      if (!checksByGridSize[key]) {
        checksByGridSize[key] = [];
      }
      checksByGridSize[key].push(check);
    });

    // Sort checks in each group by price
    Object.values(checksByGridSize).forEach(group => {
      group.sort((a, b) => a.floorAskPrice - b.floorAskPrice);
    });

    // Dynamic programming to find optimal combination
    for (let i = 1; i <= 64; i++) {
      for (const size of ['Editions', ...gridSizes]) {
        if (i >= 80 / (size === 'Editions' ? 80 : size) && checksByGridSize[size] && checksByGridSize[size].length > 0) {
          const check = checksByGridSize[size][0]; // Get the cheapest check of this size
          const newCost = dp[i - Math.floor(80 / (size === 'Editions' ? 80 : size))] + check.floorAskPrice;
          if (newCost < dp[i]) {
            dp[i] = newCost;
            combination[i] = [...combination[i - Math.floor(80 / (size === 'Editions' ? 80 : size))], check];
            // Remove the used check from the available checks
            checksByGridSize[size] = checksByGridSize[size].slice(1);
          }
        }
      }
    }

    // Set state based on calculation results
    if (dp[64] === Infinity) {
      setOptimalCombination([]);
      setTotalCost(null);
    } else {
      const optimalChecks = combination[64];
      const groupedOptimal = groupChecksByTier(optimalChecks);
      setGroupedChecks(groupedOptimal);
      setOptimalCombination(
        Object.entries(groupedOptimal).map(([tier, checks]) => ({
          gridSize: tier === 'Editions' ? 80 : parseInt(tier),
          count: checks.length,
          isEdition: tier === 'Editions'
        })).filter(item => item.count > 0)
      );
      setTotalCost(dp[64]);
    }
  };

  // Function to fetch data and calculate optimal combination
  const fetchAndCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      const checksTokens = await fetchChecks(CHECKS_CONTRACT_ADDRESS);
      const editionsTokens = await fetchChecks(EDITIONS_CONTRACT_ADDRESS);
      const allTokens = [...checksTokens, ...editionsTokens];

      if (allTokens.length === 0) {
        throw new Error("No tokens fetched");
      }

      calculateOptimalCombination(allTokens);
    } catch (err) {
      console.error('Error in fetchAndCalculate:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setOptimalCombination([]);
      setTotalCost(null);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch and calculate on component mount and periodically
  useEffect(() => {
    fetchAndCalculate();
    const intervalId = setInterval(fetchAndCalculate, CACHE_DURATION);
    return () => clearInterval(intervalId);
  }, []);

  // Render component
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Optimal Check Combination Calculator</CardTitle>
        <CardDescription>Most cost-efficient way to create a single check</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {totalCost !== null && (
          <div className="border p-4 rounded-lg">
            <p><strong>Total Cost:</strong> {totalCost.toFixed(4)} ETH</p>
            <p><strong>Optimal Combination:</strong></p>
            <ul>
              {optimalCombination.map((item, index) => (
                <li key={index}>
                  {item.count}x {item.isEdition ? 'Editions' : `${item.gridSize}-grid check${item.count > 1 ? 's' : ''}`}
                </li>
              ))}
            </ul>
            <p><strong>Detailed Breakdown:</strong></p>
            {Object.entries(groupedChecks).map(([tier, checks]) => (
              checks.length > 0 && (
                <div key={tier}>
                  <h4>{tier}</h4>
                  <ul>
                    {checks.map(check => (
                      <li key={check.tokenId}>
                        ID: {check.tokenId}, Price: {check.floorAskPrice.toFixed(4)} ETH
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OptimalCheckCalculator;