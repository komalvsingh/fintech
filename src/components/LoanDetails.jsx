import React from 'react';

const LoanDetails = ({ loan }) => {
  if (!loan) {
    return <div className="p-4 text-center">No loan data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Loan Details</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600 text-sm">Amount</p>
          <p className="font-medium">{loan.amount} ETH</p>
        </div>
        
        <div>
          <p className="text-gray-600 text-sm">Duration</p>
          <p className="font-medium">{loan.duration || "30"} days</p>
        </div>
        
        <div>
          <p className="text-gray-600 text-sm">Status</p>
          <p className="font-medium">
            {loan.isPaid 
              ? 'Repaid' 
              : loan.isApproved 
                ? 'Approved' 
                : 'Pending'}
          </p>
        </div>
        
        <div>
          <p className="text-gray-600 text-sm">Repayment Due</p>
          <p className="font-medium">{loan.repaymentDue}</p>
        </div>
        
        <div className="col-span-2">
          <p className="text-gray-600 text-sm">Borrower</p>
          <p className="font-medium text-xs break-all">{loan.borrower}</p>
        </div>
        
        {loan.purpose && (
          <div className="col-span-2">
            <p className="text-gray-600 text-sm">Purpose</p>
            <p className="font-medium">{loan.purpose}</p>
          </div>
        )}
        
        {loan.collateral && (
          <div className="col-span-2">
            <p className="text-gray-600 text-sm">Collateral</p>
            <p className="font-medium">{loan.collateral}</p>
          </div>
        )}
        
        {loan.id && (
          <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
            <p className="text-gray-600 text-sm">Loan ID</p>
            <p className="font-mono text-xs break-all">{loan.id}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanDetails;