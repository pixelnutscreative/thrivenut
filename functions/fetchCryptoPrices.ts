import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // Auth check
        const user = await base44.auth.me().catch(() => null);

        const { symbols } = await req.json(); // Expect array of symbols like ['BTC', 'ETH']
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
             return Response.json({ error: "No symbols provided" }, { status: 400 });
        }

        const validSymbols = symbols.filter(s => typeof s === 'string');
        if (validSymbols.length === 0) {
             return Response.json({ prices: {} });
        }

        // Fetch Custom Coins from DB first
        const customCoins = await base44.asServiceRole.entities.CustomCoin.list();
        const customPriceMap = {};
        customCoins.forEach(c => {
            if (c.symbol && c.current_price !== undefined) {
                customPriceMap[c.symbol.toUpperCase()] = c.current_price;
            }
        });

        // Static map for common coins to save API calls
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
            'PNIC': 'pixel-nuts-creative-coin', // Keep custom if needed, or remove if not real
            'MIRX': 'mirx-coin',
            'USDT': 'tether',
            'USDC': 'usd-coin',
            'BNB': 'binancecoin',
            'DAI': 'dai',
            'STETH': 'staked-ether',
            'OKB': 'okb',
            'LEO': 'leo-token',
            'TON': 'the-open-network',
            'LDO': 'lido-dao',
            'CRO': 'crypto-com-chain',
            'ICP': 'internet-computer',
            'BCH': 'bitcoin-cash'
        };

        const resolvedIds = {};
        const symbolsToSearch = [];

        // 1. Resolve from map (checking Custom Coins first)
        validSymbols.forEach(sym => {
            const upper = sym.toUpperCase();
            if (customPriceMap[upper] !== undefined) {
                // It's a custom coin, we have the price directly
                // We'll handle this when constructing the response
            } else if (symbolMap[upper]) {
                resolvedIds[sym] = symbolMap[upper];
            } else {
                symbolsToSearch.push(sym);
            }
        });

        // 2. Search for missing symbols (Rate limit warning: this is slow and limited)
        // We limit to 5 searches per request to avoid timeout/rate-limit
        const searchLimit = 5;
        const searchPromises = symbolsToSearch.slice(0, searchLimit).map(async (sym) => {
            try {
                // Add delay to prevent hitting rate limit instantly
                await new Promise(r => setTimeout(r, 200)); 
                const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${sym}`);
                if (!res.ok) return;
                const data = await res.json();
                // Find exact symbol match, prioritize by market cap rank
                const coin = data.coins?.find(c => c.symbol.toUpperCase() === sym.toUpperCase());
                if (coin) {
                    resolvedIds[sym] = coin.id;
                }
            } catch (e) {
                console.error(`Failed to search ${sym}:`, e);
            }
        });

        if (symbolsToSearch.length > 0) {
            await Promise.all(searchPromises);
        }

        // 3. Fetch prices
        const allIds = Object.values(resolvedIds);
        let prices = {};

        // Add custom coin prices
        Object.keys(customPriceMap).forEach(sym => {
             // Find original symbol casing from request if possible, or use uppercase
             const originalSym = validSymbols.find(s => s.toUpperCase() === sym) || sym;
             prices[originalSym] = customPriceMap[sym];
        });

        if (allIds.length > 0) {
            const idsParam = allIds.join(',');
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`);
            const data = await response.json();

            // Map back to symbols
            Object.keys(resolvedIds).forEach(sym => {
                const id = resolvedIds[sym];
                if (data[id]) {
                    prices[sym] = data[id].usd;
                }
            });
        }

        // Hardcoded fallbacks for specific coins if not found
        if (!prices['MIRX'] && validSymbols.some(s => s.toUpperCase() === 'MIRX')) {
            prices['MIRX'] = 1.0;
        }
        if (!prices['PNIC'] && validSymbols.some(s => s.toUpperCase() === 'PNIC')) {
            // Check if PNIC was in custom coins, if not default to something or leave as is
            // Assuming PNIC usually managed via custom coins, but if missing:
            if (!customPriceMap['PNIC']) {
                prices['PNIC'] = 0.0045; // Default fallback if needed
            }
        }

        return Response.json({ prices });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});