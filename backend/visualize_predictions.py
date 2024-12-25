import numpy as np
import torch
import matplotlib.pyplot as plt
from model.stocktime_model import StockTime
from model.data_processor import StockDataProcessor

def generate_sample_data():
    np.random.seed(42)
    base_price = 100
    trend = np.linspace(0, 5, 100)
    noise = np.random.normal(0, 2, 100)
    sample_prices = base_price + trend + np.cumsum(noise)
    return sample_prices

def visualize_predictions():
    # Initialize model and processor
    model = StockTime()
    processor = StockDataProcessor()

    # Generate sample data
    sample_prices = generate_sample_data()
    normalized_prices = processor.normalize_prices(sample_prices)

    # Make predictions
    predictions = model.predict(normalized_prices).numpy()

    # Denormalize predictions
    last_known_price = sample_prices[-1]
    denormalized_predictions = processor.denormalize_prices(
        predictions, 
        base_price=last_known_price, 
        original_mean=np.mean(sample_prices), 
        original_std=np.std(sample_prices)
    )

    # Prepare visualization
    plt.figure(figsize=(14, 7))
    plt.title('Stock Price Prediction', fontsize=16)
    plt.xlabel('Time Steps', fontsize=12)
    plt.ylabel('Stock Price', fontsize=12)

    # Plot historical prices
    historical_x = np.arange(len(sample_prices))
    plt.plot(historical_x, sample_prices, label='Historical Prices', color='blue', linewidth=2)

    # Prepare prediction data
    prediction_values = np.concatenate([[last_known_price], denormalized_predictions])
    prediction_x = np.arange(len(sample_prices)-1, len(sample_prices)-1 + len(prediction_values))
    
    # Plot predictions
    plt.plot(prediction_x, prediction_values, 
             label='Predicted Prices', 
             color='red', 
             linestyle='--',
             linewidth=2)

    # Highlight prediction start point
    plt.scatter(historical_x[-1], last_known_price, color='green', s=100, 
                label='Prediction Start', zorder=5)

    plt.legend(fontsize=10)
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()

    # Save the plot
    plt.savefig('/home/karmaslightening/CascadeProjects/stocktime/backend/prediction_visualization.png', dpi=300)
    print("Prediction visualization saved to prediction_visualization.png")

    # Print prediction details
    print("\nPrediction Details:")
    print("Last Historical Price:", last_known_price)
    print("Predicted Prices:", denormalized_predictions)

if __name__ == "__main__":
    visualize_predictions()
