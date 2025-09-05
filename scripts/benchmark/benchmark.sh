#!/bin/bash

# 🔥 GEOGUSSERX BENCHMARK SCRIPT 🔥
# Merged enhanced + extreme benchmarks with figlet ASCII art
# Usage: ./benchmark.sh [normal|hard|insane|nuclear|extreme|godmode|--help|-h]

# Find project root directory
find_project_root() {
    local current_dir="$(pwd)"
    local search_dir="$current_dir"
    
    # Look for package.json to identify project root
    while [ "$search_dir" != "/" ]; do
        if [ -f "$search_dir/package.json" ] && grep -q "geogusserx\|GeoGusserX" "$search_dir/package.json" 2>/dev/null; then
            echo "$search_dir"
            return 0
        fi
        search_dir="$(dirname "$search_dir")"
    done
    
    # If not found, check if we're already in project root
    if [ -f "package.json" ] && grep -q "geogusserx\|GeoGusserX" "package.json" 2>/dev/null; then
        echo "$(pwd)"
        return 0
    fi
    
    return 1
}

# Change to project root
PROJECT_ROOT=$(find_project_root)
if [ $? -ne 0 ] || [ -z "$PROJECT_ROOT" ]; then
    echo "❌ ERROR: Could not find GeoGusserX project root directory."
    echo "   Please run this script from within the GeoGusserX project."
    exit 1
fi

cd "$PROJECT_ROOT" || {
    echo "❌ ERROR: Could not change to project root: $PROJECT_ROOT"
    exit 1
}

echo "✅ Working from project root: $PROJECT_ROOT"

MODE=${1:-normal}
LOG_FILE="scripts/benchmark/benchmark_logs_${MODE}.txt"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HOSTNAME=$(hostname)
CPU_INFO=$(lscpu | grep "Model name" | cut -d: -f2 | xargs 2>/dev/null || echo "Unknown CPU")
MEMORY_INFO=$(free -h | grep "Mem:" | awk '{print $2}' 2>/dev/null || echo "Unknown")

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to show comprehensive help
show_help() {
    echo -e "${CYAN}🔥 GeoGusserX Benchmark Script 🔥${NC}"
    echo ""
    echo -e "${BOLD}USAGE:${NC}"
    echo "  ./scripts/benchmark/benchmark.sh [MODE] [OPTIONS]"
    echo "  ./benchmark.sh [MODE] [OPTIONS]  # if symlinked to root"
    echo ""
    echo -e "${BOLD}MODES:${NC}"
    echo -e "  ${GREEN}normal${NC}   - Standard benchmarks (1k-100k iterations)"
    echo -e "             Quick tests for development and CI"
    echo ""
    echo -e "  ${YELLOW}hard${NC}     - Intensive benchmarks (up to 500k iterations)"
    echo -e "             More thorough performance testing"
    echo ""
    echo -e "  ${PURPLE}insane${NC}   - CPU stress tests (up to 2.5M iterations)"
    echo -e "             Heavy load testing for performance analysis"
    echo ""
    echo -e "  ${RED}nuclear${NC}  - System torture tests (up to 20M iterations)"
    echo -e "             Extreme stress testing for stability"
    echo ""
    echo -e "  ${RED}extreme${NC}  - Ultimate stress tests (up to 25M iterations)"
    echo -e "             Maximum performance and stability testing"
    echo ""
    echo -e "  ${WHITE}${BOLD}godmode${NC}  - MAXIMUM DESTRUCTION (50M iterations)"
    echo -e "             ⚠️  WARNING: Will push your system to absolute limits!"
    echo ""
    echo -e "${BOLD}OPTIONS:${NC}"
    echo -e "  ${CYAN}--help, -h${NC}    Show this help message"
    echo ""
    echo -e "${BOLD}EXAMPLES:${NC}"
    echo "  ./scripts/benchmark/benchmark.sh normal     # Run standard tests"
    echo "  ./scripts/benchmark/benchmark.sh hard       # Run intensive tests"
    echo "  ./scripts/benchmark/benchmark.sh --help     # Show this help"
    echo ""
    echo -e "${BOLD}SYSTEM REQUIREMENTS:${NC}"
    echo -e "  ${CYAN}•${NC} Node.js 20+ with pnpm or bun"
    echo -e "  ${CYAN}•${NC} At least 4GB RAM (8GB+ recommended for extreme modes)"
    echo -e "  ${CYAN}•${NC} Good CPU cooling (especially for nuclear/extreme/godmode)"
    echo -e "  ${CYAN}•${NC} Sufficient disk space for log files"
    echo ""
    echo -e "${BOLD}OUTPUT:${NC}"
    echo -e "  Results are saved to: ${YELLOW}scripts/benchmark/benchmark_logs_[MODE].txt${NC}"
    echo -e "  Real-time progress is shown in the terminal"
    echo ""
    echo -e "${BOLD}NOTES:${NC}"
    echo -e "  ${YELLOW}•${NC} Press CTRL+C to cancel at any time"
    echo -e "  ${YELLOW}•${NC} Each benchmark has a 1-hour timeout"
    echo -e "  ${YELLOW}•${NC} System stats are collected before/after each test"
    echo -e "  ${YELLOW}•${NC} Extreme modes include countdown warnings"
    echo ""
    echo -e "${RED}⚠️  WARNING:${NC} Extreme modes (nuclear/extreme/godmode) will heavily stress your system!"
    echo -e "${RED}⚠️  WARNING:${NC} Ensure adequate cooling and power supply before running!"
    echo ""
}

