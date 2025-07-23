#!/bin/bash

echo "Setting up Netflix Movie Tool..."

# Function to check if Docker is installed
check_docker_installed() {
    if command -v docker &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to install Docker
install_docker() {
    echo "Docker is not installed. Installing Docker..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Please download and install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        echo "After installation, run this script again."
        exit 1
    # Ubuntu/Debian
    elif [ -f /etc/debian_version ]; then
        echo "Installing Docker on Ubuntu/Debian..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo "Docker installed. Please log out and back in, then run this script again."
        exit 0
    # RHEL/CentOS/Fedora
    elif [ -f /etc/redhat-release ]; then
        echo "Installing Docker on RHEL/CentOS/Fedora..."
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        echo "Docker installed. Please log out and back in, then run this script again."
        exit 0
    else
        echo "Unsupported OS for automatic Docker installation."
        echo "Please install Docker manually from: https://docs.docker.com/get-docker/"
        exit 1
    fi
}

# Check if Docker is installed
if ! check_docker_installed; then
    install_docker
fi

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
    elif command -v systemctl > /dev/null 2>&1; then
        sudo systemctl start docker
        sleep 2
        if docker info > /dev/null 2>&1; then
            echo "Docker is running!"
            return 0
        fi
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

# Check if Docker is running
echo "Checking if Docker is running..."
if check_docker_running; then
    echo "Docker is already running"
else
    if ! start_docker; then
        exit 1
    fi
fi

# Function to check if PostgreSQL is running
check_postgres_running() {
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "movie_db.*Up"
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
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

# Function to check if tables exist
check_tables_exist() {
    local container_name="movie_db"
    
    # Check for movies table
    docker exec $container_name psql -U postgres -d movies -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movies');" 2>/dev/null | grep -q 't'
    local movies_exists=$?
    
    # Check for drive_change_tokens table
    docker exec $container_name psql -U postgres -d movies -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drive_change_tokens');" 2>/dev/null | grep -q 't'
    local tokens_exists=$?
    
    if [ $movies_exists -eq 0 ] && [ $tokens_exists -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

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

# Check if tables exist
echo "Checking if database tables exist..."
if check_tables_exist; then
    echo "All required tables already exist"
else
    echo "Creating database tables..."
    
    # Get container name
    container_name="movie_db"
    
    # Execute init.sql to create tables
    if [ -f "database/init.sql" ]; then
        docker exec -i $container_name psql -U postgres -d movies < database/init.sql
        
        # Verify tables were created
        if check_tables_exist; then
            echo "Database tables created successfully"
        else
            echo "Failed to create database tables"
            exit 1
        fi
    else
        echo "database/init.sql not found"
        exit 1
    fi
fi

# Check if Python is installed
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version 2>&1)
    echo "Python is installed: $python_version"
else
    echo "Python3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

# Setup crawler dependencies
echo ""
echo "Setting up crawler dependencies..."
cd crawler
if [ ! -d "venv" ]; then
    echo "Creating virtual environment for crawler..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
deactivate
cd ..
echo "Crawler dependencies installed"

# Setup API dependencies
echo ""
echo "Setting up API dependencies..."
cd api
if [ ! -d "venv" ]; then
    echo "Creating virtual environment for API..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
deactivate
cd ..
echo "API dependencies installed"

# Setup Frontend dependencies
echo ""
echo "Setting up Frontend dependencies..."
cd frontend
npm install > /dev/null 2>&1
cd ..
echo "Frontend dependencies installed"

echo ""
echo "Setup complete!"
echo "----------------------------------------"
echo ""
echo "Next steps:"
echo ""
echo "1. Run the crawler (optional, can take time):"
echo "   cd crawler"
echo "   source venv/bin/activate"
echo "   export DATABASE_URL='postgresql://postgres:password@localhost:5432/movies'"
echo "   python crawl_google_drive.py"
echo ""
echo "2. Start the application:"
echo "   ./run.sh"
echo ""
echo "Note: Make sure you have service-account.json in the crawler directory before running the crawler."
echo ""