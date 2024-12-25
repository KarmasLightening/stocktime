#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify Mistral model
python verify_mistral.py

# Optional: Run the Flask app
# python app.py