# Function to ensure benchmark directory exists and log file can be created
ensure_log_directory() {
    local log_dir=$(dirname "$LOG_FILE")
    
    # Create directory if it doesn't exist
    if [ ! -d "$log_dir" ]; then
        echo -e "${YELLOW}📁 Creating benchmark directory: $log_dir${NC}"
        if ! mkdir -p "$log_dir" 2>/dev/null; then
            echo -e "${RED}❌ ERROR: Cannot create directory $log_dir${NC}"
            echo -e "${RED}   Please check permissions and try again.${NC}"
            exit 1
        fi
    fi
    
    # Test if we can write to the log file
    if ! touch "$LOG_FILE" 2>/dev/null; then
        echo -e "${RED}❌ ERROR: Cannot create log file $LOG_FILE${NC}"
        echo -e "${RED}   Please check permissions and disk space.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Log file ready: $LOG_FILE${NC}"
}

# Function to validate system requirements
validate_requirements() {
    local missing_deps=()
    
    # Check for Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("Node.js")
    fi
    
    # Check for npm or pnpm or bun
    if ! command -v npm >/dev/null 2>&1 && ! command -v pnpm >/dev/null 2>&1 && ! command -v bun >/dev/null 2>&1; then
        missing_deps+=("npm/pnpm/bun")
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ ERROR: package.json not found${NC}"
        echo -e "${RED}   Please run this script from the project root directory.${NC}"
        exit 1
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ ERROR: Missing required dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "${RED}   - $dep${NC}"
        done
        echo -e "${YELLOW}   Please install the missing dependencies and try again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ System requirements validated${NC}"
}

# Check if figlet is available
if command -v figlet >/dev/null 2>&1; then
    HAS_FIGLET=true
else
    HAS_FIGLET=false
fi

# Function to display title with figlet or fallback
show_title() {
    local title="$1"
    local color="$2"

    echo -e "${color}"
    if [ "$HAS_FIGLET" = true ]; then
        figlet -f big "$title" 2>/dev/null || figlet "$title" 2>/dev/null || echo "=== $title ==="
    else
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                    $title                    ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
    fi
    echo -e "${NC}"
}

# Function to show epic header
show_epic_header() {
    clear
    echo -e "${PURPLE}"
    if [ "$HAS_FIGLET" = true ]; then
        figlet -f slant "GeoGusserX" 2>/dev/null || figlet "GeoGusserX"
        echo ""
        figlet -f small "BENCHMARK" 2>/dev/null || figlet "BENCHMARK"
    else
    cat << "EOF"
_____ ______ ____   _____ _    _  _____ _____ ______ _______   __
/ ____|  ____/ __ \ / ____| |  | |/ ____/ ____|  ____|  __ \ \ / /
| |  __| |__ | |  | | |  __| |  | | (___| (___ | |__  | |__) \ V /
| | |_ |  __|| |  | | | |_ | |  | |\___ \\___ \|  __| |  _  / > <
| |__| | |___| |__| | |__| | |__| |____) |___) | |____| | \ \/ . \
\_____|______\____/ \_____|\____/|_____/_____/|______|_|  \_/_/ \_\

