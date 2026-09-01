import Link from 'next/link';
import { Video, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-white">SellFlow</span>
            </div>
            <Link href="/app">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6">
            Turn Products Into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
              Viral TikTok Scripts
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            Paste any TikTok Shop product link and instantly generate high-energy,
            conversion-focused live selling scripts that engage your audience.
          </p>
          <Link href="/app">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6">
              Create Your Script Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-red-500 transition-colors">
            <div className="bg-red-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
            <p className="text-gray-400">
              Get your complete selling script in seconds. No more staring at blank pages
              wondering what to say during your live stream.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-red-500 transition-colors">
            <div className="bg-red-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">High Converting</h3>
            <p className="text-gray-400">
              Scripts designed to create urgency, highlight benefits, and drive sales.
              Every word is crafted to convert viewers into buyers.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-red-500 transition-colors">
            <div className="bg-red-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">TikTok Optimized</h3>
            <p className="text-gray-400">
              Specifically crafted for TikTok Live audiences. Short, punchy, and
              attention-grabbing content that keeps viewers engaged.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-800/30 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Paste Link</h3>
              <p className="text-gray-400">
                Copy your TikTok Shop product URL and paste it in the app
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Generate Script</h3>
              <p className="text-gray-400">
                Our AI analyzes the product and creates a compelling script
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Go Live</h3>
              <p className="text-gray-400">
                Copy or download your script and start selling immediately
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 SellFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
