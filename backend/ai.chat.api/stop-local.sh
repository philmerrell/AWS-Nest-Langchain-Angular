#!/bin/bash

# Stop Docker compose
echo "Stopping Docker Compose..."
docker-compose down

# Optional cleanup
read -p "Do you want to remove Docker volumes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  docker-compose down -v
  echo "Volumes removed."
fi

read -p "Do you want to remove Docker images? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  docker rmi $(docker images -q ai-chat-api)
  echo "Images removed."
fi