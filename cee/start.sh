echo "Starting Docker daemon..."
dockerd &

# # Give some time for the Docker daemon to initialize
# echo "Waiting for Docker daemon to initialize..."
# sleep 10

# Check if the Docker daemon has finished initializing
while true; do
    docker info &>/dev/null
    if [ $? -eq 0 ]; then
        echo "Docker daemon has finished initializing."
        break
    else
        echo "Waiting for Docker daemon to initialize..."
        sleep 1
    fi
done

# Run your executable "app" here
echo "Running app..."
/app

echo "Script execution completed."