_    _ _   _______ _____ __  __       _______ ______   ______ _______ _____
| |  | | | |__   __|_   _|  \/  |   /\|__   __|  ____| |  ____|__   __/ ____|
| |  | | |    | |    | | | \  / |  /  \  | |  | |__    | |__     | | | (___
| |  | | |    | |    | | | |\/| | / /\ \ | |  |  __|   |  __|    | |  \___ \
| |__| | |____| |   _| |_| |  | |/ ____ \| |  | |____  | |____   | |  ____) |
\____/|______|_|  |_____|_|  |_/_/    \_\_|  |______| |______|  |_| |_____/
EOF
fi
    echo -e "${NC}"
}

# Function to show system info
show_system_info() {
    echo -e "${CYAN}🖥️  System Information:${NC}"
    echo -e "${CYAN}   CPU: $CPU_INFO${NC}"
    echo -e "${CYAN}   Memory: $MEMORY_INFO${NC}"
    echo -e "${CYAN}   Hostname: $HOSTNAME${NC}"
    echo -e "${CYAN}   Mode: $MODE${NC}"
    echo ""
}

# Function to show progress bar
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))

    printf "\r${BLUE}Progress: ["
    printf "%*s" $filled | tr ' ' '='
    printf "%*s" $((width - filled)) | tr ' ' '-'
    printf "] %d%% (%d/%d)${NC}" $percentage $current $total
}

# Initialize log file with epic header
init_log_file() {
    if ! cat > "$LOG_FILE" << EOF
🔥🔥🔥 GEOGUSSERX BENCHMARK RESULTS 🔥🔥🔥
═══════════════════════════════════════════════════════════════
Generated on: $TIMESTAMP
Hostname: $HOSTNAME
CPU: $CPU_INFO
Memory: $MEMORY_INFO
Mode: $MODE
═══════════════════════════════════════════════════════════════

EOF
    then
        echo -e "${RED}❌ ERROR: Failed to initialize log file $LOG_FILE${NC}"
        echo -e "${RED}   Please check permissions and disk space.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Log file initialized successfully${NC}"
}

# Function to run command and log output with style
run_and_log() {
    local description="$1"
    local command="$2"
    local emoji="$3"
    local color="$4"

    echo -e "${color}${emoji} Running: $description${NC}"
    echo "Starting: $(date '+%H:%M:%S')"

    cat >> "$LOG_FILE" << EOF

$emoji $description
Command: $command
Started: $(date '+%Y-%m-%d %H:%M:%S')
═══════════════════════════════════════════════════════════════
EOF

    # Capture start time for duration calculation
    local start_time=$(date +%s.%N)

    # Run the command and capture both stdout and stderr
    if timeout 3600 bash -c "$command" >> "$LOG_FILE" 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
        echo -e "${GREEN}✅ $description completed successfully in ${duration}s${NC}"
        echo "Completed: $(date '+%Y-%m-%d %H:%M:%S') (Duration: ${duration}s)" >> "$LOG_FILE"
    else
        local exit_code=$?
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
        if [ $exit_code -eq 124 ]; then
            echo -e "${YELLOW}⏰ $description timed out after 1 hour${NC}"
            echo "TIMEOUT: Command timed out after 1 hour" >> "$LOG_FILE"
        else
            echo -e "${RED}❌ $description failed with exit code $exit_code${NC}"
            echo "ERROR: Command failed with exit code $exit_code" >> "$LOG_FILE"
        fi
        echo "Failed: $(date '+%Y-%m-%d %H:%M:%S') (Duration: ${duration}s)" >> "$LOG_FILE"
    fi

    echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Add system stats after each benchmark
    echo "System Stats After Benchmark:" >> "$LOG_FILE"
    echo "Memory Usage: $(free -h | grep Mem | awk '{print $3 "/" $2}' 2>/dev/null || echo 'N/A')" >> "$LOG_FILE"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}' 2>/dev/null || echo 'N/A')" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Function to show mode-specific warnings and info
