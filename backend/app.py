from flask import Flask, request, jsonify
from flask_cors import CORS
from model.stocktime_model import StockTime
from model.data_processor import StockDataProcessor
import yfinance as yf
import pandas as pd
import torch

app = Flask(__name__)
CORS(app)

class StockPredictionService:
    def __init__(self):
        self.model = StockTime()
        self.processor = StockDataProcessor()
        
    def fetch_stock_data(self, ticker, period='1y'):
        stock_data = yf.download(ticker, period=period)
        return stock_data['Close']
    
    def predict_stock_price(self, ticker):
        # Fetch historical data
        prices = self.fetch_stock_data(ticker)
        
        # Normalize and prepare data
        normalized_prices = self.processor.normalize_prices(prices.values)
        
        # Predict
        with torch.no_grad():
            prediction = self.model.predict(normalized_prices)
        
        return {
            'historical_prices': prices.tolist(),
            'predictions': prediction.tolist(),
            'ticker': ticker
        }

prediction_service = StockPredictionService()

@app.route('/predict', methods=['POST'])
def predict():
    ticker = request.json.get('ticker', 'AAPL')
    try:
        results = prediction_service.predict_stock_price(ticker)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
