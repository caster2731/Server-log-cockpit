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

    if not logfile_path or not os.path.exists(logfile_path):
        return jsonify({'error': 'File not found'}), 404

    analyzer = LogAnalyzer(filter_bots=filter_bots)
    
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

if __name__ == '__main__':
    app.run(debug=True, port=8989)
