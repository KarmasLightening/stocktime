import numpy as np
import torch
from model.stocktime_model import StockTime
from model.data_processor import StockDataProcessor

def test_stocktime_model():
    # Create model and processor
    model = StockTime()
    processor = StockDataProcessor()

    # Generate sample stock price data with more realistic behavior
    np.random.seed(42)
    
    # Simulate a more realistic stock price trend
    base_price = 100
    trend = np.linspace(0, 5, 100)  # Slight upward trend
    noise = np.random.normal(0, 2, 100)  # Random fluctuations
    sample_prices = base_price + trend + np.cumsum(noise)

    # Normalize prices
    normalized_prices = processor.normalize_prices(sample_prices)

    try:
        # Comprehensive input diagnostics
        print("Input Price Details:")
        print("Type:", type(normalized_prices))
        print("Shape:", normalized_prices.shape)
        
        # Convert to tensor with detailed logging
        input_tensor = torch.FloatTensor(normalized_prices)
        print("\nTensor Conversion:")
        print("Tensor Type:", type(input_tensor))
        print("Tensor Shape:", input_tensor.shape)
        print("Tensor Dimensions:", input_tensor.dim())

        # Test forward pass with detailed diagnostics
        print("\nForward Pass Test:")
        try:
            single_prediction = model(input_tensor)
            print("Single Prediction:", single_prediction)
            print("Single Prediction Type:", type(single_prediction))
            print("Single Prediction Shape:", 
                  single_prediction.shape if hasattr(single_prediction, 'shape') else "N/A")
        except Exception as forward_error:
            print("Forward Pass Error:", forward_error)
            import traceback
            traceback.print_exc()
            return False

        # Prediction method test with detailed logging
        print("\nPrediction Method Test:")
        try:
            predictions = model.predict(normalized_prices)
            
            print("Prediction Details:")
            print(f"Input Price Length: {len(normalized_prices)}")
            print(f"Prediction Length: {len(predictions)}")
            print("Predictions:", predictions.numpy())
            
            # Validation checks
            assert len(predictions) == 7, "Predictions should be 7 steps ahead"
            assert predictions.dim() == 1, "Predictions should be a 1D tensor"
            
            print("\n All tests passed successfully!")
            return True
        
        except Exception as predict_error:
            print("Prediction Method Error:", predict_error)
            import traceback
            traceback.print_exc()
            return False
    
    except Exception as e:
        print(f"Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_stocktime_model()
    print("\nOverall Test:", "PASSED" if success else "FAILED")
