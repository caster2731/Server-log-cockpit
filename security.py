import re

class SecurityAnalyzer:
    def __init__(self):
        # Threat Signatures
        self.signatures = [
            {
                'type': 'SQL Injection',
                'pattern': re.compile(r"(?i)(union\s+select|' OR '1'='1|benchmark\(|sleep\(\d+\)|information_schema)", re.IGNORECASE),
                'risk': 'High'
            },
            {
                'type': 'XSS (Cross-Site Scripting)',
                'pattern': re.compile(r"(?i)(<script>|javascript:|onerror=|onload=|alert\()", re.IGNORECASE),
                'risk': 'High'
            },
            {
                'type': 'Path Traversal',
                'pattern': re.compile(r"(?i)(\.\./\.\./|\.\.\\\.\.\\|/etc/passwd|c:\\windows\\system32)", re.IGNORECASE),
                'risk': 'High'
            },
            {
                'type': 'Scanner/Bot',
                'pattern': re.compile(r"(?i)(Nikto|BurpSuite|Sqlmap|Nmap|OpenVAS|python-requests|curl|wget)", re.IGNORECASE),
                'risk': 'Medium'
            },
            {
                'type': 'Sensitive File Access',
                'pattern': re.compile(r"(?i)(\.env|\.git/|\.aws/|wp-config\.php|\.htaccess)", re.IGNORECASE),
                'risk': 'Medium'
            }
        ]

    def check_request(self, record):
        """
        Check a single log record for threats.
        Returns a threat dictionary or None.
        """
        threats = []
        path = record.get('request', '')
        ua = record.get('user_agent', '')
        
        # Check URL Path
        for sig in self.signatures:
            if sig['pattern'].search(path):
                threats.append({
                    'type': sig['type'],
                    'risk': sig['risk'],
                    'evidence': path[:100]  # First 100 chars
                })
                continue # Don't match same sig twice

        # Check User Agent (specifically for Scanners)
        # Re-using scanner pattern on UA
        scanner_sig = next((s for s in self.signatures if s['type'] == 'Scanner/Bot'), None)
        if scanner_sig and scanner_sig['pattern'].search(ua):
             # Avoid duplicating if already caught in path (unlikely for UA sigs but good practice)
             if not any(t['type'] == 'Scanner/Bot' for t in threats):
                threats.append({
                    'type': 'Scanner/Bot',
                    'risk': 'Medium',
                    'evidence': ua[:50]
                })

        if threats:
            return threats
        return None
