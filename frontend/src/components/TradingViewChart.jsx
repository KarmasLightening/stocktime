import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const TradingViewChart = ({ historicalData, predictions, ticker }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);

  // Cleanup function
  const cleanupChart = () => {
    if (lineSeriesRef.current) {
      lineSeriesRef.current = null;
    }
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current = null;
    }
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanupChart();
    };
  }, []);

  useEffect(() => {
    if (!historicalData || !predictions || !chartContainerRef.current) return;

    // Clean up previous chart before creating a new one
    cleanupChart();

    try {
      // Create new chart
      const chart = createChart(chartContainerRef.current, {
        height: 400,
        layout: {
          background: { color: '#1a1d1e' },
          textColor: '#DDD',
        },
        grid: {
          vertLines: { color: '#2c2c2c' },
          horzLines: { color: '#2c2c2c' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // Format historical data and ensure unique timestamps
      const seenTimestamps = new Set();
      const formattedHistoricalData = historicalData
        .map(item => {
          const dateStr = item.time.split(' ')[0]; // Only take the date part
          if (seenTimestamps.has(dateStr)) {
            return null; // Skip duplicate timestamps
          }
          seenTimestamps.add(dateStr);
          return {
            time: dateStr,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          };
        })
        .filter(Boolean) // Remove null entries
        .sort((a, b) => new Date(a.time) - new Date(b.time)); // Ensure ascending order

      // Format prediction data with unique timestamps
      const lastHistoricalDate = new Date(historicalData[historicalData.length - 1].time.split(' ')[0]);
      lastHistoricalDate.setDate(lastHistoricalDate.getDate() + 1); // Start predictions from next day

      const formattedPredictions = predictions
        .map((price, index) => {
          const predictionDate = new Date(lastHistoricalDate);
          predictionDate.setDate(predictionDate.getDate() + index);
          return {
            time: predictionDate.toISOString().split('T')[0],
            value: price
          };
        })
        .sort((a, b) => new Date(a.time) - new Date(b.time)); // Ensure ascending order

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
      });
      candlestickSeriesRef.current = candlestickSeries;

      // Add prediction line series
      const lineSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        lineStyle: 1,
        title: 'Predictions'
      });
      lineSeriesRef.current = lineSeries;

      // Set the data
      if (candlestickSeries && formattedHistoricalData.length > 0) {
        candlestickSeries.setData(formattedHistoricalData);
      }
      if (lineSeries && formattedPredictions.length > 0) {
        lineSeries.setData(formattedPredictions);
      }

      // Fit the content
      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup resize listener
      return () => {
        window.removeEventListener('resize', handleResize);
      };

    } catch (error) {
      console.error('Chart data formatting error:', error);
      cleanupChart();
    }
  }, [historicalData, predictions, ticker]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ background: '#1a1d1e' }}
    />
  );
};

export default TradingViewChart;
