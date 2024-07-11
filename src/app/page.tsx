'use client';

import Image from "next/image";
import dynamic from 'next/dynamic'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import CheapestCheck from '@/components/cheapestCheck';
import SweepCalculator from '@/components/SweepCalculator';
import OptimalCheckCalculator from '@/components/OptimalCheckCalculator';

const ClientOnlyCheck = dynamic(() => import('../components/svg/index'), {
  ssr: false,
})

export default function Home() {
  return (
    <main>
      <div className="py-16 px-16 w-screen bg-white">
        <div className="py-4 flex-col justify-start items-start gap-2 inline-flex">
          <div className="flex-row justify-start items-center gap-2 inline-flex">
            <ClientOnlyCheck/>
            <h1 className="text-black text-xl font-space-grotesk">Single Check Calculator</h1>
          </div>
          <h4 className="text-neutral-500 text-l font-inter">Find the cheapest way to acquire a single check.</h4>        
        </div>
        <hr />
        <div className="py-4 flex-col justify-start items-start">
        <CheapestCheck />
        <SweepCalculator />
        <OptimalCheckCalculator />
        </div>
      </div>
    </main>
  )
}