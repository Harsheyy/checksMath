'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function Home() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (retryCount = 0) => {
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
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => fetchData(retryCount + 1), RETRY_DELAY);
      } else {
        setError('Failed to fetch data after multiple attempts. Please try again later.');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = () => {
    fetchData();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Analytics />
      <div className="pt-4 pb-w px-8 border-b">
        <Header />
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
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
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