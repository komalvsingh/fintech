import React from 'react';
import { useRouter } from 'next/navigation';
import useWeb3Auth from '../hooks/useWeb3Auth';

const CreditScoreGuide = () => {
  const router = useRouter();
  const { account } = useWeb3Auth();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Credit Score System Guide</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-800">How to establish your credit score:</h3>
          <ol className="list-decimal ml-5 mt-2 text-blue-700 space-y-2">
            <li>First, initialize your credit score (starts at 400 points)</li>
            <li>View your current credit score</li>
            <li>Improve your score by taking out and repaying loans</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Step 1: Initialize</h3>
            <p className="text-sm text-gray-600 mb-3">Set up your initial credit score of 400 points.</p>
            <button 
              onClick={() => router.push('/credit-score')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition"
            >
              Initialize Score
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Step 2: View Score</h3>
            <p className="text-sm text-gray-600 mb-3">Check your current credit score status.</p>
            <button 
              onClick={() => router.push('/credit-score')}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition"
            >
              View Credit Score
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Step 3: Improve</h3>
            <p className="text-sm text-gray-600 mb-3">Apply for loans and repay them to boost your score.</p>
            <button 
              onClick={() => router.push('/loan')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition"
            >
              Apply for Loan
            </button>
          </div>
        </div>

        <div className="mt-4 bg-gray-50 p-4 rounded-md">
          <h3 className="font-semibold text-gray-800 mb-2">Credit Score Ranges</h3>
          <div className="w-full h-6 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full mt-2 mb-1"></div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Poor<br/>300-579</span>
            <span>Fair<br/>580-669</span>
            <span>Good<br/>670-739</span>
            <span>Very Good<br/>740-799</span>
            <span>Excellent<br/>800-850</span>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400 mt-4">
          <h3 className="font-semibold text-yellow-800">How scores improve:</h3>
          <ul className="list-disc ml-5 mt-2 text-yellow-700">
            <li>Initial score when you initialize: 400 points</li>
            <li>Initial score when you repay your first loan: 500 points</li>
            <li>Each successful loan repayment: +20 points</li>
            <li>Maximum possible score: 850 points</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreditScoreGuide;