from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
from datetime import datetime, timedelta
import pandas as pd
import sqlite3
import json
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Create database directory if it doesn't exist
DB_DIR = Path(__file__).parent / 'data'
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / 'predictions.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Drop existing table if it exists
    c.execute('DROP TABLE IF EXISTS predictions')
    
    # Create the predictions table with the timeframe column
    c.execute('''
        CREATE TABLE predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            market_type TEXT NOT NULL,
            prediction_time TIMESTAMP NOT NULL,
            target_time TIMESTAMP NOT NULL,
            predicted_price REAL NOT NULL,
            actual_price REAL,
            error_percentage REAL,
            timeframe TEXT NOT NULL DEFAULT '1d',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize the database when the app starts
init_db()

# Common futures contracts with their yfinance symbols
FUTURES_SYMBOLS = {
    'ES': 'ES=F',  # E-mini S&P 500
    'NQ': 'NQ=F',  # E-mini NASDAQ 100
    'YM': 'YM=F',  # E-mini Dow
    'RTY': 'RTY=F',  # E-mini Russell 2000
    'GC': 'GC=F',  # Gold
    'SI': 'SI=F',  # Silver
    'CL': 'CL=F',  # Crude Oil
    'NG': 'NG=F',  # Natural Gas
    'ZB': 'ZB=F',  # Treasury Bond
    'ZN': 'ZN=F',  # 10-Year T-Note
    '6E': '6E=F',  # Euro FX
    '6J': '6J=F',  # Japanese Yen
    'ZC': 'ZC=F',  # Corn
    'ZS': 'ZS=F',  # Soybeans
    'ZW': 'ZW=F',  # Wheat
}

# Common cryptocurrency pairs
CRYPTO_SYMBOLS = {
    'BTC-USD': 'Bitcoin',
    'ETH-USD': 'Ethereum',
    'BNB-USD': 'Binance Coin',
    'XRP-USD': 'Ripple',
    'ADA-USD': 'Cardano',
    'DOGE-USD': 'Dogecoin',
    'SOL-USD': 'Solana',
    'DOT-USD': 'Polkadot',
    'MATIC-USD': 'Polygon',
    'LINK-USD': 'Chainlink'
}

@app.route('/markets', methods=['GET'])
def get_markets():
    markets = [
        {
            'id': 'stocks',
            'name': 'Stocks',
            'description': 'US Stock Market',
            'examples': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
        },
        {
            'id': 'crypto',
            'name': 'Crypto',
            'description': 'Cryptocurrency Market',
            'examples': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD'],
            'timeframes': [
                {'id': '5min', 'name': '5 Minutes', 'interval': '5m'},
                {'id': '15min', 'name': '15 Minutes', 'interval': '15m'},
                {'id': '1h', 'name': '1 Hour', 'interval': '1h'},
                {'id': '1d', 'name': '1 Day', 'interval': '1d'}
            ]
        },
        {
            'id': 'futures',
            'name': 'Futures',
            'description': 'Futures Market',
            'examples': ['ES=F', 'NQ=F', 'YM=F', 'RTY=F', 'CL=F']
        }
    ]
    return jsonify({'markets': markets})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    ticker = data.get('ticker')
    market_type = data.get('marketType')
    timeframe = data.get('timeframe', '1d')
    
    print(f"Received prediction request - Ticker: {ticker}, Market: {market_type}, Timeframe: {timeframe}")
    
    if not ticker:
        return jsonify({'error': 'Ticker symbol is required'}), 400

    try:
        # Add suffix for crypto tickers if not present
        if market_type == 'crypto' and '-USD' not in ticker:
            ticker = f"{ticker}-USD"

        # Configure data fetching based on timeframe
        intervals = {
            '5min': ('5m', '1d'),    # 1 day of 5-min data
            '15min': ('15m', '2d'),  # 2 days of 15-min data
            '1h': ('1h', '7d'),      # 7 days of hourly data
            '1d': ('1d', '30d')      # 30 days of daily data
        }
        
        interval, period = intervals.get(timeframe, ('1d', '30d'))
        print(f"Fetching data with interval: {interval}, period: {period}")
        
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)
        
        if hist.empty:
            print(f"No data available for ticker: {ticker}")
            return jsonify({'error': 'No data available for the specified ticker'}), 404

        print(f"Successfully fetched {len(hist)} data points")
        
        # Determine number of predictions based on market type and timeframe
        if market_type == 'crypto':
            num_predictions = {
                '5min': 24,    # 2 hours worth of 5-min predictions
                '15min': 16,   # 4 hours worth of 15-min predictions
                '1h': 12,      # 12 hours worth of hourly predictions
                '1d': 7        # 7 days worth of daily predictions
            }.get(timeframe, 12)
        else:
            num_predictions = 7  # Default to 7 predictions for stocks
            
        print(f"Will generate {num_predictions} predictions")
        
        # Calculate predictions with explicit num_predictions
        predictions = calculate_predictions(hist, num_predictions, market_type, timeframe)
        print(f"Generated {len(predictions)} predictions")
        
        # Store predictions in database
        store_predictions(ticker, market_type, predictions, timeframe)

        response_data = {
            'ticker': ticker,
            'historical_data': [
                {
                    'time': index.strftime('%Y-%m-%d %H:%M:%S'),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                }
                for index, row in hist.iterrows()
            ],
            'predictions': [float(p) for p in predictions],
            'timeframe': timeframe
        }
        
        print(f"Sending response with {len(response_data['historical_data'])} historical points and {len(response_data['predictions'])} predictions")
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def calculate_predictions(hist, num_predictions, market_type, timeframe='1d'):
    try:
        returns = hist['Close'].pct_change().dropna()
        volatility = returns.std()
        
        # Adjust volatility based on market type and timeframe
        if market_type == 'crypto':
            volatility_multipliers = {
                '5min': 0.2,   # Reduced volatility for shorter timeframes
                '15min': 0.3,
                '1h': 0.5,
                '1d': 1.0
            }
            volatility *= volatility_multipliers.get(timeframe, 1.0)
        
        last_price = hist['Close'].iloc[-1]
        
        # Adjust drift calculation based on timeframe
        if timeframe == '5min':
            drift = returns.mean() * 0.1
        elif timeframe == '15min':
            drift = returns.mean() * 0.2
        elif timeframe == '1h':
            drift = returns.mean() * 0.4
        else:
            drift = returns.mean()
        
        predictions = []
        for i in range(num_predictions):
            # Generate random walk
            random_walk = np.random.normal(drift, volatility)
            if i == 0:
                predictions.append(last_price * (1 + random_walk))
            else:
                predictions.append(predictions[-1] * (1 + random_walk))
        
        print(f"Generated predictions: First: {predictions[0]:.2f}, Last: {predictions[-1]:.2f}")
        return predictions
        
    except Exception as e:
        print(f"Error in calculate_predictions: {str(e)}")
        raise

def store_predictions(ticker, market_type, predictions, timeframe='1d'):
    conn = get_db_connection()
    c = conn.cursor()
    
    current_time = datetime.now()
    
    # Calculate prediction intervals based on timeframe
    intervals = {
        '5min': timedelta(minutes=5),
        '15min': timedelta(minutes=15),
        '1h': timedelta(hours=1),
        '1d': timedelta(days=1)
    }
    interval = intervals.get(timeframe, timedelta(days=1))
    
    # Store each prediction
    for i, pred_price in enumerate(predictions):
        target_time = current_time + (interval * (i + 1))
        c.execute('''
            INSERT INTO predictions 
            (ticker, market_type, prediction_time, target_time, predicted_price, timeframe)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (ticker, market_type, current_time, target_time, pred_price, timeframe))
    
    conn.commit()
    conn.close()

