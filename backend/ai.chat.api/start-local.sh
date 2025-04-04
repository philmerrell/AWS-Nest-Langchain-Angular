#!/bin/bash

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please edit .env file with your actual values before continuing."
  exit 1
fi

# Export AWS credentials if they exist in the environment
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Using AWS credentials from environment..."
  export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
  export AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
else
  # If credentials are not already exported, try to get them from AWS CLI
  echo "Trying to get AWS credentials from AWS CLI profile..."
  export AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
  export AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
  export AWS_SESSION_TOKEN=$(aws configure get aws_session_token)
  
  # Check if we successfully got credentials
  if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Failed to get AWS credentials. Please make sure AWS CLI is configured or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
    exit 1
  fi
fi

# Start Docker compose
echo "Starting Docker Compose..."
docker-compose up --build