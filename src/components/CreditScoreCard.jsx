import React from "react";
import useBlockchainData from "../hooks/useBlockchainData";
import RequestCreditScore from "./RequestCreditScore";

const CreditScoreCard = ({ contractAddress }) => {
  const result = useBlockchainData(contractAddress, "getCreditScore");
  
  // Enhanced error detection for ethers.js error structure
  const hasNoCreditScore = result.error && (
    (typeof result.error === 'string' && result.error.includes("User does not have a credit score")) ||
    (result.error?.reason && result.error.reason.includes("User does not have a credit score")) ||
    (result.error?.revert?.args && result.error.revert.args[0] === "User does not have a credit score") ||
    (result.error?.data && result.error.data.includes("User does not have a credit score")) ||
    (result.error?.message && result.error.message.includes("User does not have a credit score")) ||
    (result.error?.code === "CALL_EXCEPTION" && JSON.stringify(result.error).includes("User does not have a credit score"))
  );
  
  // Log the error structure to help debug
  React.useEffect(() => {
    if (result.error && !hasNoCreditScore) {
      console.log("Credit Score Error Structure:", result.error);
    }
  }, [result.error, hasNoCreditScore]);
  
  return (
    <div className="bg-white p-4 rounded shadow">
      {result.loading && <p>Loading...</p>}
      
      {hasNoCreditScore ? (
        <div>
          <h3 className="text-xl font-semibold mb-2">Credit Score Not Available</h3>
          <p className="text-md mb-3">You don't have a credit score yet. Request a credit score assessment to establish your credit history.</p>
          <RequestCreditScore 
            contractAddress={contractAddress} 
            onSuccess={() => window.location.reload()} 
          />
        </div>
      ) : result.error ? (
        <div className="text-red-500">
          <p className="font-semibold">Error retrieving credit score:</p>
          <p>{typeof result.error === 'string' 
            ? result.error 
            : result.error?.reason || result.error?.message || 'Failed to fetch credit score'}</p>
        </div>
      ) : !result.loading && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Your Credit Score</h3>
          <p className="text-3xl font-bold">{result.data?.toString() || "No data"}</p>
        </div>
      )}
    </div>
  );
};

export default CreditScoreCard;