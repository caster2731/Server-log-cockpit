let hourlyChartInstance = null;
let statusChartInstance = null;
let liveInterval = null;
let lastFilePos = 0;

// Translation Dictionary
const translations = {
    en: {
        pv: 'Total Requests',
        uu: 'Unique Visitors',
        transfer: 'Data Transfer',
        error: 'Error Rate (4xx/5xx)',
        hourly: 'Hourly Traffic',
        status: 'Status Codes',
        ips: 'Top Clients (IPs)',
        paths: 'Top Requests',
        uas: 'Top User Agents',
        refs: 'Top Referers',
        analyze: 'ANALYZE',
        resolve: 'Resolve All',
        resolving: 'Resolving...',
        excludeBots: 'Exclude Bots',
        processing: 'Processing Logs...',
        analyzing: 'Analyzing...',
        requests: 'Requests',
        live: 'LIVE',
        waiting: 'Waiting for new logs...'
    },
    jp: {
        pv: '総リクエスト (PV)',
        uu: 'ユニーク訪問者 (UU)',
        transfer: '転送量合計',
        error: 'エラー率 (4xx/5xx)',
        hourly: '時間帯別アクセス',
        status: 'ステータスコード',
        ips: 'クライアント (IP) Top',
        paths: 'リクエストパス Top',
        uas: 'ユーザーエージェント (UA)',
        refs: 'リファラー (流入元)',
        analyze: '解析開始',
        resolve: '一括解決 (DNS/Geo)',
        resolving: '解決中...',
        excludeBots: 'ボットを除外',
        processing: 'ログを解析中...',
        analyzing: '解析中...',
        requests: '件数',
        live: 'ライブ',
        waiting: '新しいログを待機中...'
    }
};

let currentLang = 'jp'; // Default to JP as per user preference

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'jp' : 'en';
    document.getElementById('current-lang').textContent = currentLang.toUpperCase();
    applyLanguage();
}

function applyLanguage() {
    const t = translations[currentLang];
    document.getElementById('lbl-exclude-bots').textContent = t.excludeBots;
    document.getElementById('btn-analyze').textContent = t.analyze;
    document.getElementById('msg-processing').textContent = t.processing;
    document.getElementById('h-pv').textContent = t.pv;
    document.getElementById('h-uu').textContent = t.uu;
    document.getElementById('h-transfer').textContent = t.transfer;
    document.getElementById('h-error').textContent = t.error;
    document.getElementById('t-hourly').textContent = t.hourly;
    document.getElementById('t-status').textContent = t.status;
    document.getElementById('t-ips').textContent = t.ips;
    document.getElementById('t-paths').textContent = t.paths;
    document.getElementById('t-uas').textContent = t.uas;
    document.getElementById('t-refs').textContent = t.refs;
    document.getElementById('btn-resolve').textContent = t.resolve;
    // document.getElementById('lbl-live').innerHTML = `<i class="fa-solid fa-circle fa-beat-fade"></i> ${t.live}`;

    if (hourlyChartInstance) {
        hourlyChartInstance.data.datasets[0].label = t.requests;
        hourlyChartInstance.update();
    }
}

// ========================
// Analysis Logic
// ========================
async function startAnalysis() {
    // If live monitor is on, turn it off first to avoid conflicts
    if (document.getElementById('liveMonitor').checked) {
        document.getElementById('liveMonitor').click();
    }

    const path = document.getElementById('logPath').value;
    const filterBots = document.getElementById('botFilter').checked;
    const dashboard = document.getElementById('dashboard');
    const loader = document.getElementById('loader');

    dashboard.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: path, filter_bots: filterBots })
        });

        const data = await response.json();

        if (response.ok) {
            updateDashboard(data);
            loader.classList.add('hidden');
            dashboard.classList.remove('hidden');
        } else {
            alert('Error: ' + data.error);
            loader.classList.add('hidden');
        }
    } catch (e) {
        alert('Network or Server Error');
        console.error(e);
        loader.classList.add('hidden');
    }
}

