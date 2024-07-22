import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ClientOnlyCheck = dynamic(() => import('./svg/index'), {
  ssr: false,
});

interface HeaderProps {
  onRefresh: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLastUpdateTime = async () => {
    try {
      const response = await fetch('/api/getLastUpdateTime');
      if (!response.ok) {
        throw new Error('Failed to fetch last update time');
      }
      const data = await response.json();
      if (data.lastUpdateTime) {
        setLastFetchTime(new Date(data.lastUpdateTime));
      }
    } catch (error) {
      console.error('Error fetching last update time:', error);
    }
  };

  useEffect(() => {
    fetchLastUpdateTime();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
      await fetchLastUpdateTime();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeSinceLastFetch = () => {
    if (!lastFetchTime) return 'Never';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastFetchTime.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <header className="w-full py-4 flex justify-between items-start">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ClientOnlyCheck />
          <h1 className="text-black text-xl font-space-grotesk">Single Check Calculator</h1>
        </div>
        <h4 className="text-neutral-500 text-sm font-inter">
          Find the cheapest way to acquire a single check.
        </h4>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">Last data update:</p>
        <p className="text-md font-semibold">{getTimeSinceLastFetch()}</p>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1 text-sm text-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded transition-colors"
        >
          {isLoading ? 'Updating...' : 'Update Now'}
        </button>
      </div>
    </header>
  );
};

export default Header;