'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { OptimizationResult } from '../app/api/optimizeChecks/calculateOptimalCombination';

interface OptimalCheckCalculatorProps {
  optimalCombination: OptimizationResult | null;
}

const OptimalCheckCalculator: React.FC<OptimalCheckCalculatorProps> = ({ optimalCombination }) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (tier: string) => {
    setOpenAccordion(openAccordion === tier ? null : tier);
  };

  const getMarketplaceUrl = (tier: string, tokenId: string) => {
    const baseUrl = tier === 'Editions'
      ? 'https://opensea.io/assets/0x34eebee6942d8def3c125458d1a86e0a897fd6f9'
      : 'https://opensea.io/assets/0x036721e5a769cc48b3189efbb9cce4471e8a48b1';
    return `${baseUrl}/${tokenId}`;
  };

  if (!optimalCombination) return <p>No optimal combination available.</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full mx-auto">
      <h2 className="text-2xl font-bold mb-4">Optimal Check Combination</h2>
      <div className="border p-4 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
          <div className="flex flex-wrap justify-start md:space-x-8">
            {Object.entries(optimalCombination.groupedChecks).map(([tier, checks], index) => (
              checks.length > 0 && (
                <div key={index} className="text-center mr-4 md:mr-0">
                  <p className="font-semibold">{tier}</p>
                  <p>{checks.length}</p>
                </div>
              )
            ))}
          </div>
          <div className="text-right w-full md:w-auto">
            <p className="font-semibold">Total cost:</p>
            <p className="text-2xl font-bold">{optimalCombination.totalCost.toFixed(2)} ETH</p>
          </div>
        </div>
        <p className="font-semibold mb-2">Breakdown:</p>
        {Object.entries(optimalCombination.groupedChecks).map(([tier, checks]) => (
          checks.length > 0 && (
            <div key={tier} className="mb-4">
              <button
                className="w-full text-left p-4 bg-gray-100 rounded flex justify-between items-center"
                onClick={() => toggleAccordion(tier)}
              >
                <span>{tier}</span>
                <span>{openAccordion === tier ? '▲' : '▼'}</span>
              </button>
              {openAccordion === tier && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-4 mt-2">
                  {checks.map(check => (
                    <a
                      key={check.tokenId}
                      href={getMarketplaceUrl(tier, check.tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border rounded p-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                      <Image
                        src={check.image}
                        alt={`Check ${check.tokenId}`}
                        width={100}
                        height={100}
                        className="w-full h-auto object-cover rounded"
                        loading="lazy"
                      />
                      <p className="text-sm mt-2">Check {check.tokenId}</p>
                      <p className="text-sm font-semibold">{check.floorAskPrice.toFixed(2)} ETH</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default OptimalCheckCalculator;