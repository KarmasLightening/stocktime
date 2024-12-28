import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PredictionTracker = ({ ticker, marketType, timeframe }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/track_predictions`, {
          params: {
            ticker,
            marketType,
            timeframe,
            days: marketType === 'crypto' && timeframe !== '1d' ? 1 : 7 // Shorter window for short timeframes
          }
        });
        setTrackingData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
    // Refresh data more frequently for shorter timeframes
    const interval = setInterval(
      fetchTrackingData,
      timeframe === '5min' ? 30000 : // 30 seconds
      timeframe === '15min' ? 60000 : // 1 minute
      timeframe === '1h' ? 300000 : // 5 minutes
      900000 // 15 minutes for daily
    );
    return () => clearInterval(interval);
  }, [ticker, marketType, timeframe]);

  if (loading) {
    return <div className="text-center p-4">Loading prediction tracking data...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!trackingData || !trackingData.predictions.length) {
    return <div className="text-center p-4">No prediction data available</div>;
  }

  const { predictions, statistics } = trackingData;

  // Format time based on timeframe
  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    if (timeframe === '5min' || timeframe === '15min') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (timeframe === '1h') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        hour12: true
      });
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Prediction Tracking</h2>
      
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded">
          <h3 className="text-sm font-semibold">Average Error</h3>
          <p className="text-lg">{statistics.average_error?.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <h3 className="text-sm font-semibold">Accuracy ≤1%</h3>
          <p className="text-lg">{statistics.accuracy_within_1_percent?.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <h3 className="text-sm font-semibold">Accuracy ≤5%</h3>
          <p className="text-lg">{statistics.accuracy_within_5_percent?.toFixed(1)}%</p>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left bg-gray-700">
              <th className="p-2">Time</th>
              <th className="p-2">Target</th>
              <th className="p-2">Predicted</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred) => (
              <tr key={pred.id} className="border-t border-gray-700">
                <td className="p-2">{formatTime(pred.prediction_time)}</td>
                <td className="p-2">{formatTime(pred.target_time)}</td>
                <td className="p-2">${pred.predicted_price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</td>
                <td className="p-2">
                  {pred.actual_price ? (
                    `$${pred.actual_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}`
                  ) : (
                    'Pending'
                  )}
                </td>
                <td className={`p-2 ${
                  pred.error_percentage > 0 ? 'text-green-400' :
                  pred.error_percentage < 0 ? 'text-red-400' : ''
                }`}>
                  {pred.error_percentage ? (
                    `${pred.error_percentage > 0 ? '+' : ''}${pred.error_percentage.toFixed(2)}%`
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PredictionTracker;
