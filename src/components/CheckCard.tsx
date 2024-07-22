import React from 'react';
import Image from 'next/image';
import { CheckToken } from '@/app/api/optimizeChecks/fetchAndCacheChecks'; // Adjust the import path as necessary

interface CheckCardProps {
  check: CheckToken;
}

const CheckCard: React.FC<CheckCardProps> = ({ check }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="relative h-48 w-full">
        <Image
          src={check.image}
          alt={check.name}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{check.name}</h3>
        <p className="text-gray-600 mb-2">ID: {check.tokenId}</p>
        <p className="text-gray-800 font-bold">{check.floorAskPrice.toFixed(4)} ETH</p>
        <p className="text-sm text-gray-600">Grid Size: {check.gridSize}</p>
      </div>
    </div>
  );
};

interface CheckListProps {
    checks: CheckToken[];
  }
  
  const CheckList: React.FC<CheckListProps> = ({ checks }) => {
    console.log('CheckList received', checks.length, 'checks');
    
    if (!checks || checks.length === 0) {
      return <p>No checks available. Total checks: {checks.length}</p>;
    }
  
    const checksByGridSize = checks.reduce((acc, check) => {
      acc[check.gridSize] = (acc[check.gridSize] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  
    console.log('Checks by grid size:', checksByGridSize);
  
    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">All Checks</h2>
        <p className="mb-4">Total checks: {checks.length}</p>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Checks by Grid Size:</h3>
          <ul>
            {Object.entries(checksByGridSize).map(([size, count]) => (
              <li key={size}>Grid {size}: {count} checks</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {checks.map((check) => (
            <CheckCard key={check.tokenId} check={check} />
          ))}
        </div>
      </div>
    );
  };
  
  export { CheckCard, CheckList };