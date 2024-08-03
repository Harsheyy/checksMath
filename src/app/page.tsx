'use client';

import { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";
import Header from '@/components/Header';
import CheapestCheck from '@/components/cheapestCheck';
import SweepCalculator from '@/components/SweepCalculator';
import OptimalCheckCalculator from '@/components/OptimalCheckCalculator';
import Footer from '@/components/footer';
import { OptimizationResult } from '@/app/api/optimizeChecks/calculateOptimalCombination';

interface ApiData {
  optimalCombination: OptimizationResult;
  sweepPrices: any;
  cheapestSingleCheck: any;
  apiDuration: number;
  cacheTimestamp: string;
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/optimizeChecks');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setApiData(data);
        setLoading(false);
      } catch (e) {
        console.error('Error fetching data:', e);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Analytics />
      <div className="pt-4 pb-w px-8 border-b">
        <Header cacheTimestamp={apiData?.cacheTimestamp || null} />
      </div>
      <main className="flex-grow flex flex-col justify-center px-8 py-8 border-t bg-gray-100">
        <div className="w-full max-w-l mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-center text-xl">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-500 text-xl mb-4">Error: {error}</p>
            </div>
          ) : apiData ? (
            <div className="py-4 flex flex-col gap-4">
              <CheapestCheck data={apiData.cheapestSingleCheck} />
              <SweepCalculator data={apiData.sweepPrices} />
              <OptimalCheckCalculator optimalCombination={apiData.optimalCombination} />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}