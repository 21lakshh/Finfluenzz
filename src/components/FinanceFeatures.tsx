import { TrendingUpIcon, DollarSignIcon, BrainCircuitIcon, BarChart3Icon } from "lucide-react"
import { BentoCard, BentoGrid } from "../components/magicui/bento-grid";

const stockData = [
  {
    name: "AAPL",
    price: "₹14,860",
    change: "+2.4%",
    body: "Apple Inc. - Strong performance with iPhone 15 sales exceeding expectations.",
  },
  {
    name: "TSLA", 
    price: "₹20,320",
    change: "+5.1%",
    body: "Tesla Inc. - Cybertruck production ramping up, deliveries ahead of schedule.",
  },
  {
    name: "NVDA",
    price: "₹37,944", 
    change: "+8.7%",
    body: "NVIDIA Corporation - AI chip demand continues to drive massive growth.",
  },
  {
    name: "MSFT",
    price: "₹31,593",
    change: "+1.8%",
    body: "Microsoft Corporation - Azure cloud services showing steady growth.",
  },
  {
    name: "GOOGL",
    price: "₹11,177",
    change: "+3.2%",
    body: "Alphabet Inc. - Search revenue up, AI integration boosting ad performance.",
  },
];

const budgetItems = [
  "💰 Monthly Income: ₹65,000",
  "🏠 Rent: ₹24,000 (37.5%)", 
  "🍕 Food: ₹8,000 (12.5%)",
  "🚗 Transportation: ₹6,000 (9.4%)",
  "🎯 Savings Goal: ₹16,000 (25%)",
  "🎮 Entertainment: ₹4,000 (6.3%)",
  "📱 Subscriptions: ₹2,000 (3.1%)",
];

const aiInsights = [
  "🔥 Hot Stock Alert: NVDA showing strong momentum",
  "💡 Budget Tip: You could save ₹1,000/month on subscriptions",
  "📈 Portfolio Insight: Your tech allocation is optimal",
  "⚠️ Risk Alert: Consider diversifying beyond tech",
  "🎯 Goal Update: You're 85% to your savings target!",
  "💰 Opportunity: Dollar-cost averaging recommended for AAPL",
];

// Stock chart data points
const chartData = [
  { time: "9:00", price: 150 },
  { time: "10:00", price: 155 },
  { time: "11:00", price: 148 },
  { time: "12:00", price: 162 },
  { time: "1:00", price: 158 },
  { time: "2:00", price: 165 },
  { time: "3:00", price: 172 },
  { time: "4:00", price: 168 },
];

const StockChart = () => {
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const minPrice = Math.min(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  
  return (
    <div className="absolute inset-4 flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-minecraft font-bold text-[#007FFF]">AAPL</h3>
        <p className="text-2xl font-bold text-green-600">₹14,021 +2.4%</p>
      </div>
      <div className="flex-1 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="40"
              y1={40 + (i * 32)}
              x2="360"
              y2={40 + (i * 32)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-300 dark:text-gray-600"
              opacity="0.3"
            />
          ))}
          
          {/* Chart line */}
          <polyline
            fill="none"
            stroke="#007FFF"
            strokeWidth="3"
            points={chartData.map((point, i) => {
              const x = 40 + (i * 45);
              const y = 200 - 40 - ((point.price - minPrice) / priceRange) * 120;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {chartData.map((point, i) => {
            const x = 40 + (i * 45);
            const y = 200 - 40 - ((point.price - minPrice) / priceRange) * 120;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill="#007FFF"
                className="animate-pulse"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const features = [
  {
    Icon: BarChart3Icon,
    name: "Live Stock Charts",
    description: "Real-time interactive charts with technical analysis and price predictions.",
    href: "#",
    cta: "View Charts",
    className: "col-span-3 lg:col-span-2",
    background: <StockChart />,
  },
  {
    Icon: DollarSignIcon,
    name: "Smart Budgeting",
    description: "AI-powered expense tracking with personalized insights and recommendations.",
    href: "#",
    cta: "Create Budget",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-4">
        <div className="space-y-3">
          {budgetItems.slice(0, 5).map((item, idx) => (
            <div
              key={idx}
              className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 border border-blue-200 dark:border-blue-800 transform transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${idx * 200}ms` }}
            >
              <p className="text-sm font-minecraft text-[#001F3F] dark:text-white">{item}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    Icon: TrendingUpIcon,
    name: "Stock Watchlist",
    description: "Track your favorite stocks with real-time prices and market insights.",
    href: "#",
    cta: "Add Stocks",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-4 space-y-2">
        {stockData.slice(0, 4).map((stock, idx) => (
          <div
            key={idx}
            className="bg-white/90 dark:bg-slate-800/90 rounded-lg p-3 border border-blue-200 dark:border-blue-800 flex justify-between items-center"
          >
            <div>
              <h4 className="font-minecraft font-bold text-[#001F3F] dark:text-white">{stock.name}</h4>
              <p className="text-sm text-[#007FFF]">{stock.price}</p>
            </div>
            <span className="text-green-600 font-bold text-sm">{stock.change}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    Icon: BrainCircuitIcon,
    name: "AI Investment Assistant",
    description: "Get personalized investment advice and portfolio optimization suggestions.",
    href: "#",
    cta: "Ask AI",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div className="absolute inset-4">
        <div className="space-y-3">
          {aiInsights.slice(0, 4).map((insight, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-600/20 dark:to-purple-600/20 rounded-lg p-3 border border-blue-300/50 dark:border-blue-700/50 transform transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${idx * 300}ms` }}
            >
              <p className="text-sm font-minecraft text-[#001F3F] dark:text-white">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function FinanceFeatures() {
  return (
    <div className="px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-[400px]">
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </div>
  );
} 