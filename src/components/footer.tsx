import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ClientOnlyCheck = dynamic(() => import('./svg/index'), {
  ssr: false,
});

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t w-full">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ClientOnlyCheck />
            <span className="text-gray-600 font-medium">Check, don&apos;t trust</span>
          </div>
          <Link 
            href="https://twitter.com/0xharsheth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
          >
            Twitter
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;