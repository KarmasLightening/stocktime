#!/bin/bash

# Update package lists
sudo apt-get update

# Install Python and pip
sudo apt-get install -y python3 python3-pip python3-venv

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Backend setup
cd /home/karmaslightening/CascadeProjects/stocktime/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Print completion message
echo "StockTime project setup complete!"
echo "To run the backend: cd backend && source venv/bin/activate && python app.py"
echo "To run the frontend: cd frontend && npm start"
