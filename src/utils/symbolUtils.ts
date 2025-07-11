/**
 * Symbol Utilities
 * Functions for handling and correcting stock/crypto symbols
 */

// Extract asset symbol from user message with enhanced NLP (supports both stocks and crypto)
export function extractAssetSymbol(message: string): string | null {
    console.log(`🔍 Extracting symbol from: "${message}"`);
    
    // Enhanced company/project mapping with more variations
    const assetMap: Record<string, string> = {
        // Traditional stocks - with common variations
        'apple': 'AAPL',
        'apple inc': 'AAPL',
        'google': 'GOOGL', 
        'alphabet': 'GOOGL',
        'microsoft': 'MSFT',
        'msft': 'MSFT',
        'tesla': 'TSLA',
        'tesla motors': 'TSLA',
        'nvidia': 'NVDA',
        'amazon': 'AMZN',
        'meta': 'META',
        'meta platforms': 'META',
        'netflix': 'NFLX',
        'fb': 'META',
        'facebook': 'META',
        'paypal': 'PYPL',
        'adobe': 'ADBE',
        'salesforce': 'CRM',
        'oracle': 'ORCL',
        'intel': 'INTC',
        'amd': 'AMD',
        'advanced micro devices': 'AMD',
        'walmart': 'WMT',
        'johnson & johnson': 'JNJ',
        'jpmorgan': 'JPM',
        'visa': 'V',
        'mastercard': 'MA',
        'coca cola': 'KO',
        'pepsi': 'PEP',
        'disney': 'DIS',
        'mcdonalds': 'MCD',
        'nike': 'NKE',
        'starbucks': 'SBUX',
        
        // Crypto projects - with common variations  
        'bitcoin': 'BTC',
        'btc': 'BTC',
        'ethereum': 'ETH',
        'eth': 'ETH',
        'ether': 'ETH',
        'cardano': 'ADA',
        'ada': 'ADA',
        'solana': 'SOL',
        'sol': 'SOL',
        'polkadot': 'DOT',
        'dot': 'DOT',
        'chainlink': 'LINK',
        'link': 'LINK',
        'polygon': 'MATIC',
        'matic': 'MATIC',
        'avalanche': 'AVAX',
        'avax': 'AVAX',
        'uniswap': 'UNI',
        'uni': 'UNI',
        'cosmos': 'ATOM',
        'atom': 'ATOM',
        'ripple': 'XRP',
        'xrp': 'XRP',
        'litecoin': 'LTC',
        'ltc': 'LTC',
        'dogecoin': 'DOGE',
        'doge': 'DOGE',
        'shibainu': 'SHIB',
        'shiba inu': 'SHIB',
        'shib': 'SHIB',
        'binance coin': 'BNB',
        'bnb': 'BNB',
        'terra': 'LUNA',
        'luna': 'LUNA',
    };

    const lowerMessage = message.toLowerCase();
    console.log(`📝 Lowercase message: "${lowerMessage}"`);

    // 0. First try direct symbol detection (simple word matching)
    const commonSymbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'NFLX', 'BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK'];
    for (const symbol of commonSymbols) {
        if (message.toUpperCase().includes(symbol)) {
            console.log(`✅ Found direct symbol match: ${symbol}`);
            return symbol;
        }
    }

    // 1. First try exact symbol patterns (TSLA, BTC, etc.)
    const symbolPatterns = [
        /\$([A-Z]{1,5})\b/gi,           // $AAPL, $BTC
        /\b([A-Z]{2,5})\s+(?:stock|share|price|chart|analysis|quote)\b/gi,    // AAPL stock, BTC price
        /\babout\s+([A-Z]{2,5})\b/gi,    // about AAPL, about BTC
        /\b([A-Z]{2,5})\s+(?:crypto|coin|token|cryptocurrency)\b/gi,  // BTC crypto, ETH coin
        /\bhow.*?(?:is|are)\s+([A-Z]{2,5})\b/gi,       // how is AAPL, how's BTC
        /\bshould.*?(?:buy|sell|invest).*?([A-Z]{2,5})\b/gi,  // should I buy AAPL
        /\b([A-Z]{2,5})\s+(?:recommendation|advice|forecast|prediction)\b/gi,  // AAPL recommendation
        /\b(?:analyze|analysis)\s+([A-Z]{2,5})\b/gi,  // analyze TSLA
        /\b(?:what|how).*?([A-Z]{2,5})\s+(?:doing|performing)\b/gi,  // how is TSLA doing
        /\b([A-Z]{2,5})\s+(?:real-time|realtime|signals|patterns|candlestick|trends|live)\b/gi,  // TSLA real-time, AAPL signals
        /\b(?:show|display)\s+([A-Z]{2,5})\b/gi,  // show TSLA, display AAPL
        /\b([A-Z]{2,5})\s+(?:intraday|daily|chart|charts)\b/gi,  // TSLA intraday, AAPL chart
    ];

    for (let i = 0; i < symbolPatterns.length; i++) {
        const pattern = symbolPatterns[i];
        pattern.lastIndex = 0; // Reset regex
        console.log(`🔍 Testing pattern ${i + 1}: ${pattern.source} against: "${message}"`);
        const match = pattern.exec(message);
        if (match) {
            const symbol = match[1].toUpperCase();
            console.log(`✅ Found symbol pattern: ${symbol} using pattern: ${pattern.source}`);
            return symbol;
        } else {
            console.log(`❌ Pattern ${i + 1} did not match`);
        }
    }

    // 1.5. Simple fallback - look for any standalone 2-5 letter sequence that could be a symbol
    const simplePattern = /\b([A-Z]{2,5})\b/gi;
    simplePattern.lastIndex = 0;
    const simpleMatch = simplePattern.exec(message);
    if (simpleMatch) {
        const symbol = simpleMatch[1].toUpperCase();
        console.log(`✅ Found simple symbol pattern: ${symbol}`);
        return symbol;
    }

    // 2. Check for direct company/project name matches (sort by length for better matching)
    const sortedEntries = Object.entries(assetMap).sort((a, b) => b[0].length - a[0].length);
    
    for (const [name, symbol] of sortedEntries) {
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerMessage)) {
            console.log(`✅ Found direct match: "${name}" -> ${symbol}`);
            return symbol;
        }
    }

    // 3. Try natural language extraction patterns
    const nlpPatterns = [
        // "How is Solana performing today?" -> extract "Solana"
        /(?:how\s+is|how's)\s+([a-zA-Z]+)\s+(?:doing|performing)/gi,
        // "Tell me about Apple" -> extract "Apple"  
        /(?:tell\s+me\s+about|about)\s+([a-zA-Z\s]+?)(?:\s+(?:stock|crypto|coin|price)|$|\?)/gi,
        // "Should I buy Tesla" -> extract "Tesla"
        /(?:should\s+i|can\s+i)\s+(?:buy|invest\s+in|sell)\s+([a-zA-Z\s]+?)(?:\s+(?:stock|crypto|coin)|$|\?)/gi,
        // "What's the deal with Bitcoin" -> extract "Bitcoin"
        /(?:what's|whats)\s+(?:the\s+deal\s+with|happening\s+with|up\s+with)\s+([a-zA-Z\s]+?)(?:\s+(?:stock|crypto|coin)|$|\?)/gi,
        // "Analyze Google" -> extract "Google"
        /(?:analyze|analysis\s+of)\s+([a-zA-Z\s]+?)(?:\s+(?:stock|crypto|coin)|$|\?)/gi,
        // "Give me a Tesla analysis" -> extract "Tesla"
        /(?:give\s+me|show\s+me)\s+(?:a|an|the)\s+([a-zA-Z\s]+?)\s+(?:analysis|report|update)/gi,
    ];

    for (const pattern of nlpPatterns) {
        pattern.lastIndex = 0; // Reset regex
        const match = pattern.exec(lowerMessage);
        if (match) {
            const extractedName = match[1].trim().toLowerCase();
            console.log(`🎯 Extracted from NLP: "${extractedName}"`);
            
            // Check if extracted name matches any company/project
            for (const [name, symbol] of sortedEntries) {
                if (extractedName === name) {
                    console.log(`✅ NLP exact match: "${extractedName}" -> ${symbol}`);
                    return symbol;
                }
                // Check if extracted name contains the company name or vice versa
                if (extractedName.includes(name) && name.length > 2) {
                    console.log(`✅ NLP partial match: "${extractedName}" contains "${name}" -> ${symbol}`);
                    return symbol;
                }
            }
        }
    }

    console.log(`❌ No symbol found for: "${message}"`);
    return null;
}

// Fix common symbol mistakes
export function correctSymbol(symbol: string): string {
    const corrections: Record<string, string> = {
        'TESLA': 'TSLA',
        'APPLE': 'AAPL', 
        'GOOGLE': 'GOOGL',
        'MICROSOFT': 'MSFT',
        'AMAZON': 'AMZN',
        'FACEBOOK': 'META',
        'NETFLIX': 'NFLX',
        'NVIDIA': 'NVDA'
    };
    
    const upperSymbol = symbol.toUpperCase();
    return corrections[upperSymbol] || symbol;
}

// Determine if symbol is crypto or stock
export function isCryptoSymbol(symbol: string): boolean {
    const cryptoSymbols = [
        'BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'MATIC', 'AVAX', 
        'UNI', 'ATOM', 'XRP', 'LTC', 'BCH', 'ETC', 'XLM', 'DOGE',
        'SHIB', 'TRX', 'FTT', 'NEAR', 'ALGO', 'ICP', 'MANA', 'SAND',
        'APE', 'CRV', 'COMP', 'SUSHI', 'YFI', 'AAVE', 'MKR', 'SNX',
        'BNB', 'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'
    ];
    
    return cryptoSymbols.includes(symbol.toUpperCase()) || 
           symbol.toLowerCase().includes('usd') || 
           symbol.toLowerCase().includes('coin');
}

// Convert crypto symbols to CoinGecko IDs
export function getCoinGeckoId(symbol: string): string {
    const symbolMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'ADA': 'cardano',
        'SOL': 'solana',
        'DOT': 'polkadot',
        'LINK': 'chainlink',
        'MATIC': 'matic-network',
        'AVAX': 'avalanche-2',
        'UNI': 'uniswap',
        'ATOM': 'cosmos',
        'XRP': 'ripple',
        'LTC': 'litecoin',
        'BCH': 'bitcoin-cash',
        'ETC': 'ethereum-classic',
        'XLM': 'stellar',
        'DOGE': 'dogecoin',
        'SHIB': 'shiba-inu',
        'TRX': 'tron',
        'FTT': 'ftx-token',
        'NEAR': 'near',
        'ALGO': 'algorand',
        'ICP': 'internet-computer',
        'MANA': 'decentraland',
        'SAND': 'the-sandbox',
        'APE': 'apecoin',
        'CRV': 'curve-dao-token',
        'COMP': 'compound',
        'SUSHI': 'sushi',
        'YFI': 'yearn-finance',
        'AAVE': 'aave',
        'MKR': 'maker',
        'SNX': 'synthetix-network-token',
        'BNB': 'binancecoin',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'BUSD': 'binance-usd',
        'DAI': 'dai',
        'TUSD': 'true-usd'
    };

    const upperSymbol = symbol.toUpperCase();
    return symbolMap[upperSymbol] || symbol.toLowerCase();
} 