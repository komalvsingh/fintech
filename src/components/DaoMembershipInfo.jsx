"use client";
import React from 'react';
import { motion } from 'framer-motion';

const DaoMembershipInfo = ({ onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg shadow-blue-900/10 max-w-xl mx-4"
    >
      {/* Cross button to dismiss the overlay */}
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 text-gray-300 hover:text-white text-2xl"
      >
        &times;
      </button>
      <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
        Get Full DAO Access
      </h2>
      <p className="text-gray-300 mb-4">
        To experience the full permissioned system with all features enabled,
        you need to become a DAO member. As a member, you’ll enjoy full access to voting,
        exclusive tools, and more.
      </p>
      <p className="text-gray-300 mb-6">
        If you’re interested in a full system demonstration and DAO membership, please contact us.
      </p>
      <a 
        href="mailto:getdaomembership@gmail.com" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-blue-500/20"
        >
          Mail to : getdaomembership@gmail.com
        </motion.button>
      </a>
    </motion.div>
  );
};

export default DaoMembershipInfo;
