import re
import datetime

# Nginx default 'combined' log format regex
# Log Example: 127.0.0.1 - - [21/Jan/2026:13:14:04 +0900] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0"
LOG_PATTERN = re.compile(
    r'(?P<ip>[\d\.]+) - - \[(?P<time>.*?)\] "(?P<request>.*?)" (?P<status>\d+) (?P<bytes>\d+) "(?P<referer>.*?)" "(?P<user_agent>.*?)"'
)

def parse_log_line(line):
    """
    Parses a single line of Nginx access log.
    Returns a dictionary with fields: ip, time, request, status, bytes, referer, user_agent.
    Returns None if the line does not match.
    """
    match = LOG_PATTERN.match(line)
    if match:
        data = match.groupdict()
        data['status'] = int(data['status'])
        data['bytes'] = int(data['bytes'])
        return data
    return None

def extract_path(request_str):
    """
    Extracts the path from the request string (e.g., "GET /index.html HTTP/1.1" -> "/index.html").
    """
    try:
        parts = request_str.split()
        if len(parts) >= 2:
            return parts[1]
    except:
        pass
    return request_str
