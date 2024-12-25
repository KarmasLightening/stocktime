import numpy as np
import torch

class StockDataProcessor:
    def __init__(self, patch_length=32):
        self.patch_length = patch_length
    
    def normalize_prices(self, prices):
        """
        Normalize stock prices using reversible instance normalization
        Ensures mean of zero and standard deviation of one
        
        Args:
            prices (np.array): Original price data
        
        Returns:
            np.array: Normalized prices
        """
        # Compute mean and standard deviation
        mean = np.mean(prices)
        std = np.std(prices)
        
        # Normalize prices
        normalized_prices = (prices - mean) / std
        
        return normalized_prices
    
    def denormalize_prices(self, normalized_prices, base_price=None, original_mean=None, original_std=None):
        """
        Denormalize prices back to original scale
        
        Args:
            normalized_prices (np.array): Normalized price predictions
            base_price (float, optional): Base price to anchor denormalization
            original_mean (float, optional): Original mean of prices
            original_std (float, optional): Original standard deviation of prices
        
        Returns:
            np.array: Denormalized prices
        """
        # If base price is provided, use it to adjust denormalization
        if base_price is not None:
            # If original statistics are not provided, estimate from base_price
            if original_mean is None:
                original_mean = base_price
            if original_std is None:
                original_std = base_price * 0.1  # Rough estimate
            
            # Denormalize and adjust to base price
            denormalized_prices = normalized_prices * original_std + original_mean
            return denormalized_prices
        
        # If no base price, use standard denormalization
        return normalized_prices
    
    def create_patches(self, prices):
        """
        Split price series into consecutive, non-overlapping patches
        
        Args:
            prices (np.array): Original price series
        
        Returns:
            np.array: Patches of prices
        """
        # Normalize prices first
        normalized_prices = self.normalize_prices(prices)
        
        # Create patches
        patches = []
        for i in range(0, len(normalized_prices) - self.patch_length + 1, self.patch_length):
            patch = normalized_prices[i:i+self.patch_length]
            patches.append(patch)
        
        return np.array(patches)
    
    def create_text_template(self, price_patch):
        """
        Create a textual template for a price patch
        Includes statistical details and analysis
        
        Args:
            price_patch (np.array): Normalized price patch
        
        Returns:
            str: Textual template describing the patch
        """
        min_price = np.min(price_patch)
        max_price = np.max(price_patch)
        avg_price = np.mean(price_patch)
        rate_of_change = (price_patch[-1] - price_patch[0]) / price_patch[0] * 100
        
        template = (
            f"Stock Price Patch Analysis:\n"
            f"Minimum Normalized Price: {min_price:.4f}\n"
            f"Maximum Normalized Price: {max_price:.4f}\n"
            f"Average Normalized Price: {avg_price:.4f}\n"
            f"Normalized Rate of Change: {rate_of_change:.4f}%\n"
            f"Patch Length: {len(price_patch)} days"
        )
        return template
