#!/bin/bash

# Firebase Emulator Management Script
# Usage: ./scripts/firebase-emulator.sh [start|stop|reset|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
EMULATOR_DATA_DIR="$FRONTEND_DIR/firebase-emulator-data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if emulator is running
is_emulator_running() {
    if pgrep -f "firebase.*emulators:start" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start emulator
start_emulator() {
    print_status "Starting Firebase emulator with persistence..."

    cd "$FRONTEND_DIR" || {
        print_error "Could not change to frontend directory: $FRONTEND_DIR"
        exit 1
    }

    if is_emulator_running; then
        print_warning "Firebase emulator is already running!"
        print_status "Use './scripts/firebase-emulator.sh status' to check details"
        return 0
    fi

    # Create emulator data directory if it doesn't exist
    mkdir -p "$EMULATOR_DATA_DIR"

    print_status "Data will be persisted in: $EMULATOR_DATA_DIR"
    print_status "Starting emulator..."

    # Start emulator with import/export
    if [ -d "$EMULATOR_DATA_DIR" ] && [ "$(ls -A "$EMULATOR_DATA_DIR" 2>/dev/null)" ]; then
        print_status "Found existing emulator data, importing..."
        firebase emulators:start --import="$EMULATOR_DATA_DIR" --export-on-exit="$EMULATOR_DATA_DIR"
    else
        print_status "No existing data found, starting fresh..."
        firebase emulators:start --export-on-exit="$EMULATOR_DATA_DIR"
    fi
}

# Function to stop emulator
stop_emulator() {
    print_status "Stopping Firebase emulator..."

    if ! is_emulator_running; then
        print_warning "Firebase emulator is not running!"
        return 0
    fi

    # Find and kill the firebase emulator process
    pkill -f "firebase.*emulators:start"

    # Wait a moment for graceful shutdown
    sleep 2

    if is_emulator_running; then
        print_warning "Emulator still running, forcing stop..."
        pkill -9 -f "firebase.*emulators:start"
    fi

    print_success "Firebase emulator stopped"
    print_status "Data has been exported to: $EMULATOR_DATA_DIR"
}

# Function to reset emulator data
reset_emulator() {
    print_warning "This will delete all emulator data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if is_emulator_running; then
            print_error "Please stop the emulator first: ./scripts/firebase-emulator.sh stop"
            exit 1
        fi

        print_status "Removing emulator data..."
        rm -rf "$EMULATOR_DATA_DIR"
        print_success "Emulator data reset complete"
    else
        print_status "Reset cancelled"
    fi
}

# Function to show emulator status
show_status() {
    print_status "Firebase Emulator Status"
    echo "========================="

    if is_emulator_running; then
        print_success "Emulator is RUNNING"
        echo
        print_status "Available services:"
        echo "  - Firestore: http://localhost:8088"
        echo "  - Authentication: http://localhost:9099"
        echo "  - Emulator UI: http://localhost:4000"
        echo
        print_status "Data directory: $EMULATOR_DATA_DIR"

        if [ -d "$EMULATOR_DATA_DIR" ]; then
            data_size=$(du -sh "$EMULATOR_DATA_DIR" 2>/dev/null | cut -f1)
            print_status "Data size: $data_size"
        fi
    else
        print_warning "Emulator is NOT RUNNING"
        echo
        print_status "To start: ./scripts/firebase-emulator.sh start"
    fi

    echo
    print_status "Persistent data location: $EMULATOR_DATA_DIR"
    if [ -d "$EMULATOR_DATA_DIR" ] && [ "$(ls -A "$EMULATOR_DATA_DIR" 2>/dev/null)" ]; then
        print_success "Persistent data exists"
    else
        print_warning "No persistent data found"
    fi
}

# Main script logic
case "$1" in
    start)
        start_emulator
        ;;
    stop)
        stop_emulator
        ;;
    reset)
        reset_emulator
        ;;
    status)
        show_status
        ;;
    restart)
        print_status "Restarting Firebase emulator..."
        stop_emulator
        sleep 2
        start_emulator
        ;;
    *)
        echo "Firebase Emulator Management"
        echo "Usage: $0 {start|stop|restart|reset|status}"
        echo
        echo "Commands:"
        echo "  start   - Start emulator with persistence"
        echo "  stop    - Stop emulator and export data"
        echo "  restart - Stop and start emulator"
        echo "  reset   - Delete all emulator data"
        echo "  status  - Show emulator status"
        echo
        echo "Data is automatically persisted in:"
        echo "  $EMULATOR_DATA_DIR"
        exit 1
        ;;
esac
