'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, BarChart, Lock, Globe, Zap, Shield, 
  Check, Layers, TrendingUp, ArrowRight
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Home() {
  const [activeMode, setActiveMode] = useState(null);

  const features = [
    {
      icon: Wallet,
      title: "Web3 Authentication",
      description: "Secure, decentralized login using Ethereum wallets"
    },
    {
      icon: BarChart,
      title: "AI-Driven Credit Scoring",
      description: "Comprehensive credit assessment using on-chain and off-chain data"
    },
    {
      icon: Lock,
      title: "Blockchain Security",
      description: "Immutable identity and transparent financial transactions"
    }
  ];

  const whyChooseUs = [
    {
      icon: Check,
      title: "Transparent",
      description: "Full visibility into your financial transactions"
    },
    {
      icon: Layers,
      title: "Multi-Chain",
      description: "Support for multiple blockchain networks"
    },
    {
      icon: TrendingUp,
      title: "Optimized Returns",
      description: "Advanced algorithms for maximum financial efficiency"
    }
  ];

  const socialLinks = [
    { name: "X", link: "#" },
    { name: "LinkedIn", link: "#" },
    { name: "GitHub", link: "#" },
    { name: "Social", link: "#" }
  ];

  return (
    <div className="bg-[#0A0E1E] text-white min-h-screen">
      <Navbar/>
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Hero Section with Added Image */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-20 -right-20 opacity-20"
          >
            {/* <img 
              src="https://media.istockphoto.com/id/1389477884/photo/bright-coloured-particles-on-3d-graph.jpg?s=612x612&w=0&k=20&c=wUchHsrib3Kjjt6Ps_GS2TxdpEZPStQKcukb853HN08=" 
              alt="FinanceAI Background" 
              className="w-96 h-72 object-cover rounded-3xl"
            /> */}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Empowering Your Financial Freedom
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto"
          >
            FinanceAI revolutionizes wealth management through cutting-edge blockchain technology, AI-driven insights, and decentralized financial solutions.
          </motion.p>
          
          {/* Mode Selection */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-[#141B2E] rounded-2xl p-8 max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-2xl font-semibold text-purple-400 mb-6">
              Choose Your Financial Journey
            </h2>
            <div className="flex justify-center space-x-6">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveMode('wizard')}
                className={`py-4 px-8 rounded-lg text-lg transition-all 
                  ${activeMode === 'wizard' 
                    ? 'bg-purple-700 text-white' 
                    : 'bg-[#1E2642] text-gray-300 hover:bg-purple-600'
                  }`}
              >
                Wizard Mode
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveMode('expert')}
                className={`py-4 px-8 rounded-lg text-lg transition-all 
                  ${activeMode === 'expert' 
                    ? 'bg-pink-700 text-white' 
                    : 'bg-[#1E2642] text-gray-300 hover:bg-pink-600'
                  }`}
              >
                Expert Mode
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Key Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            Our Core Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="bg-[#141B2E] p-6 rounded-2xl text-center hover:bg-[#1E2642] transition-all"
              >
                <div className="mb-4 flex justify-center">
                  <feature.icon className="w-12 h-12 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-purple-400 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Platform Preview Section */}
        <div className="max-w-6xl mx-auto mb-16 flex items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 pr-12"
          >
            <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              Platform Preview
            </h2>
            <p className="text-gray-300 mb-6">
              Experience the future of financial management with our intuitive, AI-powered dashboard that provides real-time insights and seamless blockchain integration.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center"
            >
              Explore Dashboard <ArrowRight className="ml-2" />
            </motion.button>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2"
          >
            <img 
              src="https://png.pngtree.com/thumb_back/fh260/background/20250305/pngtree-financial-planning-with-interest-rates-dividends-and-inflation-control-image_17056689.jpg" 
              alt="FinanceAI Dashboard" 
              className="rounded-2xl shadow-2xl"
            />
          </motion.div>
        </div>

        {/* Why Choose Us Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            Why Choose FinanceAI
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="bg-[#141B2E] p-6 rounded-2xl text-center hover:bg-[#1E2642] transition-all"
              >
                <div className="mb-4 flex justify-center">
                  <item.icon className="w-12 h-12 text-pink-500" />
                </div>
                <h3 className="text-xl font-semibold text-pink-400 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-300">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center max-w-3xl mx-auto bg-[#141B2E] rounded-2xl p-12"
        >
          <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join FinanceAI today and unlock the power of decentralized, AI-driven financial management.
          </p>
          <div className="flex justify-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all"
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-[#141B2E] py-12">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-purple-400">FinanceAI</h3>
            <p className="text-gray-300 text-sm">
              Revolutionizing financial management through blockchain and AI technologies.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-pink-400">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Features', 'Dashboard', 'About', 'Contact'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-pink-400">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Disclaimer'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-pink-400">Connect</h4>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-300 hover:text-white bg-[#1E2642] px-3 py-1 rounded-full text-xs"
                >
                  {social.name}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center text-gray-400 mt-8 text-sm border-t border-gray-700 pt-4">
          © 2024 FinanceAI. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}