from flask import Flask, render_template, request, jsonify
import os
import socket
from log_parser import parse_log_line
from analyzer import LogAnalyzer

app = Flask(__name__)

# Config
DEFAULT_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    logfile_path = data.get('filepath')
    filter_bots = data.get('filter_bots', False)
    
    # Date Filtering
    import datetime
    start_date = None
    end_date = None
    
    if data.get('start_date'):
        try:
            # Expected format from UI: "2026-01-21T14:30" (datetime-local value)
            start_date = datetime.datetime.strptime(data.get('start_date'), '%Y-%m-%dT%H:%M')
            # Add timezone info (naive assumption for local log)
            # Ideally we handle timezone, but simple comparison is enough for now 
            # or converting naive to aware if parsed logs are aware.
            # Log parser uses '%z' so it produces aware datetime.
            # We must make this aware or naive. Nginx logs usually have +0900.
            # Let's assume matches local machine or handle naive comparison inside analyzer.
            # Actually, Python 3 doesn't let you compare offset-naive and offset-aware.
            # Let's force naive for parser or aware for everything.
            # Since parser gets "+0900", it is aware.
            # We should make this aware too if possible, but we don't know the offset easily here.
            # Strategy: Convert parsing to naive (remove tz) OR give this a dummy tz.
            # Let's try to add local system timezone or just +0900 (JST) hardcoded for this user context?
            # Or better: remove tzinfo from parsed logs for comparison? No, time zones matter.
            # Let's add a fixed timezone (JST) since user is in Japan (logs seem to be +0900).
            jst = datetime.timezone(datetime.timedelta(hours=9))
            start_date = start_date.replace(tzinfo=jst)
        except Exception: 
            pass # invalid date, ignore

    if data.get('end_date'):
        try:
            end_date = datetime.datetime.strptime(data.get('end_date'), '%Y-%m-%dT%H:%M')
            jst = datetime.timezone(datetime.timedelta(hours=9))
            end_date = end_date.replace(tzinfo=jst)
        except Exception:
            pass

    if not logfile_path or not os.path.exists(logfile_path):
        return jsonify({'error': 'File not found'}), 404

    analyzer = LogAnalyzer(filter_bots=filter_bots, start_date=start_date, end_date=end_date)
    
    try:
        with open(logfile_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                record = parse_log_line(line)
                if record:
                    analyzer.process_record(record)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify(analyzer.get_statistics())

@app.route('/api/ip_history', methods=['POST'])
def ip_history():
    data = request.json
    logfile_path = data.get('filepath')
    target_ip = data.get('ip')
    
    if not logfile_path or not os.path.exists(logfile_path):
        return jsonify({'error': 'File not found'}), 404

    history = []
    
    try:
        with open(logfile_path, 'r', encoding='utf-8') as f:
            for line in f:
                record = parse_log_line(line)
                if record and record['ip'] == target_ip:
                     history.append({
                         'time': record['time'],
                         'request': record['request'],
                         'status': record['status'],
                         'user_agent': record['user_agent'],
                         'referer': record['referer']
                     })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
    return jsonify({'ip': target_ip, 'history': history})

@app.route('/api/tail', methods=['POST'])
def tail():
    data = request.json
    logfile_path = data.get('filepath')
    last_pos = data.get('last_pos', 0)
    
    if not logfile_path or not os.path.exists(logfile_path):
        return jsonify({'error': 'File not found'}), 404

    new_lines = []
    current_size = os.path.getsize(logfile_path)

    # Log rotation check: if file is smaller than last read position, reset to 0
    if current_size < last_pos:
        last_pos = 0

    try:
        with open(logfile_path, 'r', encoding='utf-8') as f:
            f.seek(last_pos)
            # Read new lines
            lines = f.readlines()
            last_pos = f.tell()
            
            # Filter empty lines
            new_lines = [line.strip() for line in lines if line.strip()]

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({
        'new_lines': new_lines,
        'last_pos': last_pos
    })

@app.route('/api/browse', methods=['POST'])
def browse():
    data = request.json
    path = data.get('path', 'd:/')
    
    # Normalize path
    if not path: 
        path = 'd:/'
    
    try:
        if not os.path.exists(path):
            path = 'd:/' # Fallback
            
        # If it's a file, return parent dir
        if os.path.isfile(path):
            path = os.path.dirname(path)

        items = []
        with os.scandir(path) as it:
            for entry in it:
                try:
                    items.append({
                        'name': entry.name,
                        'is_dir': entry.is_dir(),
                        'path': entry.path.replace('\\', '/')
                    })
                except PermissionError:
                    continue
        
        # Sort: Directories first, then files
        items.sort(key=lambda x: (not x['is_dir'], x['name'].lower()))
        
        parent = os.path.dirname(path) if len(path) > 3 else path

        return jsonify({
            'current_path': path.replace('\\', '/'),
            'parent_path': parent.replace('\\', '/'),
            'items': items
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dns_lookup', methods=['POST'])
def dns_lookup():
    data = request.json
    ip = data.get('ip')
    
    if not ip:
        return jsonify({'error': 'No IP provided'}), 400

    try:
        socket.setdefaulttimeout(2)
        hostname, _, _ = socket.gethostbyaddr(ip)
        return jsonify({'ip': ip, 'hostname': hostname})
    except socket.herror:
        return jsonify({'ip': ip, 'hostname': 'Unknown (Lookup Failed)'})
    except Exception as e:
        return jsonify({'ip': ip, 'hostname': f'Error: {str(e)}'})

@app.route('/api/choose_file', methods=['POST'])
def choose_file():
    import subprocess
    import sys
    
    # Python script to open file dialog using Tkinter (runs in separate process)
    # properly handles TopMost focus
    script = """
import tkinter as tk
from tkinter import filedialog
import os

try:
    root = tk.Tk()
    root.withdraw() # Hide the main window
    root.attributes('-topmost', True) # Force to top
    root.lift()
    root.focus_force()
    
    file_path = filedialog.askopenfilename(
        title="Select Access Log",
        filetypes=[("Log files", "*.log"), ("All files", "*.*")]
    )
    
    if file_path:
        print(file_path)
except Exception:
    pass
"""
    
    try:
        # Run the python script in a subprocess
        # Using sys.executable to ensure we use the same python interpreter
        result = subprocess.run(
            [sys.executable, "-c", script],
            capture_output=True,
            text=True,
            check=False
        )
        
        path = result.stdout.strip()
        
        if path:
            return jsonify({'path': path})
        else:
            return jsonify({'path': None}) # Cancelled
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8989)
