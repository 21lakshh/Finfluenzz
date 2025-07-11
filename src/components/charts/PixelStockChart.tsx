import type { StockHistoricalData } from '../../services/stockAPI';
import { formatISTDate } from '../../utils/timezoneUtils';

interface PixelStockChartProps {
  data: StockHistoricalData[];
  symbol: string;
  width?: number;
  height?: number;
  showVolume?: boolean;
}

export default function PixelStockChart({ 
  data, 
  symbol, 
  width = 600, 
  height = 300,
  showVolume = false 
}: PixelStockChartProps) {
  if (data.length === 0) return null;

  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  // Calculate price range
  const prices = data.map(d => d.close);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice;
  
  // Calculate volume range if showing volume
  const volumes = data.map(d => d.volume);
  const maxVolume = Math.max(...volumes);
  
  // Create grid points for pixelated effect
  const gridSize = 4;
  const pointSpacing = chartWidth / (data.length - 1);
  
  // Generate path points
  const pathPoints = data.map((point, index) => {
    const x = padding + (index * pointSpacing);
    const y = padding + (chartHeight - ((point.close - minPrice) / priceRange) * chartHeight);
    
    // Snap to grid for pixelated effect
    const gridX = Math.round(x / gridSize) * gridSize;
    const gridY = Math.round(y / gridSize) * gridSize;
    
    return { x: gridX, y: gridY, price: point.close, date: point.date, volume: point.volume };
  });

  // Create pixelated path
  const pathData = pathPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    
    // Create stepped line for pixelated effect
    const prevPoint = pathPoints[index - 1];
    return `${path} L ${prevPoint.x} ${point.y} L ${point.x} ${point.y}`;
  }, '');

  // Generate grid lines
  const horizontalLines = [];
  const verticalLines = [];
  
  for (let i = 0; i <= 5; i++) {
    const y = padding + (i * chartHeight / 5);
    horizontalLines.push(
      <line
        key={`h-${i}`}
        x1={padding}
        y1={y}
        x2={width - padding}
        y2={y}
        stroke="#007FFF"
        strokeWidth="1"
        opacity="0.2"
      />
    );
  }
  
  for (let i = 0; i <= 6; i++) {
    const x = padding + (i * chartWidth / 6);
    verticalLines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={padding}
        x2={x}
        y2={height - padding}
        stroke="#007FFF"
        strokeWidth="1"
        opacity="0.2"
      />
    );
  }

  // Calculate percentage change
  const firstPrice = data[data.length - 1].close;
  const lastPrice = data[0].close;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const isPositive = percentChange >= 0;

  return (
    <div className="bg-white/60 border-4 border-[#007FFF] p-4" style={{ borderRadius: '0px' }}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#001F3F] tracking-wider">
              📈 {symbol} CHART
            </h3>
            <p className="text-sm text-[#001F3F] opacity-70">
              Last {data.length} days • 🇮🇳 IST
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#001F3F]">
              ₹{(lastPrice * 85.79).toFixed(0)}
            </p>
            <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg width={width} height={height} className="font-mono">
          {/* Grid */}
          <g opacity="0.3">
            {horizontalLines}
            {verticalLines}
          </g>
          
          {/* Price area fill */}
          <path
            d={`${pathData} L ${pathPoints[pathPoints.length - 1].x} ${height - padding} L ${pathPoints[0].x} ${height - padding} Z`}
            fill={isPositive ? "#10B981" : "#EF4444"}
            fillOpacity="0.1"
          />
          
          {/* Main price line */}
          <path
            d={pathData}
            fill="none"
            stroke={isPositive ? "#10B981" : "#EF4444"}
            strokeWidth="3"
            strokeLinecap="square"
          />
          
          {/* Data points */}
          {pathPoints.map((point, index) => (
            <g key={index}>
              <rect
                x={point.x - 2}
                y={point.y - 2}
                width="4"
                height="4"
                fill={isPositive ? "#10B981" : "#EF4444"}
                className="hover:opacity-80 cursor-pointer"
              />
              
              {/* Tooltip on hover */}
              <rect
                x={point.x - 40}
                y={point.y - 40}
                width="80"
                height="30"
                fill="#001F3F"
                rx="2"
                opacity="0"
                className="hover:opacity-90 transition-opacity pointer-events-none"
              />
              <text
                x={point.x}
                y={point.y - 25}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                opacity="0"
                className="hover:opacity-100 transition-opacity pointer-events-none"
              >
                ₹{(point.price * 85.79).toFixed(0)}
              </text>
              <text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                fill="white"
                fontSize="8"
                opacity="0"
                className="hover:opacity-100 transition-opacity pointer-events-none"
              >
                {formatISTDate(new Date(point.date), { month: 'short', day: 'numeric' })}
              </text>
            </g>
          ))}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4, 5].map(i => {
            const price = minPrice + (priceRange * (5 - i) / 5);
            const y = padding + (i * chartHeight / 5);
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#001F3F"
                className="font-mono"
              >
                ₹{(price * 85.79).toFixed(0)}
              </text>
            );
          })}
          
          {/* X-axis labels */}
          {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((point, index) => {
            const x = padding + (index * Math.ceil(data.length / 6) * pointSpacing);
            return (
              <text
                key={`x-label-${index}`}
                x={x}
                y={height - padding + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#001F3F"
                className="font-mono"
              >
                {formatISTDate(new Date(point.date), { month: 'short', day: 'numeric' })}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Volume chart if enabled */}
      {showVolume && (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-[#001F3F] mb-2">📊 VOLUME</h4>
          <div className="flex items-end space-x-1 h-20">
            {data.map((point, index) => {
              const barHeight = (point.volume / maxVolume) * 60;
              return (
                <div
                  key={index}
                  className="bg-[#007FFF] opacity-60 min-w-[2px]"
                  style={{ 
                    height: `${barHeight}px`,
                    width: `${chartWidth / data.length}px`
                  }}
                  title={`Volume: ${point.volume.toLocaleString()}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Chart Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#001F3F] opacity-70">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Price Action</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-[#007FFF] opacity-60"></div>
            <span>Grid Lines</span>
          </div>
        </div>
        <div className="font-mono">
          Range: ₹{(minPrice * 85.79).toFixed(0)} - ₹{(maxPrice * 85.79).toFixed(0)}
        </div>
      </div>
    </div>
  );
} 