show_mode_info() {
    case $MODE in
        "normal")
            show_title "NORMAL MODE" "$BLUE"
            echo -e "${BLUE}🚀 Running standard benchmarks (1k-100k iterations)${NC}"
            ;;
        "hard")
            show_title "HARD MODE" "$YELLOW"
            echo -e "${YELLOW}💪 Running intensive benchmarks (up to 500k iterations)${NC}"
            echo -e "${YELLOW}⚠️  This may take several minutes...${NC}"
            ;;
        "insane")
            show_title "INSANE MODE" "$PURPLE"
            echo -e "${PURPLE}🔥 Running CPU stress tests (up to 2.5M iterations)${NC}"
            ;;
        "nuclear")
            show_title "NUCLEAR MODE" "$RED"
            echo -e "${RED}☢️  Running system torture tests (up to 20M iterations)${NC}"
            echo -e "${YELLOW}Press CTRL+C within 10 seconds to cancel...${NC}"
            for i in {10..1}; do
                echo -ne "\r${YELLOW}Starting in $i seconds... ${NC}"
                sleep 1
            done
            echo ""
            ;;
        "extreme")
            show_title "EXTREME MODE" "$RED"
            echo -e "${RED}💀 Running EXTREME stress tests (up to 25M iterations)${NC}"
            echo -e "${RED}⚠️  WARNING: This will push your system to its ABSOLUTE LIMITS!${NC}"
            echo -e "${RED}⚠️  Estimated time: 1-3 HOURS depending on your hardware!${NC}"
            echo -e "${YELLOW}Press CTRL+C within 15 seconds to cancel...${NC}"
            for i in {15..1}; do
                echo -ne "\r${YELLOW}Starting in $i seconds... ${NC}"
                sleep 1
            done
            echo ""
            ;;
        "godmode")
            show_title "GOD MODE" "$WHITE"
            echo -e "${WHITE}${BOLD}👹 ENTERING GOD MODE - MAXIMUM DESTRUCTION${NC}"
            echo -e "${RED}${BOLD}⚠️  DANGER: This will run 50 MILLION iterations!${NC}"
            echo -e "${RED}${BOLD}⚠️  Your CPU will literally melt! Estimated time: 3-6 HOURS!${NC}"
            echo -e "${RED}${BOLD}⚠️  Make sure you have excellent cooling and aren't on battery!${NC}"
            echo -e "${YELLOW}${BOLD}Last chance to escape! Press CTRL+C within 20 seconds...${NC}"
            for i in {20..1}; do
                echo -ne "\r${RED}${BOLD}GODMODE starting in $i seconds... ${NC}"
                sleep 1
            done
            echo ""
            echo -e "${RED}${BOLD}🔥 MAY THE ODDS BE EVER IN YOUR FAVOR! 🔥${NC}"
            ;;
        *)
            echo -e "${RED}❌ ERROR: Invalid mode '$MODE'${NC}"
            echo ""
            echo -e "${BOLD}Valid modes are:${NC}"
            echo -e "  ${GREEN}normal${NC}   - Standard benchmarks (1k-100k iterations)"
            echo -e "  ${YELLOW}hard${NC}     - Intensive benchmarks (up to 500k iterations)"
            echo -e "  ${PURPLE}insane${NC}   - CPU stress tests (up to 2.5M iterations)"
            echo -e "  ${RED}nuclear${NC}  - System torture tests (up to 20M iterations)"
            echo -e "  ${RED}extreme${NC}  - Ultimate stress tests (up to 25M iterations)"
            echo -e "  ${WHITE}${BOLD}godmode${NC}  - MAXIMUM DESTRUCTION (50M iterations)"
            echo ""
            echo -e "${CYAN}Usage: $0 [MODE] [--help|-h]${NC}"
            echo -e "${CYAN}Example: $0 normal${NC}"
            echo -e "${CYAN}Help: $0 --help${NC}"
            exit 1
            ;;
    esac
}

# Define benchmark configurations
declare -A benchmarks

# Normal mode benchmarks
benchmarks["normal"]="
Quick benchmark (1k iterations)|npm run test:algorithm|🚀|$BLUE
Full benchmark (10k iterations)|npm run test:algorithm:full|💪|$BLUE
Country lookup tests (1k per country)|npm run test:algorithm:countries|🌍|$GREEN
Scalability (100k iterations)|npm run test:algorithm:scale|📈|$CYAN
"

# Hard mode benchmarks
benchmarks["hard"]="
Quick benchmark (1k iterations)|npm run test:algorithm|🚀|$BLUE
Full benchmark (10k iterations)|npm run test:algorithm:full|💪|$BLUE
Country lookup tests (1k per country)|npm run test:algorithm:countries|🌍|$GREEN
Scalability (100k iterations)|npm run test:algorithm:scale|📈|$CYAN
Hard: 500k iterations|bun scripts/algorithm-benchmark.mjs scale --iter 500000|🔥|$YELLOW
Hard: Country stress (5k per country)|bun scripts/algorithm-benchmark.mjs countries --iter 5000|🌎|$YELLOW
"

