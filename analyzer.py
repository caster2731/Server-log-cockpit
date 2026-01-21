from collections import Counter
from log_parser import extract_path
import re

class LogAnalyzer:
    def __init__(self, filter_bots=False):
        self.total_requests = 0
        self.ips = Counter()
        self.status_codes = Counter()
        self.paths = Counter()
        self.total_bytes = 0
        self.hours = Counter()
        self.user_agents = Counter()
        self.referers = Counter()
        self.filter_bots = filter_bots
        
        self.bot_keywords = [
            'bot', 'crawl', 'spider', 'slurp', 'mediapartners', 'python-requests', 
            'curl', 'wget', 'ahrefs', 'semrush', 'mj12bot', 'check.9tb.org'
        ]

    def is_bot(self, user_agent):
        ua_lower = user_agent.lower()
        if ua_lower == '-': return False
        return any(keyword in ua_lower for keyword in self.bot_keywords)

    def process_record(self, record):
        """
        Process a single parsed log record and update statistics.
        """
        is_bot_req = self.is_bot(record['user_agent'])
        
        # If filtering is enabled and it is a bot, skip counting
        if self.filter_bots and is_bot_req:
            return

        self.total_requests += 1
        self.ips[record['ip']] += 1
        self.status_codes[record['status']] += 1
        self.total_bytes += record['bytes']
        self.user_agents[record['user_agent']] += 1
        self.referers[record['referer']] += 1
        
        path = extract_path(record['request'])
        self.paths[path] += 1

        # Extract hour from timestamp
        # Format: 21/Jan/2026:13:14:04 +0900 -> 13
        try:
            time_str = record['time']
            time_match = re.search(r':(\d{2}):', time_str)
            if time_match:
                hour = time_match.group(1)
                self.hours[hour] += 1
        except Exception:
            pass

    def get_statistics(self):
        """
        Returns a dictionary containing the calculated statistics.
        """
        sorted_hours = dict(sorted(self.hours.items()))
        
        return {
            'total_requests': self.total_requests,
            'unique_users': len(self.ips),
            'total_bytes': self.total_bytes,
            'status_codes': dict(self.status_codes),
            'top_paths': self.paths.most_common(20),
            'top_ips': self.ips.most_common(50),
            'hourly_stats': sorted_hours,
            'top_user_agents': self.user_agents.most_common(20),
            'top_referers': self.referers.most_common(20)
        }
