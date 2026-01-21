from collections import Counter
from log_parser import extract_path
from security import SecurityAnalyzer
import re
import datetime

class LogAnalyzer:
    def __init__(self, filter_bots=False, start_date=None, end_date=None):
        self.total_requests = 0
        self.ips = Counter()
        self.status_codes = Counter()
        self.paths = Counter()
        self.total_bytes = 0
        self.hours = Counter()
        self.user_agents = Counter()
        self.referers = Counter()
        self.filter_bots = filter_bots
        
        # Date Filter (datetime objects)
        self.start_date = start_date
        self.end_date = end_date
        
        # Security
        self.security_analyzer = SecurityAnalyzer()
        self.threats = [] # List of threat details
        self.security_stats = Counter()

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
        # Date Filter
        if self.start_date or self.end_date:
            ts = record.get('datetime_obj')
            if not ts: return # Skip invalid dates if filter is on
            # Assuming timestamps are timezone aware, we should compare carefully.
            # But simpler is to compare timestamps if timezone matches or convert.
            # Here we assume user filters are naive or compatible.
            # Let's perform simple comparison
            if self.start_date and ts < self.start_date: return
            if self.end_date and ts > self.end_date: return

        is_bot_req = self.is_bot(record['user_agent'])
        
        # If filtering is enabled and it is a bot, skip counting
        # BUT: Security analysis might still be interesting for bots?
        # Let's count security threats even for bots, but maybe not main stats?
        # For consistency with "exclude bots", main stats skip bots.
        # Security stats will skip bots if filter is on, because bots are often the attackers.
        # Actually, user probably wants to see attacks even if they are bots.
        # However, to keep "filter bots" consistent, we will skip everything if filter_bots is True.
        
        if self.filter_bots and is_bot_req:
            return

        # Security Check
        found_threats = self.security_analyzer.check_request(record)
        if found_threats:
            for threat in found_threats:
                self.security_stats[threat['type']] += 1
                self.threats.append({
                    'time': record.get('time'),
                    'ip': record.get('ip'),
                    'type': threat['type'],
                    'evidence': threat['evidence'],
                    'risk': threat['risk']
                })

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
            'top_referers': self.referers.most_common(20),
            'security': {
                'total_threats': sum(self.security_stats.values()),
                'stats': dict(self.security_stats),
                'top_threats': self.threats[:50] # Return top 50 logs directly (or reverse?)
                # Actually threats list grows linearly. We should limit return size.
            }
        }
