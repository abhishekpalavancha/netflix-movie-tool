echo "Starting Netflix Movie Tool..."

# Function to check if Docker is running
check_docker_running() {
    if docker info > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start Docker
start_docker() {
    echo "Starting Docker..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker
        echo "Waiting for Docker to start..."
        for i in {1..30}; do
            if docker info > /dev/null 2>&1; then
                echo "Docker is running!"
                return 0
            fi
            echo -n "."
            sleep 2
        done
    # Linux with systemd
    elif command -v systemctl > /dev/null 2>&1; then
        sudo systemctl start docker
        sleep 2
        if docker info > /dev/null 2>&1; then
            echo "Docker is running!"
            return 0
        fi
    # Linux with service command
    elif command -v service > /dev/null 2>&1; then
        sudo service docker start
        sleep 2
        if docker info > /dev/null 2>&1; then
            echo "Docker is running!"
            return 0
        fi
    fi
    
    echo ""
    echo "Failed to start Docker. Please start Docker manually and run this script again."
    return 1
}

# Function to check if PostgreSQL is running
check_postgres_running() {
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "movie_db.*Up"
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec movie_db pg_isready -U postgres > /dev/null 2>&1; then
            echo "PostgreSQL is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    echo "PostgreSQL failed to start within 60 seconds"
    return 1
}

# Function to verify all components are ready
verify_prerequisites() {
    echo "Verifying prerequisites..."
    
    # Check if setup.sh was run
    if [ ! -d "api/venv" ] || [ ! -d "crawler/venv" ] || [ ! -d "frontend/node_modules" ]; then
        echo "Dependencies not installed. Please run ./setup.sh first"
        exit 1
    fi
    
    # Check if API requirements are met
    if [ ! -f "api/requirements.txt" ]; then
        echo "API requirements.txt not found"
        return 1
    fi
    
    # Check if frontend package.json exists
    if [ ! -f "frontend/package.json" ]; then
        echo "Frontend package.json not found"
        return 1
    fi
    
    echo "All prerequisites verified!"
    return 0
}

# Function to open new terminal and run command
open_new_terminal() {
    local title="$1"
    local command="$2"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "
        tell application \"Terminal\"
            do script \"cd '$PWD' && $command\"
            set custom title of front window to \"$title\"
        end tell"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$title" -- bash -c "cd '$PWD' && $command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$title" -e "cd '$PWD' && $command; bash" &
        elif command -v konsole &> /dev/null; then
            konsole --title "$title" -e "cd '$PWD' && $command; bash" &
        else
            echo "No supported terminal found. Please run manually:"
            echo "   $command"
        fi
    else
        echo "Unsupported OS. Please run manually:"
        echo "   $command"
    fi
}

# Verify prerequisites
if ! verify_prerequisites; then
    exit 1
fi

# Check if Docker is running
echo "Checking if Docker is running..."
if check_docker_running; then
    echo "Docker is already running"
else
    if ! start_docker; then
        exit 1
    fi
fi

# Check if PostgreSQL is running
echo "Checking if PostgreSQL is running..."
if check_postgres_running; then
    echo "PostgreSQL is already running"
else
    echo "Starting PostgreSQL database..."
    cd database
    docker-compose up -d
    cd ..
fi

# Wait for database to be ready
if ! wait_for_postgres; then
    echo "Failed to start PostgreSQL. Exiting..."
    exit 1
fi

# Start API and Frontend
echo "Starting services..."

# Start API
echo "Starting API server in new terminal..."
# Use the POSTGRES_PASSWORD environment variable in the connection string
api_command="cd api && source venv/bin/activate && export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/movies' && python -m uvicorn main:app --reload"
open_new_terminal "Netflix Movie Tool - API" "$api_command"

# Give API a moment to start
sleep 3

# Start Frontend
echo "Starting Frontend in new terminal..."
frontend_command="cd frontend && npm run start"
open_new_terminal "Netflix Movie Tool - Frontend" "$frontend_command"