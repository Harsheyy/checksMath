'use client';

import React, { useState, useEffect } from 'react';
import { OptimizationResult } from '../app/api/optimizeChecks/calculateOptimalCombination';

const OptimalCheckCalculator: React.FC = () => {
  const [optimalCombination, setOptimalCombination] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/optimizeChecks')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setOptimalCombination(data.optimalCombination);
        setLoading(false);
      })
      .catch(e => {
        console.error('An error occurred while fetching the data: ', e);
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Optimal Check Combination</h2>
      {optimalCombination && (
        <div className="border p-4 rounded-lg">
          <p><strong>Total Cost:</strong> {optimalCombination.totalCost.toFixed(4)} ETH</p>
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
    </div>
  );
};

export default OptimalCheckCalculator;