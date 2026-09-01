'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Video, ArrowLeft, Sparkles, Copy, Download, Loader2, Star, ShoppingBag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  images: string[];
  seller: string;
  sellerLocation: string;
  soldCount: number;
  shopRating: string;
  stock: number;
  tags: string[];
  saleProps: { name: string; values: string[] }[];
}

function formatSoldCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M+ sold`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K+ sold`;
  if (count > 0) return `${count} sold`;
  return '';
}

export default function AppPage() {
  const [url, setUrl] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'scraping' | 'generating' | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [streamingScript, setStreamingScript] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const scriptRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const handleScriptScroll = useCallback(() => {
    if (!scriptRef.current) return;
    const el = scriptRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    shouldAutoScroll.current = isNearBottom;
  }, []);

  useEffect(() => {
    if (isStreaming && shouldAutoScroll.current && scriptRef.current) {
      scriptRef.current.scrollTop = scriptRef.current.scrollHeight;
    }
  }, [streamingScript, isStreaming]);

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast.error('Please enter a TikTok Shop product URL');
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      toast.error('App configuration error');
      return;
    }

    setLoading(true);
    setLoadingStep('scraping');
    setProduct(null);
    setStreamingScript('');
    setIsStreaming(false);
    setIsComplete(false);
    shouldAutoScroll.current = true;

    try {
      const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/scrape-product`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!scrapeResponse.ok) {
        const error = await scrapeResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to scrape product');
      }

      const scrapeData = await scrapeResponse.json();
      if (!scrapeData.success || !scrapeData.product) {
        throw new Error('Product not found');
      }

      const scrapedProduct: Product = scrapeData.product;
      setProduct(scrapedProduct);
      setLoadingStep('generating');
      setIsStreaming(true);

      const generateResponse = await fetch(`${supabaseUrl}/functions/v1/generate-script`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product: scrapedProduct, customInstructions: customInstructions.trim() || undefined }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        let errorMsg = 'Failed to generate script';
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.details || parsed.error || errorMsg;
        } catch {
          // use default
        }
        throw new Error(errorMsg);
      }

      const reader = generateResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let streamBuffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              accumulated += event.delta.text;
              setStreamingScript(accumulated);
            }
          } catch {
            // skip malformed events
          }
        }
      }

      if (!accumulated) {
        throw new Error('AI returned no script content');
      }

      setIsComplete(true);
      setIsStreaming(false);
      toast.success('Script generated successfully!');
    } catch (error) {
      setIsStreaming(false);
      toast.error(error instanceof Error ? error.message : 'Failed to generate script');
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const handleCopy = () => {
    if (streamingScript) {
      navigator.clipboard.writeText(streamingScript);
      toast.success('Script copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (streamingScript && product) {
      const blob = new Blob([streamingScript], { type: 'text/plain' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `tiktok-script-${product.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      toast.success('Script downloaded!');
    }
  };

  const handleReset = () => {
    setProduct(null);
    setStreamingScript('');
    setIsStreaming(false);
    setIsComplete(false);
    setUrl('');
    setCustomInstructions('');
  };

  const showProductSection = product !== null;
  const showScriptSection = isStreaming || streamingScript.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
              <Video className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-white">SellFlow</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Generate Your Script
          </h1>
          <p className="text-lg text-gray-400">
            Paste a TikTok Shop product link to create your viral selling script
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                TikTok Shop Product URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://www.tiktok.com/shop/pdp/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2">
                Custom Instructions
                <span className="text-gray-500 font-normal ml-1">(optional)</span>
              </label>
              <Textarea
                id="instructions"
                placeholder='e.g. "Make the script personalized for Christmas" or "This is for a no-face live" or "Target audience is busy moms"'
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500 min-h-[80px] resize-y"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {loadingStep === 'scraping'
                    ? 'Scraping Product Details...'
                    : 'Generating Script with AI...'}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Script
                </>
              )}
            </Button>
          </div>
        </div>

        {showProductSection && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Product Summary</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  {product.images.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full md:w-48 h-48 object-cover rounded-lg border border-gray-700"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl font-bold text-red-500">{product.price}</span>
                    {product.originalPrice && product.originalPrice !== product.price && (
                      <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                    )}
                    {product.discount && (
                      <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs font-semibold rounded">
                        {product.discount} OFF
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-4 w-4" />
                      {product.seller}
                    </span>
                    {product.shopRating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {product.shopRating}
                      </span>
                    )}
                    {product.soldCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {formatSoldCount(product.soldCount)}
                      </span>
                    )}
                    {product.stock > 0 && (
                      <span className={`text-xs font-medium ${product.stock < 100 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {product.stock} in stock
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-gray-400 mb-4 line-clamp-3">{product.description}</p>
                  )}

                  {product.saleProps.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.saleProps.map((prop) => (
                        <div key={prop.name} className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{prop.name}:</span>
                          {prop.values.map((val) => (
                            <span
                              key={val}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showScriptSection && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">Your TikTok Live Script</h2>
                    {isStreaming && (
                      <span className="flex items-center gap-2 text-sm text-red-400">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        Writing...
                      </span>
                    )}
                  </div>
                  {isComplete && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
                <div
                  ref={scriptRef}
                  onScroll={handleScriptScroll}
                  className="bg-gray-900 border border-gray-700 rounded-md p-4 min-h-[400px] max-h-[600px] overflow-y-auto font-mono text-sm text-white whitespace-pre-wrap leading-relaxed"
                >
                  {streamingScript}
                  {isStreaming && (
                    <span className="inline-block w-0.5 h-4 bg-red-500 ml-0.5 animate-pulse align-text-bottom" />
                  )}
                </div>
              </div>
            )}

            {isComplete && (
              <div className="text-center animate-in fade-in duration-300">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-700 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Generate Another Script
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
