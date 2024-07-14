'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";

interface OptimalCombination {
  totalCost: number;
  combination: { gridSize: number; count: number; isEdition: boolean }[];
  groupedChecks: { [key: string]: { tokenId: string; floorAskPrice: number }[] };
  isCached: boolean;
  apiDuration: number;
  lastCacheTime: number;
  timeSinceLastCache: number | null;
}

const OptimalCheckCalculator: React.FC = () => {
  const [optimalCombination, setOptimalCombination] = useState<OptimalCombination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptimalCombination = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/optimizeChecks');
      const responseText = await response.text(); // Get the raw response text
      
      console.log('Raw API response:', responseText); // Log the raw response
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}: ${responseText}`);
      }
      
      let data: OptimalCombination;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Failed to parse API response: ${responseText}`);
      }

      setOptimalCombination(data);
    } catch (err) {
      console.error('Error fetching optimal combination:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimalCombination();
    const intervalId = setInterval(fetchOptimalCombination, 60 * 60 * 1000); // Refresh every hour
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Optimal Check Combination Calculator</CardTitle>
        <CardDescription>Most cost-efficient way to create a single check</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading...</p>}
        {error && (
          <div>
            <p>Error: {error}</p>
            <button onClick={fetchOptimalCombination}>Retry</button>
          </div>
        )}
        {optimalCombination && (
          <div className="border p-4 rounded-lg">
            <p><strong>Total Cost:</strong> {optimalCombination.totalCost.toFixed(4)} ETH</p>
            <p><strong>API Call Duration:</strong> {optimalCombination.apiDuration}ms</p>
            <p><strong>Cached Result:</strong> {optimalCombination.isCached ? 'Yes' : 'No'}</p>
            <p><strong>Last Cache Time:</strong> {new Date(optimalCombination.lastCacheTime).toLocaleString()}</p>
            {optimalCombination.timeSinceLastCache !== null && (
              <p><strong>Time Since Last Cache:</strong> {(optimalCombination.timeSinceLastCache / 1000 / 60).toFixed(2)} minutes</p>
            )}
            <p><strong>Optimal Combination:</strong></p>
            <ul>
              {optimalCombination.combination.map((item, index) => (
                <li key={index}>
                  {item.count}x {item.isEdition ? 'Editions' : `${item.gridSize}-grid check${item.count > 1 ? 's' : ''}`}
                </li>
              ))}
            </ul>
            <p><strong>Detailed Breakdown:</strong></p>
            {Object.entries(optimalCombination.groupedChecks).map(([tier, checks]) => (
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