# Insane mode benchmarks
benchmarks["insane"]="
Quick benchmark (1k iterations)|npm run test:algorithm|🚀|$BLUE
Full benchmark (10k iterations)|npm run test:algorithm:full|💪|$BLUE
Country lookup tests (1k per country)|npm run test:algorithm:countries|🌍|$GREEN
Scalability (100k iterations)|npm run test:algorithm:scale|📈|$CYAN
Insane: 1 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 1000000|🔥|$PURPLE
Insane: 2.5 Million iterations|bun scripts/algorithm-benchmark.mjs full --iter 2500000|⚡|$PURPLE
Insane: Country mega test (10k per country)|bun scripts/algorithm-benchmark.mjs countries --iter 10000|🌎|$PURPLE
"

# Nuclear mode benchmarks
benchmarks["nuclear"]="
Quick benchmark (1k iterations)|npm run test:algorithm|🚀|$BLUE
Full benchmark (10k iterations)|npm run test:algorithm:full|💪|$BLUE
Country lookup tests (1k per country)|npm run test:algorithm:countries|🌍|$GREEN
Scalability (100k iterations)|npm run test:algorithm:scale|📈|$CYAN
Nuclear: 5 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 5000000|☢️|$RED
Nuclear: 10 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 10000000|💀|$RED
Nuclear: 15 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 15000000|🧠|$RED
Nuclear: Final boss (20M iterations)|bun scripts/algorithm-benchmark.mjs scale --iter 20000000|👹|$RED
"

# Extreme mode benchmarks
benchmarks["extreme"]="
Quick warmup (1k iterations)|npm run test:algorithm|🔥|$YELLOW
Standard benchmark (10k iterations)|npm run test:algorithm:full|💪|$BLUE
Country lookup stress test (1k per country)|npm run test:algorithm:countries|🌍|$GREEN
Scalability test (100k iterations)|npm run test:algorithm:scale|📈|$CYAN
EXTREME: 1 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 1000000|🚀|$RED
EXTREME: 5 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 5000000|💀|$PURPLE
EXTREME: 10 Million iterations|bun scripts/algorithm-benchmark.mjs scale --iter 10000000|☢️|$RED
Custom mega test (2.5M iterations)|bun scripts/algorithm-benchmark.mjs full --iter 2500000|⚡|$YELLOW
Country stress test (10k per country)|bun scripts/algorithm-benchmark.mjs countries --iter 10000|🌎|$GREEN
Memory pressure test (15M iterations)|bun scripts/algorithm-benchmark.mjs scale --iter 15000000|🧠|$BLUE
CPU melter (20M iterations)|bun scripts/algorithm-benchmark.mjs scale --iter 20000000|🔥|$RED
Final boss (25M iterations)|bun scripts/algorithm-benchmark.mjs scale --iter 25000000|👹|$PURPLE
"

# God mode benchmarks (THE ULTIMATE TEST)
benchmarks["godmode"]="
Warmup (1k iterations)|npm run test:algorithm|🔥|$YELLOW
Standard (10k iterations)|npm run test:algorithm:full|💪|$BLUE
Country test (1k per country)|npm run test:algorithm:countries|🌍|$GREEN
Scalability (100k iterations)|npm run test:algorithm:scale|📈|$CYAN
Level 1: 1M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 1000000|🚀|$RED
Level 2: 5M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 5000000|💀|$PURPLE
Level 3: 10M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 10000000|☢️|$RED
Level 4: 15M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 15000000|🧠|$BLUE
Level 5: 20M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 20000000|🔥|$RED
Level 6: 25M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 25000000|👹|$PURPLE
Level 7: 30M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 30000000|🌋|$RED
Level 8: 40M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 40000000|💥|$PURPLE
GODMODE: 50M iterations|bun scripts/algorithm-benchmark.mjs scale --iter 50000000|👹|$WHITE
"

# Check for help flag after functions are defined
if [[ "$1" == "--help" || "$1" == "-h" || "$1" == "help" ]]; then
    show_help
    exit 0
fi

# Main execution
show_epic_header

# Validate system requirements first
echo -e "${CYAN}🔍 Validating system requirements...${NC}"
validate_requirements
echo ""

# Ensure log directory exists and is writable
echo -e "${CYAN}📁 Setting up logging...${NC}"
ensure_log_directory
echo ""

# Initialize the log file
init_log_file
echo ""

show_system_info
show_mode_info

echo ""
echo "Starting benchmark runs..."
echo ""