@app.route('/track_predictions', methods=['GET'])
def track_predictions():
    ticker = request.args.get('ticker')
    market_type = request.args.get('marketType')
    timeframe = request.args.get('timeframe', '1d')
    days = int(request.args.get('days', 7))
    
    if not ticker or not market_type:
        return jsonify({'error': 'Ticker and market type are required'}), 400
        
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Add USD suffix for crypto if not present
        if market_type == 'crypto' and '-USD' not in ticker:
            ticker = f"{ticker}-USD"
        
        # Get predictions from the specified timeframe
        cutoff_date = datetime.now() - timedelta(days=days)
        c.execute('''
            SELECT * FROM predictions 
            WHERE ticker = ? 
            AND market_type = ? 
            AND timeframe = ?
            AND prediction_time > ?
            ORDER BY prediction_time DESC
        ''', (ticker, market_type, timeframe, cutoff_date))
        
        predictions = []
        for row in c.fetchall():
            prediction_time = datetime.strptime(row[3], '%Y-%m-%d %H:%M:%S.%f')
            target_time = datetime.strptime(row[4], '%Y-%m-%d %H:%M:%S.%f')
            
            # For completed predictions, fetch actual price
            actual_price = None
            error_percentage = None
            if target_time < datetime.now():
                try:
                    stock = yf.Ticker(ticker)
                    # Fetch historical data based on timeframe
                    if timeframe == '5min':
                        interval = '5m'
                    elif timeframe == '15min':
                        interval = '15m'
                    elif timeframe == '1h':
                        interval = '1h'
                    else:
                        interval = '1d'
                        
                    hist = stock.history(start=target_time - timedelta(minutes=5),
                                       end=target_time + timedelta(minutes=5),
                                       interval=interval)
                    if not hist.empty:
                        actual_price = hist['Close'].iloc[-1]
                        error_percentage = ((actual_price - row[5]) / row[5]) * 100
                except Exception as e:
                    print(f"Error fetching actual price: {str(e)}")
            
            predictions.append({
                'id': row[0],
                'ticker': row[1],
                'market_type': row[2],
                'prediction_time': prediction_time.strftime('%Y-%m-%d %H:%M:%S'),
                'target_time': target_time.strftime('%Y-%m-%d %H:%M:%S'),
                'predicted_price': row[5],
                'actual_price': actual_price,
                'error_percentage': error_percentage,
                'timeframe': row[7]
            })
        
        # Calculate statistics for completed predictions
        completed_predictions = [p for p in predictions if p['actual_price'] is not None]
        statistics = calculate_prediction_statistics(completed_predictions)
        
        conn.close()
        return jsonify({
            'predictions': predictions,
            'statistics': statistics
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': 'Failed to fetch prediction data'}), 500

def calculate_prediction_statistics(predictions):
    if not predictions:
        return {
            'total_predictions': 0,
            'completed_predictions': 0,
            'average_error': None,
            'max_error': None,
            'min_error': None,
            'accuracy_within_1_percent': 0,
            'accuracy_within_5_percent': 0
        }
    
    errors = [abs(p['error_percentage']) for p in predictions]
    return {
        'total_predictions': len(predictions),
        'completed_predictions': len(predictions),
        'average_error': sum(errors) / len(errors),
        'max_error': max(errors),
        'min_error': min(errors),
        'accuracy_within_1_percent': sum(1 for e in errors if e <= 1) / len(errors) * 100,
        'accuracy_within_5_percent': sum(1 for e in errors if e <= 5) / len(errors) * 100
    }

def get_db_connection():
    return sqlite3.connect(DB_PATH)

@app.route('/reset_db', methods=['POST'])
def reset_database():
    try:
        init_db()
        return jsonify({'message': 'Database reset successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
