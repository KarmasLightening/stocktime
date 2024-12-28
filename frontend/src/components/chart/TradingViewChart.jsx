import React, { useEffect, useRef } from 'react';
import './TradingViewChart.css';

let tvScriptLoadingPromise;

const TradingViewChart = ({ symbol, timeframe, predictedPrice, lastPrice, marketType = 'stocks' }) => {
  const onLoadScriptRef = useRef();
  
  const getFormattedSymbol = (symbol, marketType) => {
    console.log('Original symbol:', symbol);
    console.log('Market type:', marketType);
    
    // Clean the symbol (remove =F for futures, =X for forex)
    const cleanSymbol = symbol.split('=')[0];
    console.log('Cleaned symbol:', cleanSymbol);
    
    switch (marketType) {
      case 'futures':
        // Map common futures to their correct symbols
        const futuresMap = {
          // Regular E-mini futures
          'ES': 'CME_MINI:ES1!',  // E-mini S&P 500 (CME)
          'NQ': 'NQ1!',           // E-mini NASDAQ
          'YM': 'YM1!',           // E-mini Dow
          'RTY': 'RTY1!',         // E-mini Russell 2000
          
          // Micro E-mini futures
          'MES': 'MES1!',         // Micro E-mini S&P 500
          'MNQ': 'MNQ1!',         // Micro E-mini NASDAQ
          'MYM': 'MYM1!',         // Micro E-mini Dow
          'M2K': 'M2K1!',         // Micro E-mini Russell 2000
          
          // Other futures
          'CL': 'CL1!',           // Crude Oil
          'MCL': 'MCL1!',         // Micro Crude Oil
          'GC': 'GC1!',           // Gold
          'MGC': 'MGC1!',         // Micro Gold
          'SI': 'SI1!',           // Silver
          'ZB': 'ZB1!',           // 30Y T-Bond
          'ZN': 'ZN1!',           // 10Y T-Note
          '6E': '6E1!',           // Euro FX
          'M6E': 'M6E1!'          // Micro Euro FX
        };
        
        const futuresSymbol = futuresMap[cleanSymbol] || cleanSymbol;
        console.log('Formatted futures symbol:', futuresSymbol);
        return futuresSymbol;
        
      case 'forex':
        const forexSymbol = `FX:${cleanSymbol}`;
        console.log('Formatted forex symbol:', forexSymbol);
        return forexSymbol;
        
      default:
        console.log('Using default symbol:', cleanSymbol);
        return cleanSymbol;
    }
  };

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current && onLoadScriptRef.current());

    return () => {
      onLoadScriptRef.current = null;
    };
  }, [symbol, timeframe, predictedPrice, marketType]);

  const createWidget = () => {
    if (document.getElementById('tradingview-widget') && 'TradingView' in window) {
      const formattedSymbol = getFormattedSymbol(symbol, marketType);
      console.log('Final TradingView symbol:', formattedSymbol);

      const widget = new window.TradingView.widget({
        width: "100%",
        height: 550,  // Explicit height in pixels
        symbol: formattedSymbol,
        interval: timeframe === '1d' ? 'D' : '15',
        timezone: 'America/Los_Angeles',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1a1a1a',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        calendar: true,
        container_id: 'tradingview-widget',
        studies: [
          'MASimple@tv-basicstudies',  // 20-day SMA
          'MASimple@tv-basicstudies',  // 50-day SMA
          'RSI@tv-basicstudies'        // RSI
        ],
        overrides: {
          'mainSeriesProperties.candleStyle.upColor': '#2ecc71',
          'mainSeriesProperties.candleStyle.downColor': '#e74c3c',
          'mainSeriesProperties.candleStyle.borderUpColor': '#2ecc71',
          'mainSeriesProperties.candleStyle.borderDownColor': '#e74c3c',
        },
        loading_screen: { backgroundColor: "#1a1a1a" },
        saved_data: {
          drawings: [{
            type: 'horizontal_line',
            coords: { price: lastPrice },
            state: { 
              lineColor: '#999',
              lineWidth: 1,
              lineStyle: 0,
              showLabel: true,
              text: 'Last Price'
            }
          },
          {
            type: 'horizontal_line',
            coords: { price: predictedPrice },
            state: { 
              lineColor: predictedPrice > lastPrice ? '#2ecc71' : '#e74c3c',
              lineWidth: 1,
              lineStyle: 0,
              showLabel: true,
              text: 'Predicted Price'
            }
          }]
        }
      });
    }
  };

  return (
    <div className="tradingview-chart-container">
      <div id="tradingview-widget" />
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-line" style={{ backgroundColor: '#999' }}></span>
          <span>Last Price: ${lastPrice.toFixed(2)}</span>
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ 
            backgroundColor: predictedPrice > lastPrice ? '#2ecc71' : '#e74c3c' 
          }}></span>
          <span>Predicted Price: ${predictedPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;
