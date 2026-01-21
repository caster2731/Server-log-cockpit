import argparse
import sys
import os
from log_parser import parse_log_line
from analyzer import LogAnalyzer
from display import display_report

def main():
    parser = argparse.ArgumentParser(description="Nginx Access Log Analyzer")
    parser.add_argument("logfile", help="Path to the nginx access log file")
    args = parser.parse_args()

    if not os.path.exists(args.logfile):
        print(f"Error: File '{args.logfile}' not found.")
        sys.exit(1)

    analyzer = LogAnalyzer()
    
    print(f"Analyzing {args.logfile}...")
    
    try:
        with open(args.logfile, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                record = parse_log_line(line)
                if record:
                    analyzer.process_record(record)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    stats = analyzer.get_statistics()
    display_report(stats)

if __name__ == "__main__":
    main()
