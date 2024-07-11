'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";

// Constants
const RESERVOIR_API_KEY = process.env.NEXT_PUBLIC_RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

// Interface for the Check token
interface CheckToken {
  tokenId: string;
  name: string;
  image: string;
  floorAskPrice: number;
}

const CheapestCheck: React.FC = () => {
  // State variables
  const [cheapestSingleCheck, setCheapestSingleCheck] = useState<CheckToken | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Function to fetch the cheapest single check
  const fetchCheapestSingleCheck = async () => {
    // Prevent concurrent fetches
    if (loading) return;

    // Check if cached data is still valid
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) {
      console.log("Using cached data");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construct API URL and parameters
      const tokensUrl = `https://api.reservoir.tools/tokens/v6`;
      const params = new URLSearchParams({
        collection: CHECKS_CONTRACT_ADDRESS,
        limit: '100',
        sortBy: 'floorAskPrice',
        sortDirection: 'asc',
      });
      params.append('attributes[Checks]', '1');

      console.log("Fetching from URL:", `${tokensUrl}?${params}`);

      // Fetch data from Reservoir API
      const tokensResponse = await fetch(`${tokensUrl}?${params}`, {
        headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
      });
      const tokensData = await tokensResponse.json();

      console.log("API Response:", tokensData);

      if (tokensData.tokens && Array.isArray(tokensData.tokens)) {
        // Filter and map the tokens to get listed single checks
        const listedChecks = tokensData.tokens
          .filter((token: any) => token.market?.floorAsk?.price?.amount?.native)
          .map((token: any) => ({
            tokenId: token.token?.tokenId || 'Unknown',
            name: token.token?.name || 'Unnamed',
            image: token.token?.image || '',
            floorAskPrice: token.market.floorAsk.price.amount.native,
          }));

        if (listedChecks.length > 0) {
          // Set the cheapest check (first one due to sorting)
          setCheapestSingleCheck(listedChecks[0]);
          setLastFetchTime(now); // Update last fetch time for caching
        } else {
          setError("No listed single checks found");
        }
      } else {
        setError("Unexpected data structure received from API");
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and set up interval for periodic fetches
  useEffect(() => {
    fetchCheapestSingleCheck();
    const intervalId = setInterval(fetchCheapestSingleCheck, CACHE_DURATION);
    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, []);

  // Render the component
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cheapest Single Check</CardTitle>
        <CardDescription>Cost of the cheapest single check in the market</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {cheapestSingleCheck && (
          <div className="border p-4 rounded-lg">
            <p><strong>Token ID:</strong> {cheapestSingleCheck.tokenId}</p>
            <p><strong>Name:</strong> {cheapestSingleCheck.name}</p>
            <p><strong>Price:</strong> {cheapestSingleCheck.floorAskPrice.toFixed(2)} ETH</p>
            {cheapestSingleCheck.image && 
              <img src={cheapestSingleCheck.image} alt={cheapestSingleCheck.name} className="w-32 h-32 object-cover mt-2" />
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheapestCheck;