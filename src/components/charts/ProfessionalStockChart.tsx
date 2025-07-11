import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { StockHistoricalData } from '../../services/stockAPI';
import { formatISTDate } from '../../utils/timezoneUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

interface ProfessionalStockChartProps {
  data: StockHistoricalData[];
  symbol: string;
  height?: number;
  showVolume?: boolean;
}

export default function ProfessionalStockChart({ 
  data, 
  symbol, 
  height = 400,
  showVolume = true 
}: ProfessionalStockChartProps) {
  if (data.length === 0) return null;

  // Calculate percentage change
  const firstPrice = data[data.length - 1].close;
  const lastPrice = data[0].close;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const isPositive = percentChange >= 0;

  // Prepare chart data
  const chartLabels = data.map(d => {
    const date = new Date(d.date);
    return formatISTDate(date, { month: 'short', day: 'numeric' });
  }).reverse();

  const priceData = data.map(d => (d.close * 85.79).toFixed(2)).reverse();
  const volumeData = data.map(d => d.volume).reverse();

  // Price chart configuration
  const priceChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceData,
        borderColor: isPositive ? '#10b981' : '#ef4444',
        backgroundColor: isPositive 
          ? 'rgba(16, 185, 129, 0.1)' 
          : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const priceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return `${symbol} - ${context[0].label}`;
          },
          label: (context: any) => {
            return `Price: ₹${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: '#f3f4f6',
          borderColor: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: '#f3f4f6',
          borderColor: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: (value: any) => `₹${value}`,
        },
      },
    },
  };

  // Volume chart configuration
  const volumeChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Volume',
        data: volumeData,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 0,
        borderRadius: 2,
      },
    ],
  };

  const volumeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return `Volume - ${context[0].label}`;
          },
          label: (context: any) => {
            return `${(context.parsed.y / 1000000).toFixed(1)}M shares`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        position: 'right' as const,
        grid: {
          color: '#f3f4f6',
          borderColor: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
          },
          callback: (value: any) => `${(value / 1000000).toFixed(0)}M`,
        },
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {symbol}
            </h3>
            <p className="text-sm text-gray-500">
              Last {data.length} days • 🇮🇳 Times in IST
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ₹{(lastPrice * 85.79).toFixed(0)}
            </p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="mb-6">
        <div style={{ height: `${height}px` }}>
          <Line data={priceChartData} options={priceChartOptions} />
        </div>
      </div>

      {/* Volume Chart */}
      {showVolume && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Volume</h4>
          <div style={{ height: '120px' }}>
            <Bar data={volumeChartData} options={volumeChartOptions} />
          </div>
        </div>
      )}

      {/* Chart Stats */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">HIGH</p>
            <p className="text-sm font-bold text-gray-900">
              ₹{(Math.max(...data.map(d => d.high)) * 85.79).toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">LOW</p>
            <p className="text-sm font-bold text-gray-900">
              ₹{(Math.min(...data.map(d => d.low)) * 85.79).toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">AVG VOLUME</p>
            <p className="text-sm font-bold text-gray-900">
              {(data.reduce((sum, d) => sum + d.volume, 0) / data.length / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">RANGE</p>
            <p className="text-sm font-bold text-gray-900">
              {((Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low))) / Math.min(...data.map(d => d.low)) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 