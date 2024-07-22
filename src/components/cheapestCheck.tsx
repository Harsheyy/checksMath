import Image from 'next/image';

interface CheapestCheckProps {
  data: {
    tokenId: string;
    price: number;
    image: string;
    url: string;
    contractAddress: string;
    gridSize: number;
  } | null;
}

export default function CheapestCheck({ data }: CheapestCheckProps) {
  if (!data) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Cheapest Single Check</h2>
        <p className="text-gray-600 mb-4">Cost of the cheapest single check in the market</p>
        <p>No single checks available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
    <h2 className="text-2xl font-bold mb-2">Cheapest Single Check</h2>
    <p className="text-gray-600 mb-4">Cost of the cheapest single check in the market</p>
    <div className="flex items-start">
      <div className="w-24 h-24 mr-4">
        <Image 
          src={data.image} 
          alt={`Check ${data.tokenId}`} 
          width={100} 
          height={100} 
          className="rounded-lg"
        />
      </div>
      <div>
        <p className="font-semibold">Check #{data.tokenId}</p>
        <p className="text-xl font-bold mb-2">{data.price.toFixed(2)} ETH</p>
        <a 
          href={data.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded transition-colors"
        >
          View on Opensea
        </a>
      </div>
    </div>
  </div>
  );
}