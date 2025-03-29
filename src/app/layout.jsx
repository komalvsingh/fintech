import './globals.css';
import Navbar from '../components/Navbar';
// Fix the import - import the named export correctly
import { Web3Provider } from '../components/Web3Provider';

export const metadata = {
  title: 'DeFi Credit',
  description: 'A decentralized finance application for credit scoring and loans',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}