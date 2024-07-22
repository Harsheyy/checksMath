import dynamic from 'next/dynamic';

const ClientOnlyCheck = dynamic(() => import('./svg/index'), {
  ssr: false,
});

const Header: React.FC = () => {
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
    </header>
  );
};

export default Header;