function updateDashboard(data) {
    document.getElementById('val-pv').textContent = data.total_requests.toLocaleString();
    document.getElementById('val-uu').textContent = data.unique_users.toLocaleString();
    const bytes = data.total_bytes;
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    document.getElementById('val-bytes').textContent = gb > 1 ? gb.toFixed(2) + ' GB' : mb.toFixed(2) + ' MB';

    let errors = 0;
    for (const [code, count] of Object.entries(data.status_codes)) {
        if (parseInt(code) >= 400) errors += count;
    }
    const errorRate = data.total_requests > 0 ? (errors / data.total_requests * 100).toFixed(2) : 0;
    document.getElementById('val-error').textContent = errorRate + '%';

    const tables = ['ip', 'path', 'ua', 'ref'];
    tables.forEach(t => document.querySelector(`#${t}Table tbody`).innerHTML = '');

    data.top_ips.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${index + 1}</td>
            <td id="ip-cell-${index}">${item[0]} <button class="dns-btn" onclick="lookupOne('${item[0]}', ${index})"><i class="fa-solid fa-magnifying-glass"></i></button></td>
            <td>${item[1].toLocaleString()}</td>
            <td id="dns-res-${index}" style="color: #8b949e; font-size: 0.8rem;">-</td>
        `;
        document.querySelector('#ipTable tbody').appendChild(row);
    });

    data.top_paths.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>#${index + 1}</td><td title="${item[0]}">${item[0].length > 40 ? item[0].substring(0, 40) + '...' : item[0]}</td><td>${item[1].toLocaleString()}</td>`;
        document.querySelector('#pathTable tbody').appendChild(row);
    });

    data.top_user_agents.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>#${index + 1}</td><td title="${item[0]}">${item[0].length > 40 ? item[0].substring(0, 40) + '...' : item[0]}</td><td>${item[1].toLocaleString()}</td>`;
        document.querySelector('#uaTable tbody').appendChild(row);
    });

    data.top_referers.forEach((item, index) => {
        const refShort = item[0] === '-' ? '(Direct)' : item[0];
        const row = document.createElement('tr');
        row.innerHTML = `<td>#${index + 1}</td><td title="${item[0]}">${refShort.length > 40 ? refShort.substring(0, 40) + '...' : refShort}</td><td>${item[1].toLocaleString()}</td>`;
        document.querySelector('#refTable tbody').appendChild(row);
    });

    updateCharts(data);
}

function updateCharts(data) {
    const t = translations[currentLang];
    const hours = Object.keys(data.hourly_stats);
    const hourCounts = Object.values(data.hourly_stats);
    const ctxHourly = document.getElementById('hourlyChart').getContext('2d');
    if (hourlyChartInstance) hourlyChartInstance.destroy();
    hourlyChartInstance = new Chart(ctxHourly, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: t.requests,
                data: hourCounts,
                borderColor: '#2f81f7',
                backgroundColor: 'rgba(47, 129, 247, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    const codes = Object.keys(data.status_codes);
    const codeCounts = Object.values(data.status_codes);
    const bgColors = codes.map(code => {
        if (code.startsWith('2')) return '#238636';
        if (code.startsWith('3')) return '#e3b341';
        if (code.startsWith('4')) return '#f85149';
        if (code.startsWith('5')) return '#a371f7';
        return '#8b949e';
    });

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: codes,
            datasets: [{ data: codeCounts, backgroundColor: bgColors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#e6edf3' } } }
        }
    });
}

// ========================
// Live Monitor Logic
// ========================
async function toggleLiveMonitor() {
    const isActive = document.getElementById('liveMonitor').checked;
    const terminal = document.getElementById('live-terminal');
    const path = document.getElementById('logPath').value;

    if (isActive) {
        // Start
        terminal.classList.remove('hidden');
        document.getElementById('lbl-live').classList.add('active');
        document.getElementById('live-filename').textContent = path;

        // Reset pointers? No, maybe start from end of file (tail)?
        // For now, let's just start reading from current end
        try {
            // Initial probe to get size
            // Actually, we can just say last_pos = 0 if we want everything, 
            // but for "Live" we usually want only new stuff.
            // Let's assume we want to catch up a bit or start fresh.
            // Simplified: we will start from current EOF.
            // We need an API call to get size? Or just send a huge number?
            // Sending -1 to API could mean "tail from end"

            // For simplicity, let's start with last_pos = 0 but maybe we should skip old content?
            // Actually, usually users want to see *future* logs. 
            // Let's set last_pos to a very large number, the API will reset it to EOF.
            lastFilePos = 999999999999;

            liveInterval = setInterval(pollLog, 2000); // 2s polling
        } catch (e) { }

    } else {
        // Stop
        terminal.classList.add('hidden');
        document.getElementById('lbl-live').classList.remove('active');
        if (liveInterval) clearInterval(liveInterval);
    }
}

async function pollLog() {
    const path = document.getElementById('logPath').value;
    try {
        const response = await fetch('/api/tail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: path, last_pos: lastFilePos })
        });

        if (!response.ok) return;

        const data = await response.json();
        lastFilePos = data.last_pos;

        if (data.new_lines && data.new_lines.length > 0) {
            const container = document.getElementById('terminal-content');

            // Remove initial waiting message if exists
            const waitMsg = container.querySelector('.system-msg');
            if (waitMsg) waitMsg.remove();

            data.new_lines.forEach(line => {
                const div = document.createElement('div');
                div.className = 'terminal-line';
                // Basic syntax highlighting
                if (line.includes(' 200 ')) div.classList.add('status-2xx');
                else if (line.includes(' 404 ')) div.classList.add('status-4xx');
                else if (line.includes(' 500 ')) div.classList.add('status-5xx');
                else if (line.includes(' 502 ')) div.classList.add('status-5xx');

                div.textContent = line;
                container.prepend(div); // Newest top

                // Limit lines
                if (container.children.length > 100) {
                    container.lastChild.remove();
                }
            });
        }
    } catch (e) {
        console.error('Polling error', e);
    }
}

