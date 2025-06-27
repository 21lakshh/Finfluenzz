# 🔑 API Keys Setup for Finance Advisor

## Required API Keys

### 1. **Groq API Key** (Required)
- **Purpose**: Powers the Gen Z Finance Advisor AI
- **Get it from**: https://console.groq.com/
- **Environment Variable**: `VITE_GROQ_API_KEY`
- **Cost**: Free tier available

### 2. **Alpha Vantage API** (Primary Stock Data)
- **Purpose**: Real-time stock quotes, historical data, technical indicators
- **Get it from**: https://www.alphavantage.co/support/#api-key
- **Environment Variable**: `VITE_ALPHA_VANTAGE_API_KEY`
- **Free Tier**: 25 requests/day (perfect for testing)
- **Paid Plans**: Start at $49.99/month for 5,000 requests/day

### 3. **Finnhub API** (Alternative Stock Data)
- **Purpose**: Backup stock data provider
- **Get it from**: https://finnhub.io/
- **Environment Variable**: `VITE_FINNHUB_API_KEY`
- **Free Tier**: 60 calls/minute
- **Paid Plans**: Start at $5/month

## Setup Instructions

1. **Create `.env` file** in your project root:
```bash
# Copy and fill in your API keys
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
```

2. **Restart your development server** after adding the keys:
```bash
npm run dev
```

## Testing Without API Keys

The Finance Advisor will work with mock data if no API keys are provided:
- Mock stock prices for popular stocks (AAPL, GOOGL, TSLA, etc.)
- Simulated technical indicators
- Generated historical price charts
- All features work, just with fake data

## Features Enabled by Real API Keys

### With Stock APIs:
- ✅ Real-time stock prices in INR
- ✅ Actual historical price data
- ✅ Live technical indicators (RSI, MACD, SMA)
- ✅ Volume analysis
- ✅ 52-week high/low data

### With Groq API:
- ✅ Gen Z personality AI responses
- ✅ Deep stock analysis
- ✅ Investment recommendations
- ✅ Risk assessment
- ✅ Price target predictions

## API Rate Limits

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Groq | High limits | Even higher limits |
| Alpha Vantage | 25/day | 5,000+/day |
| Finnhub | 60/minute | Unlimited |

## Pro Tips

1. **Start with Alpha Vantage** - Best free tier for testing
2. **Add Finnhub as backup** - Higher rate limits
3. **Monitor usage** - Check your API dashboard regularly
4. **Cache data** - The app includes smart caching to reduce API calls

## Troubleshooting

### "API Key not found" Error
- Double-check your `.env` file exists
- Verify the variable names match exactly
- Restart your dev server after adding keys

### "Rate limit exceeded" Error
- You've hit your daily/minute limit
- Wait for the limit to reset
- Consider upgrading to a paid plan
- The app will fallback to mock data

### "Invalid response" Error
- Check if your API key is correct
- Verify the API service is working
- The app will retry with the backup API

---

**Ready to test?** Try asking the Finance Advisor:
- "What's the deal with AAPL stock?"
- "Should I buy Tesla right now?"
- "Analyze NVDA chart for me"

The AI will provide Gen Z personality responses with real market data! 🚀💰 