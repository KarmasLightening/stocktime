import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createChart } from 'lightweight-charts';

function App() {
  const [ticker, setTicker] = useState('');
  const [marketType, setMarketType] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const [trackingData, setTrackingData] = useState(null);
  const [chartContainer, setChartContainer] = useState(null);

  const markets = [
    {
      id: 'stocks',
      title: 'Stocks',
      description: 'Major exchanges',
      examples: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
      timeframes: ['1d']
    },
    {
      id: 'futures',
      title: 'Futures',
      description: 'Commodities & indices',
      examples: ['ES=F', 'NQ=F', 'CL=F', 'GC=F', 'SI=F'],
      timeframes: ['1d']
    },
    {
      id: 'crypto',
      title: 'Crypto',
      description: 'Digital assets',
      examples: ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP'],
      timeframes: ['5min', '15min', '1h', '1d']
    }
  ];

  const timeframes = {
    stocks: ['1d'],
    futures: ['1d'],
    crypto: ['5min', '15min', '1h', '1d']
  };

  const handleMarketSelect = (marketId) => {
    setMarketType(marketId);
    setTimeframe(timeframes[marketId][0]);
    setTicker('');
    setPredictions(null);
    setTrackingData(null);
  };

  useEffect(() => {
    if (chartContainer && predictions) {
      const chart = createChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 400,
        layout: {
          background: { color: '#2d2d2d' },
          textColor: '#b3b3b3',
        },
        grid: {
          vertLines: { color: '#404040' },
          horzLines: { color: '#404040' },
        },
        rightPriceScale: {
          borderColor: '#404040',
        },
        timeScale: {
          borderColor: '#404040',
          timeVisible: true,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });

      if (predictions?.historical_data) {
        candlestickSeries.setData(
          predictions.historical_data.map(d => ({
            time: new Date(d.time).getTime() / 1000,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );
      }

      if (predictions?.predictions) {
        const lastTime = predictions.historical_data[predictions.historical_data.length - 1].time;
        const timeIncrement = timeframe === '5min' ? 300 :
                            timeframe === '15min' ? 900 :
                            timeframe === '1h' ? 3600 : 86400;

        lineSeries.setData(
          predictions.predictions.map((price, i) => ({
            time: new Date(lastTime).getTime() / 1000 + timeIncrement * (i + 1),
            value: price,
          }))
        );
      }

      chart.timeScale().fitContent();

      return () => {
        chart.remove();
      };
    }
  }, [predictions, chartContainer, timeframe]);

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post('http://localhost:5000/predict', {
        ticker,
        marketType,
        timeframe
      });
      setPredictions(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:5000/track_predictions`, {
        params: {
          ticker,
          marketType,
          timeframe,
          days: 7
        }
      });
      setTrackingData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="container">
        {/* Market Selection */}
        <div className="market-container">
          <h2 className="market-container-title">Select Market Type</h2>
          <div className="market-grid">
            {markets.map(market => (
              <div
                key={market.id}
                className={`market-card ${marketType === market.id ? 'selected' : ''}`}
                onClick={() => handleMarketSelect(market.id)}
              >
                <h3 className="market-card-title">{market.title}</h3>
                <p className="market-card-description">{market.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <h1 className="section-title">Market Price Predictor</h1>
          
          <div className="tab-container">
            <div
              className={`tab ${activeTab === 'predict' ? 'active' : ''}`}
              onClick={() => setActiveTab('predict')}
            >
              Predict
            </div>
            <div
              className={`tab ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
            >
              Track
            </div>
          </div>

          {marketType && (
            <>
              {/* Example Tickers */}
              <div className="example-tickers">
                {markets.find(m => m.id === marketType)?.examples.map(example => (
                  <button
                    key={example}
                    onClick={() => setTicker(example)}
                    className={`ticker-pill ${ticker === example ? 'active' : ''}`}
                  >
                    {example}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="input-label">Ticker Symbol</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter ticker symbol"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Timeframe</label>
                  <select
                    className="select-field"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    {timeframes[marketType].map(tf => (
                      <option key={tf} value={tf}>{tf}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                {activeTab === 'predict' ? (
                  <button
                    className="button"
                    onClick={handlePredict}
                    disabled={!ticker || loading}
                  >
                    {loading ? 'Predicting...' : 'Predict'}
                  </button>
                ) : (
                  <button
                    className="button"
                    onClick={fetchTrackingData}
                    disabled={!ticker || loading}
                  >
                    {loading ? 'Loading...' : 'Track Predictions'}
                  </button>
                )}
              </div>
            </>
          )}

          {error && <div className="error-message mt-6">{error}</div>}
          {loading && <div className="loading-spinner" />}

          {/* Results Section */}
          {activeTab === 'predict' && predictions && (
            <div className="mt-8">
              <div className="chart-container">
                <div ref={setChartContainer} style={{ width: '100%', height: '400px' }} />
              </div>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.predictions.map((price, index) => {
                      const lastTime = new Date(predictions.historical_data[predictions.historical_data.length - 1].time);
                      const timeIncrement = timeframe === '5min' ? 5 :
                                          timeframe === '15min' ? 15 :
                                          timeframe === '1h' ? 60 : 1440;
                      const predictionTime = new Date(lastTime.getTime() + timeIncrement * 60000 * (index + 1));
                      
                      return (
                        <tr key={index}>
                          <td>{predictionTime.toLocaleString()}</td>
                          <td>${price.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tracking Results */}
          {activeTab === 'track' && trackingData && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Prediction Time</th>
                    <th>Target Time</th>
                    <th>Predicted Price</th>
                    <th>Actual Price</th>
                    <th>Error %</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingData.map((prediction, index) => (
                    <tr key={index}>
                      <td>{new Date(prediction.prediction_time).toLocaleString()}</td>
                      <td>{new Date(prediction.target_time).toLocaleString()}</td>
                      <td>${prediction.predicted_price.toFixed(2)}</td>
                      <td>
                        {prediction.actual_price
                          ? `$${prediction.actual_price.toFixed(2)}`
                          : 'Pending'
                        }
                      </td>
                      <td>
                        {prediction.error_percentage
                          ? `${prediction.error_percentage.toFixed(2)}%`
                          : 'Pending'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