# Get benchmarks for current mode
current_benchmarks="${benchmarks[$MODE]}"
if [ -z "$current_benchmarks" ]; then
    echo -e "${RED}No benchmarks defined for mode: $MODE${NC}"
    exit 1
fi

# Convert benchmarks string to array
IFS=$'\n' read -rd '' -a benchmark_array <<< "$current_benchmarks"

# Filter out empty lines
filtered_benchmarks=()
for benchmark in "${benchmark_array[@]}"; do
    if [[ -n "$benchmark" && "$benchmark" != *"|" ]]; then
        filtered_benchmarks+=("$benchmark")
    fi
done

total_benchmarks=${#filtered_benchmarks[@]}
current_benchmark=0

echo -e "${CYAN}Total benchmarks to run: $total_benchmarks${NC}"
echo ""

# Run each benchmark
for benchmark in "${filtered_benchmarks[@]}"; do
    IFS='|' read -r description command emoji color <<< "$benchmark"
    ((current_benchmark++))

    show_progress $current_benchmark $total_benchmarks
    echo ""

    run_and_log "$description" "$command" "$emoji" "$color"

    # No cooldown needed - let's keep things moving!
    if [ $current_benchmark -lt $total_benchmarks ]; then
        echo ""
    fi
done

# Final system stats
echo "" >> "$LOG_FILE"
echo "🏁 FINAL SYSTEM STATISTICS 🏁" >> "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"
echo "Benchmark completed: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "Total duration: $(($(date +%s) - $(date -d "$TIMESTAMP" +%s))) seconds" >> "$LOG_FILE"
echo "Final memory usage: $(free -h | grep Mem | awk '{print $3 "/" $2}' 2>/dev/null || echo 'N/A')" >> "$LOG_FILE"
echo "Final load average: $(uptime | awk -F'load average:' '{print $2}' 2>/dev/null || echo 'N/A')" >> "$LOG_FILE"
# Safely get CPU temperature if available
if command -v sensors >/dev/null 2>&1; then
    cpu_temp=$(sensors 2>/dev/null | grep -i temp | head -1 || echo 'N/A')
    echo "CPU temperature (if available): $cpu_temp" >> "$LOG_FILE"
else
    echo "CPU temperature: Not available (sensors command not found)" >> "$LOG_FILE"
fi
echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"

echo ""
show_title "COMPLETE" "$GREEN"
echo -e "${GREEN}🎉 ALL BENCHMARKS COMPLETED! 🎉${NC}"
echo -e "${GREEN}🔥 Your system survived the $MODE test! 🔥${NC}"
echo ""
echo -e "${CYAN}📊 Results saved to: $LOG_FILE${NC}"
echo -e "${CYAN}📈 File size: $(du -h "$LOG_FILE" | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}To view the results:${NC}"
echo -e "${YELLOW}  cat $LOG_FILE${NC}"
echo -e "${YELLOW}  less $LOG_FILE${NC}"
echo -e "${YELLOW}  tail -f $LOG_FILE${NC}"
echo ""

# Show final system stats
echo -e "${CYAN}🖥️  Final System Stats:${NC}"
echo -e "${CYAN}   Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}' 2>/dev/null || echo 'N/A')${NC}"
echo -e "${CYAN}   Load: $(uptime | awk -F'load average:' '{print $2}' 2>/dev/null || echo 'N/A')${NC}"
echo -e "${CYAN}   Uptime: $(uptime | awk '{print $3,$4}' | sed 's/,//' 2>/dev/null || echo 'N/A')${NC}"

echo ""
echo -e "${BLUE}💡 Available modes:${NC}"
echo -e "${BLUE}   normal   # Standard tests (1k-100k)${NC}"
echo -e "${BLUE}   hard     # Intensive tests (up to 500k)${NC}"
echo -e "${BLUE}   insane   # CPU stress (up to 2.5M)${NC}"
echo -e "${BLUE}   nuclear  # System torture (up to 20M)${NC}"
echo -e "${BLUE}   extreme  # Ultimate test (up to 25M)${NC}"
echo -e "${RED}   godmode  # MAXIMUM DESTRUCTION (50M) ⚠️${NC}"

echo ""
if [ "$MODE" != "godmode" ]; then
    echo -e "${PURPLE}🔥 Ready for the next level? Try a harder mode! 🔥${NC}"
else
    echo -e "${WHITE}${BOLD}👑 CONGRATULATIONS! YOU ARE THE BENCHMARK GOD! 👑${NC}"
fi
