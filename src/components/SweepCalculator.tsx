'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { canMakeSingleCheck, optimizeChecks } from './checkMath';

const RESERVOIR_API_KEY = process.env.NEXT_PUBLIC_RESERVOIR_API_KEY;
const CHECKS_CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
const EDITIONS_CONTRACT_ADDRESS = '0x34eebee6942d8def3c125458d1a86e0a897fd6f9';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CheckToken {
  tokenId: string;
  name: string;
  gridSize: number;
  floorAskPrice: number;
}

const SweepCalculator: React.FC = () => {
  const [checksSweepCost, setChecksSweepCost] = useState<number | null>(null);
  const [editionsSweepCost, setEditionsSweepCost] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchChecks = async (contractAddress: string) => {
    const tokensUrl = `https://api.reservoir.tools/tokens/v6`;
    const params = new URLSearchParams({
      collection: contractAddress,
      limit: '100',
      sortBy: 'floorAskPrice',
      sortDirection: 'asc',
    });

    console.log("Fetching from URL:", `${tokensUrl}?${params}`);

    const tokensResponse = await fetch(`${tokensUrl}?${params}`, {
      headers: { 'x-api-key': RESERVOIR_API_KEY || '' }
    });
    const tokensData = await tokensResponse.json();

    console.log("API Response:", tokensData);

    if (tokensData.tokens && Array.isArray(tokensData.tokens)) {
      return tokensData.tokens
        .filter((token: any) => token.market?.floorAsk?.price?.amount?.native)
        .map((token: any) => ({
          tokenId: token.token?.tokenId || 'Unknown',
          name: token.token?.name || 'Unnamed',
          gridSize: contractAddress === CHECKS_CONTRACT_ADDRESS ? (parseInt(token.token?.name.split(' ')[0]) || 80) : 80,
          floorAskPrice: token.market.floorAsk.price.amount.native,
        }));
    }
    return [];
  };

  const calculateSweepCost = (checks: CheckToken[]) => {
    let totalCost = 0;
    let totalChecks = 0;
    const selectedChecks = [];

    for (const check of checks) {
      if (totalChecks < 64) {
        selectedChecks.push({ gridSize: check.gridSize, count: 1 });
        totalChecks += 80 / check.gridSize;
        totalCost += check.floorAskPrice;
      } else {
        break;
      }
    }

    if (canMakeSingleCheck(selectedChecks)) {
      return totalCost;
    }
    return null;
  };

  const fetchSweepCosts = async () => {
    if (loading) return;

    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) {
      console.log("Using cached data");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const checksTokens = await fetchChecks(CHECKS_CONTRACT_ADDRESS);
      const editionsTokens = await fetchChecks(EDITIONS_CONTRACT_ADDRESS);

      const checksCost = calculateSweepCost(checksTokens);
      setChecksSweepCost(checksCost);

      const editionsCost = calculateSweepCost(editionsTokens);
      setEditionsSweepCost(editionsCost);

      setLastFetchTime(now);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSweepCosts();
    const intervalId = setInterval(fetchSweepCosts, CACHE_DURATION);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sweep Calculator</CardTitle>
        <CardDescription>Cost to create a single check by sweeping the cheapest checks</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        <div className="flex justify-between">
          <div className="border p-4 rounded-lg w-1/2 mr-2">
            <h3 className="font-bold mb-2">Checks Contract</h3>
            {checksSweepCost !== null ? (
              <p><strong>Sweep Cost:</strong> {checksSweepCost.toFixed(4)} ETH</p>
            ) : (
              <p>Unable to calculate sweep cost</p>
            )}
          </div>
          <div className="border p-4 rounded-lg w-1/2 ml-2">
            <h3 className="font-bold mb-2">Editions Contract</h3>
            {editionsSweepCost !== null ? (
              <p><strong>Sweep Cost:</strong> {editionsSweepCost.toFixed(4)} ETH</p>
            ) : (
              <p>Unable to calculate sweep cost</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SweepCalculator;