import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Global cache to persist across warm invocations
const cache = new Map(); // coinId -> { price, change24h, timestamp }
const CACHE_DURATION = 30000; // 30 seconds

// Static symbol map (could be expanded or moved to DB if needed)
const symbolMap = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'SHIB': 'shiba-inu',
    'LTC': 'litecoin',
    'AVAX': 'avalanche-2',
    'TRX': 'tron',
    'LINK': 'chainlink',
    'ATOM': 'cosmos',
    'XLM': 'stellar',
    'UNI': 'uniswap',
    'XMR': 'monero',
    'ETC': 'ethereum-classic',
    'FIL': 'filecoin',
    'HBAR': 'hedera-hashgraph',
    'APT': 'aptos',
    'VET': 'vechain',
    'QNT': 'quant-network',
    'NEAR': 'near',
    'ALGO': 'algorand',
    'AAVE': 'aave',
    'GRT': 'the-graph',
    'FTM': 'fantom',
    'EOS': 'eos',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'THETA': 'theta-token',
    'AXS': 'axie-infinity',
    'XTZ': 'tezos',
    'PNIC': 'pixel-nuts-creative-coin',
    'MIRX': 'mirx-coin'
};

function getHardcodedPrice(coinId) {
    const fallbacks = {
        'pixel-nuts-creative-coin': { price: 0.0069, change24h: 0 },
        'mirx-coin': { price: 1.23, change24h: 0 }
    };
    return fallbacks[coinId.toLowerCase()] || { price: 0, change24h: 0 };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // const user = await base44.auth.me().catch(() => null);

        const { symbols } = await req.json(); // Expect ['BTC', 'ETH']
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
             return Response.json({ error: "No symbols provided" }, { status: 400 });
        }

        const validSymbols = symbols.filter(s => typeof s === 'string');
        if (validSymbols.length === 0) {
             return Response.json({ prices: {} });
        }

        const results = {};
        const coinsToFetch = [];
        const symbolToIdMap = {};

        // 1. Resolve IDs and Check Cache
        const now = Date.now();
        
        validSymbols.forEach(sym => {
            const upperSym = sym.toUpperCase();
            // Try map, or assume symbol is ID if not found (fallback support)
            const id = symbolMap[upperSym] || sym.toLowerCase(); 
            symbolToIdMap[upperSym] = id; // Store for mapping back response

            const cached = cache.get(id);
            if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                results[upperSym] = cached.data.price;
                // results[`${upperSym}_CHANGE`] = cached.data.change24h; // If needed later
            } else {
                if (!coinsToFetch.includes(id)) {
                    coinsToFetch.push(id);
                }
            }
        });

        // 2. Fetch Uncached
        if (coinsToFetch.length > 0) {
            // Check for custom/hardcoded tokens first to avoid API calls for them
            const realApiCoins = [];
            
            coinsToFetch.forEach(id => {
                if (['pixel-nuts-creative-coin', 'mirx-coin'].includes(id)) {
                    // Use hardcoded immediately
                    const fallback = getHardcodedPrice(id);
                    cache.set(id, { data: fallback, timestamp: now });
                } else {
                    realApiCoins.push(id);
                }
            });

            if (realApiCoins.length > 0) {
                try {
                    const response = await fetch(
                        `https://api.coingecko.com/api/v3/simple/price?ids=${realApiCoins.join(',')}&vs_currencies=usd&include_24hr_change=true`
                    );
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        realApiCoins.forEach(id => {
                            const price = data[id]?.usd;
                            const change24h = data[id]?.usd_24h_change;
                            
                            if (price !== undefined) {
                                const coinData = { price, change24h: change24h || 0 };
                                cache.set(id, { data: coinData, timestamp: now });
                            } else {
                                // ID not found in API, cache 0 to prevent spamming
                                cache.set(id, { data: { price: 0, change24h: 0 }, timestamp: now });
                            }
                        });
                    } else {
                        console.error('CoinGecko API error:', response.status);
                        // Do not cache failures, allows retry next time
                    }
                } catch (error) {
                    console.error('Fetch error:', error);
                }
            }
        }

        // 3. Assemble Final Response using Cache (now updated)
        validSymbols.forEach(sym => {
            const upperSym = sym.toUpperCase();
            const id = symbolToIdMap[upperSym];
            const cached = cache.get(id);
            
            // Map back to symbol
            if (cached) {
                results[upperSym] = cached.data.price;
            } else if (results[upperSym] === undefined) {
                results[upperSym] = 0; // Default if fetch failed and no cache
            }
        });

        return Response.json({ prices: results });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});