function clearTerminal() {
    document.getElementById('terminal-content').innerHTML = '<div class="terminal-line system-msg">Cleared. Waiting for new logs...</div>';
}

// ========================
// File Browser Logic (Native Dialog)
// ========================
async function openFileBrowser() {
    const btn = document.querySelector('.file-btn');
    const origIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const response = await fetch('/api/choose_file', { method: 'POST' });
        const data = await response.json();

        if (data.path) {
            document.getElementById('logPath').value = data.path;
        }
    } catch (e) {
        alert('Failed to open dialog');
    } finally {
        btn.innerHTML = origIcon;
        btn.disabled = false;
    }
}

/* 
// Deprecated Custom Browser Code
const fileBrowserModal = document.getElementById('fileBrowser');
...
*/

function closeFileBrowser() {
    fileBrowserModal.classList.add('hidden');
}

async function loadDirectory(path) {
    try {
        const response = await fetch('/api/browse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
        const data = await response.json();

        document.getElementById('currentPath').textContent = data.current_path;

        const list = document.getElementById('fileList');
        list.innerHTML = '';

        data.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.onclick = () => {
                if (item.is_dir) {
                    loadDirectory(item.path);
                } else {
                    selectFile(item.path);
                }
            };

            const icon = item.is_dir ? '<i class="fa-solid fa-folder"></i>' : '<i class="fa-regular fa-file-lines"></i>';
            div.innerHTML = `${icon} <span>${item.name}</span>`;
            list.appendChild(div);
        });

    } catch (e) {
        alert('Failed to load directory');
    }
}

function navigateUp() {
    const current = document.getElementById('currentPath').textContent;
    // Simple logic to go up
    // Actually the API returns parent_path, but we didn't store it globally.
    // Let's retry loadDirectory with parent logic or just use what we have in API?
    // API returns parent_path, let's use global var or just fix navigateUp to assume logic
    // We can fetch parent from current path string locally or ask API
    // Let's ask API (browse returns parent_path) - but I need to store it.
    // Redo: store currenData
    // Hack: just strip last segment
    const parts = current.split('/');
    parts.pop();
    const up = parts.join('/') || 'd:/';
    loadDirectory(up);
}

function selectFile(path) {
    document.getElementById('logPath').value = path;
    closeFileBrowser();
}

// DNS/GeoIP Lookups (Combined)
async function lookupOne(ip, index) {
    const resCell = document.getElementById(`dns-res-${index}`);
    resCell.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    let dnsName = '';
    try {
        const response = await fetch('/api/dns_lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ip })
        });
        const data = await response.json();
        dnsName = data.hostname;
    } catch { dnsName = '?'; }

    let countryFlag = '';
    if (!ip.startsWith('192.168.') && !ip.startsWith('127.') && !ip.startsWith('10.')) {
        try {
            const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.country_name) {
                    countryFlag = `<img src="https://flagcdn.com/16x12/${geoData.country.toLowerCase()}.png" style="vertical-align: middle; margin-right: 4px;">`;
                }
            }
        } catch (e) { }
    } else { countryFlag = '<i class="fa-solid fa-house"></i> '; }

    resCell.innerHTML = `${countryFlag} <span style="color:#a371f7">${dnsName}</span>`;
}

async function resolveAllDNS() {
    const btn = document.getElementById('resolveAllBtn');
    const t = translations[currentLang];
    const originalText = document.getElementById('btn-resolve').textContent;
    document.getElementById('btn-resolve').innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.resolving}`;
    btn.disabled = true;

    const rows = document.querySelectorAll('#ipTable tbody tr');
    for (let i = 0; i < rows.length; i++) {
        const ipCell = document.getElementById(`ip-cell-${i}`);
        if (!ipCell) continue;
        const ip = ipCell.childNodes[0].textContent.trim();
        const resCell = document.getElementById(`dns-res-${i}`);
        if (resCell.textContent.trim() !== '-' && !resCell.innerHTML.includes('fa-spin')) continue;
        await lookupOne(ip, i);
        await new Promise(r => setTimeout(r, 600));
    }
    document.getElementById('btn-resolve').textContent = originalText;
    btn.disabled = false;
}

// Initialize
applyLanguage();
