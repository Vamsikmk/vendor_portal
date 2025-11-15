# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements-metrics.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-metrics.txt

# Copy application files
COPY database.py .            
COPY auth.py .
COPY config.py .
COPY employee_management.py .
COPY patient_management.py .
COPY dbRetrievalWithNewMetrics.py .

# Create a main.py entry point if it doesn't exist
RUN echo 'from dbRetrievalWithNewMetrics import app\nimport uvicorn\n\nif __name__ == "__main__":\n    uvicorn.run(app, host="0.0.0.0", port=8000)' > main.py

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health-check')"

# Run the application
CMD ["uvicorn", "dbRetrievalWithNewMetrics:app", "--host", "0.0.0.0", "--port", "8000"]