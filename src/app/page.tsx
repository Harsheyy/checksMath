'use client';

import { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";
import Header from '@/components/Header';
import CheapestCheck from '@/components/cheapestCheck';
import SweepCalculator from '@/components/SweepCalculator';
import OptimalCheckCalculator from '@/components/OptimalCheckCalculator';
import Footer from '@/components/footer';

import { CheckToken } from '@/app/api/optimizeChecks/fetchChecks';

interface ApiData {
  optimalCombination: any;
  sweepPrices: any;
  cheapestSingleCheck: any;
  apiDuration: number;
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/optimizeChecks');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setApiData(data);
      } catch (e) {
        console.error('Error fetching data:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
            <p className="text-center text-red-500 text-xl">Error: {error}</p>
          ) : apiData ? (
            <div className="py-4 flex flex-col gap-4">
              <CheapestCheck data={apiData.cheapestSingleCheck} />
              <SweepCalculator data={apiData.sweepPrices} />
              <OptimalCheckCalculator checks={apiData.optimalCombination} />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}