# Makefile for Backend API
# Usage: make [command]

# Default Python interpreter
PYTHON := python3.13

# Switch to virtual environment
venv:
	@echo "Switching to virtual environment..."
	source .venv/bin/activate

# Install dependencies
install:
	@echo "Installing dependencies..."
	$(PYTHON) -m pip install -r requirements.txt

# Run Flask server
run:
	@echo "Starting Flask server..."
	$(PYTHON) -m app

# Authenticate Canva
canva_auth:
	@echo "Authenticating with Canva..."
	$(PYTHON) -m backend_app.canva_auth

