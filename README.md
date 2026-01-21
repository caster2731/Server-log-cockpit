# Server Log Cockpit
**[English]** | [日本語](#japanese)

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

   git clone https://github.com/caster2731/server-log-cockpit.git
   cd server-log-cockpit
   ```

2. Install dependencies:
   
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

---

<a name="japanese"></a>
# Server Log Cockpit (日本語)

Server Log Cockpit は、モダンなWebベースのNginxアクセスログ解析・監視ツールです。
美しい「サイバー・グラスモーフィズム」UIで、サーバートラフィックをリアルタイムに可視化します。

## ✨ 主な機能

- **📊 美しいダッシュボード**: PV、UU、転送量、エラー率を一目で確認。
- **📈 インタラクティブなチャート**: 時間帯別のアクセス推移とステータスコードの分布。
- **🕵️ 詳細分析**:
  - **クライアント分析**: IPアドレスごとのDNS逆引き＆国旗表示 (GeoIP)。
  - **リクエスト分析**: よく見られているページ、User-Agent、リファラー（流入元）。
- **🤖 ボットフィルター**: クローラーやボットをワンクリックで除外し、実際のユーザー動向のみを分析。
- **🔴 ライブモニター**: 「tail -f」のように、流れてくるログをブラウザ上のターミナルでリアルタイム監視。
- **📂 ファイルブラウザ**: サーバー上のログファイルをGUIで選択可能。
- **🌐 多言語対応**: UI上で英語/日本語を切り替え可能。

## 🚀 使い方

### インストール

1. リポジトリをクローン:
   ```bash
   git clone https://github.com/caster2731/server-log-cockpit.git
   cd server-log-cockpit
   ```

2. 依存ライブラリのインストール:
   ```bash
   pip install -r requirements.txt
   ```

### 起動方法

1. アプリを起動:
   ```bash
   python app.py
   ```

2. ブラウザでアクセス:
   ```
   http://127.0.0.1:5000
   ```

3. 解析したいNginxアクセスログのパスを入力するか、フォルダアイコンをクリックしてファイルを選択し、**ANALYZE** をクリックしてください。

## 📝 対応ログ形式

現在は標準的な Nginx/Apache の `combined` ログ形式に対応しています:
```
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
```

## 🛡️ ライセンス

MIT License
