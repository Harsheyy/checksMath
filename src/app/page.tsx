'use client';

import { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";
import Header from '@/components/Header';
import CheapestCheck from '@/components/cheapestCheck';
import SweepCalculator from '@/components/SweepCalculator';
import OptimalCheckCalculator from '@/components/OptimalCheckCalculator';
import Footer from '@/components/footer';

import { CheckToken, fetchAndCacheChecks } from '@/app/api/optimizeChecks/fetchAndCacheChecks';

interface ApiData {
  optimalCombination: any;
  sweepPrices: any;
  cheapestSingleCheck: any;
  apiDuration: number;
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [allChecks, setAllChecks] = useState<CheckToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checksError, setChecksError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setChecksError(null);
    try {
      const response = await fetch('/api/optimizeChecks');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setApiData(data);

      // Fetch all checks
      const checks = await fetchAndCacheChecks();
      if (checks.length === 0) {
        console.warn('No checks were fetched');
        setChecksError('No checks available. Please try again later.');
      } else {
        setAllChecks(checks);
      }
    } catch (err) {
      console.error('Error in fetchData:', err);
      if (err instanceof Error) {
        if (err.message.includes('checks')) {
          setChecksError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Analytics />
      <div className="pt-4 pb-w px-8 border-b">
        <Header onRefresh={fetchData} />
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
              <OptimalCheckCalculator data={apiData.optimalCombination} />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}