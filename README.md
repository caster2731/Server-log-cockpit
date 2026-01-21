# Server Log Cockpit

Server Log Cockpit is a modern, web-based Nginx access log analyzer and monitoring tool.
It visualizes your server traffic in real-time with a premium "Cyber/Glassmorphism" UI.

![Dashboard Preview](https://via.placeholder.com/800x450?text=Dashboard+Preview)

## ✨ Features

- **📊 Beautiful Dashboard**: Visualize PV, UU, Data Transfer, and Error Rates instantly.
- **📈 Interactive Charts**: Hourly traffic trends and Status Code distribution.
- **🕵️ Deep Dive Analysis**:
  - **Top Clients (IPs)** with DNS Reverse Lookup & GeoIP (Country Flags).
  - **Top Requests**, User Agents, and Referers.
- **🤖 Bot Filtering**: Toggle switch to exclude crawlers/bots and analyze real user traffic.
- **🔴 Live Monitor**: Real-time "tail -f" style terminal view for watching incoming logs.
- **📂 File Browser**: Select any log file from your server directly via the UI.
- **🌐 Multi-language**: Switch between English and Japanese support.

## 🛠️ Technology Stack

- **Backend**: Python (Flask)
- **Frontend**: HTML5, CSS3 (Modern Dark Theme), JavaScript (Vanilla + Chart.js)
- **Design**: Glassmorphism UI with FontAwesome icons

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/server-log-cockpit.git
   cd server-log-cockpit
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Usage

1. Start the application:
   ```bash
   python app.py
   ```

2. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

3. Enter the path to your Nginx access log (or use the file picker folder icon) and click **ANALYZE**.

## 📝 Supported Log Format

Currently supports the standard Nginx/Apache `combined` log format:
```
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
```

## 🛡️ License

MIT License
