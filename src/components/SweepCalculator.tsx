import React from 'react';
import dynamic from 'next/dynamic';

const ClientOnlyCheck = dynamic(() => import('./svg/index'), {
  ssr: false,
});

interface SweepPrices {
  editionsSweepPrice: number;
  checksSweepPrice: number;
}

interface SweepCalculatorProps {
  data: SweepPrices;
}

const SweepCalculator: React.FC<SweepCalculatorProps> = ({ data }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full">
      <h2 className="text-2xl font-bold mb-6 text-left">Sweep Calculator</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <SweepSection 
          title="Editions" 
          description="Sweep all Checks Editions"
          totalCost={data.editionsSweepPrice}
          iconProps={{ color: 'white', stroke: 'black' }}
        />
        <SweepSection 
          title="Checks" 
          description="Sweep all Original Checks"
          totalCost={data.checksSweepPrice}
          iconProps={{ color: 'green', stroke: 'none' }}
        />
      </div>
    </div>
  );
};

interface SweepSectionProps {
  title: string;
  description: string;
  totalCost: number;
  iconProps: { color: string; stroke: string };
}

const SweepSection: React.FC<SweepSectionProps> = ({ title, description, totalCost, iconProps }) => {
  const formatPrice = (price: number | undefined) => 
    price !== undefined ? price.toFixed(2) : 'N/A';

  return (
    <div className="border rounded-lg shadow-inner p-6 flex flex-row justify-between w-full items-start">
      <div className="flex items-center gap-4">
        <ClientOnlyCheck color={iconProps.color} stroke={iconProps.stroke}/>
        <div className="text-left">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="flex flex-col content-evenly mt-4 md:mt-0">
        <p className="font-bold text-lg">{formatPrice(totalCost)} ETH</p>
      </div>
    </div>
  );
};

export default SweepCalculator;