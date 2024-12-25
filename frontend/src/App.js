import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/predict', { ticker });
      setPredictionData(response.data);
    } catch (err) {
      setError('Failed to fetch prediction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = predictionData ? {
    labels: [
      ...predictionData.historical_prices.map((_, i) => `Historical Day ${i+1}`),
      ...predictionData.predictions.map((_, i) => `Predicted Day ${i+1}`)
    ],
    datasets: [
      {
        label: 'Historical Prices',
        data: predictionData.historical_prices,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
      },
      {
        label: 'Predicted Prices',
        data: [
          ...Array(predictionData.historical_prices.length).fill(null),
          ...predictionData.predictions
        ],
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
      }
    ]
  } : null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">StockTime Prediction</h1>
        
        <div className="flex mb-6">
          <input 
            type="text" 
            value={ticker} 
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="flex-grow border rounded-l-md p-2"
            placeholder="Enter Stock Ticker (e.g., AAPL)"
          />
          <button 
            onClick={fetchPrediction}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
          >
            Predict
          </button>
        </div>

        {loading && (
          <div className="text-center text-gray-600">
            Generating prediction...
          </div>
        )}

        {error && (
          <div className="text-center text-red-500">
            {error}
          </div>
        )}

        {predictionData && chartData && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">
              {ticker} Stock Price Prediction
            </h2>
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Stock Price Prediction'
                  }
                }
              }} 
            />
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Prediction Summary</h3>
              <p>Last Historical Price: ${predictionData.historical_prices[predictionData.historical_prices.length - 1].toFixed(2)}</p>
              <p>First Predicted Price: ${predictionData.predictions[0].toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
