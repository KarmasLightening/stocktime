import torch
import torch.nn as nn
import numpy as np

class StockTime(nn.Module):
    def __init__(self, 
                 patch_length=32, 
                 num_stocks=100):
        super().__init__()
        
        # Model Hyperparameters
        self.patch_length = patch_length
        self.num_stocks = num_stocks
        
        # Autoregressive Encoder (LSTM)
        self.lstm = nn.LSTM(
            input_size=1,  # Single price value
            hidden_size=256,  # Reduced hidden size
            num_layers=2,
            batch_first=True
        )
        
        # Projection layers
        self.price_projection = nn.Linear(256, 128)
        self.output_projection = nn.Linear(128, 1)
        
    def forward(self, price_patches):
        """
        Forward pass through the StockTime model
        
        Args:
            price_patches (torch.Tensor): Normalized price patches
        
        Returns:
            torch.Tensor: Predicted prices
        """
        # Ensure input is a tensor
        if not isinstance(price_patches, torch.Tensor):
            price_patches = torch.FloatTensor(price_patches)
        
        # Ensure 2D tensor with shape (batch_size, sequence_length)
        if price_patches.dim() == 1:
            price_patches = price_patches.unsqueeze(0)
        
        # Process price data through LSTM
        lstm_out, (hidden, _) = self.lstm(price_patches.unsqueeze(-1))
        
        # Use the last hidden state for prediction
        price_embedding = self.price_projection(hidden[-1])
        
        # Final prediction
        output = self.output_projection(price_embedding)
        return output.squeeze()
    
    def predict(self, prices, steps_ahead=7):
        """
        Predict future stock prices
        
        Args:
            prices (np.array or torch.Tensor): Historical price data
            steps_ahead (int): Number of future steps to predict
        
        Returns:
            torch.Tensor: Predicted future prices
        """
        # Normalize prices
        prices = (prices - np.mean(prices)) / np.std(prices)
        
        # Convert to tensor
        prices = torch.FloatTensor(prices)
        
        # Prepare input sequence (last patch)
        input_sequence = prices[-self.patch_length:].unsqueeze(0)
        
        # Predictions
        predictions = []
        for _ in range(steps_ahead):
            with torch.no_grad():
                # Predict next price
                next_price = self(input_sequence)
                
                # Append prediction
                predictions.append(next_price.item())
                
                # Update input sequence
                new_price = torch.FloatTensor([next_price.item()]).unsqueeze(0)
                input_sequence = torch.cat([
                    input_sequence[:, 1:], 
                    new_price
                ], dim=1)
        
        return torch.FloatTensor(predictions)
