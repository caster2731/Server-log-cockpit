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
        security: 'Security Threats',
        threats: 'Detected Threats',
        threatDist: 'Threat Distribution',
        journey: 'User Journey',
        safe: 'Safe',
        threatCount: 'Threats!',
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
        waiting: 'Waiting for new logs...',
        // Table Headers
        time: 'Time',
        ip: 'IP',
        type: 'Type',
        risk: 'Risk',
        evidence: 'Evidence',
        method: 'Method/Path',
        refUa: 'Ref/UA'
    },
    jp: {
        pv: '総リクエスト (PV)',
        uu: 'ユニーク訪問者 (UU)',
        transfer: '転送量合計',
        error: 'エラー率 (4xx/5xx)',
        security: 'セキュリティ脅威',
        threats: '検知された脅威',
        threatDist: '脅威の内訳',
        journey: 'ユーザー行動履歴 (Journey)',
        safe: '安全',
        threatCount: '件の脅威！',
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
        waiting: '新しいログを待機中...',
        // Table Headers
        time: '時刻',
        ip: 'IPアドレス',
        type: '種類',
        risk: '危険度',
        evidence: '証拠/ペイロード',
        method: 'メソッド/パス',
        refUa: 'リファラー/UA'
    }
};

// Theme Logic
let currentTheme = 'dark'; // Default

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Update Icon
    const icon = document.getElementById('theme-icon');
    if (icon) {
        if (currentTheme === 'light') {
            icon.className = 'fa-solid fa-moon';
        } else {
            icon.className = 'fa-solid fa-sun';
        }
    }

    // Update Charts colors
    updateChartTheme();
}

function updateChartTheme() {
    const isDark = currentTheme === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#e6edf3' : '#24292f';

    if (hourlyChartInstance) {
        if (hourlyChartInstance.options.scales.x) hourlyChartInstance.options.scales.x.grid.color = gridColor;
        if (hourlyChartInstance.options.scales.y) hourlyChartInstance.options.scales.y.grid.color = gridColor;
        if (hourlyChartInstance.options.scales.x) hourlyChartInstance.options.scales.x.ticks.color = textColor;
        if (hourlyChartInstance.options.scales.y) hourlyChartInstance.options.scales.y.ticks.color = textColor;
        hourlyChartInstance.update();
    }

    if (statusChartInstance) {
        if (statusChartInstance.options.plugins.legend) statusChartInstance.options.plugins.legend.labels.color = textColor;
        statusChartInstance.update();
    }

    if (threatChartInstance) {
        if (threatChartInstance.options.plugins.legend) threatChartInstance.options.plugins.legend.labels.color = textColor;
        threatChartInstance.update();
    }
}

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
    document.getElementById('h-security').textContent = t.security;

    // New Features Headers
    const tThreats = document.getElementById('t-threats');
    if (tThreats) tThreats.textContent = t.threats;

    const tThreatDist = document.getElementById('t-threat-dist');
    if (tThreatDist) tThreatDist.textContent = t.threatDist;

    const tJourney = document.getElementById('t-journey');
    if (tJourney) tJourney.textContent = t.journey;

    // Table Headers (Threats)
    if (document.getElementById('th-t-time')) {
        document.getElementById('th-t-time').textContent = t.time;
        document.getElementById('th-t-ip').textContent = t.ip;
        document.getElementById('th-t-type').textContent = t.type;
        document.getElementById('th-t-risk').textContent = t.risk;
        document.getElementById('th-t-evidence').textContent = t.evidence;
    }
    // Table Headers (Journey)
    if (document.getElementById('th-j-time')) {
        document.getElementById('th-j-time').textContent = t.time;
        document.getElementById('th-j-method').textContent = t.method;
        // Status is shared/universal enough? Or use 'status' key
        document.getElementById('th-j-status').textContent = t.status; // Using global status key
        document.getElementById('th-j-ref').textContent = t.refUa;
    }

    document.getElementById('t-hourly').textContent = t.hourly;
    document.getElementById('t-status').textContent = t.status;
    document.getElementById('t-ips').textContent = t.ips;
    document.getElementById('t-paths').textContent = t.paths;
    document.getElementById('t-uas').textContent = t.uas;
    document.getElementById('t-refs').textContent = t.refs;
    document.getElementById('btn-resolve').textContent = t.resolve;

    if (hourlyChartInstance) {
        hourlyChartInstance.data.datasets[0].label = t.requests;
        hourlyChartInstance.update();
    }

    // Update Security Card Text if it's currently showing something
    const secVal = document.getElementById('val-security');
    if (secVal) {
        // Simple logic: if contains '!', it's threats, else safe
        // But better to store state or just leave it for re-analysis?
        // Let's check color for check
        if (secVal.style.color === 'var(--accent-success)' || secVal.textContent === 'Safe' || secVal.textContent === '安全') {
            secVal.textContent = t.safe;
        } else if (secVal.textContent.includes('Threats') || secVal.textContent.includes('脅威')) {
            // Keep number
            const num = parseInt(secVal.textContent) || 0;
            secVal.textContent = currentLang === 'en' ? `${num} Threats!` : `${num}${t.threatCount}`;
        }
    }
}

// ========================
// Analysis Logic
// ========================
async function startAnalysis(silent = false) {
    // If live monitor is on, turn it off first to avoid conflicts (ONLY if explicit manual analysis)
    // But if silent (auto-refresh), we don't want to turn off live monitor.
    if (!silent && document.getElementById('liveMonitor').checked) {
        document.getElementById('liveMonitor').click();
    }

    const path = document.getElementById('logPath').value;
    const filterBots = document.getElementById('botFilter').checked;

    // Date Params
    const dateStart = document.getElementById('dateStart').value;
    const dateEnd = document.getElementById('dateEnd').value;

    const dashboard = document.getElementById('dashboard');
    const loader = document.getElementById('loader');

    // Only show loader if not silent
    if (!silent) {
        dashboard.classList.add('hidden');
        loader.classList.remove('hidden');
    }

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filepath: path,
                filter_bots: filterBots,
                start_date: dateStart,
                end_date: dateEnd
            })
        });

        const data = await response.json();

        if (response.ok) {
            updateDashboard(data);
            if (!silent) {
                loader.classList.add('hidden');
                dashboard.classList.remove('hidden');
            }
        } else {
            console.error('Analysis error: ' + data.error);
            if (!silent) {
                alert('Error: ' + data.error);
                loader.classList.add('hidden');
            }
        }
    } catch (e) {
        console.error('Network or Server Error', e);
        if (!silent) {
            alert('Network or Server Error');
            loader.classList.add('hidden');
        }
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

    // Security Stats
    const secStats = data.security;
    const secVal = document.getElementById('val-security');
    const secCard = document.getElementById('card-security');
    const secSection = document.getElementById('sec-threats');

    // Get translations for dynamic text
    const t = translations[currentLang];

    if (secStats && secStats.total_threats > 0) {
        secVal.textContent = currentLang === 'en' ? `${secStats.total_threats} Threats!` : `${secStats.total_threats}${t.threatCount}`;
        secVal.style.color = 'var(--accent-danger)';
        secCard.classList.add('card-danger');
        secSection.classList.remove('hidden');

        // Populate Threat Table
        const tbody = document.querySelector('#threatTable tbody');
        tbody.innerHTML = '';
        secStats.top_threats.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.time}</td>
                <td><span class="highlight-ip" onclick="openJourneyModal('${t.ip}')">${t.ip}</span></td>
                <td>${t.type}</td>
                <td class="risk-${t.risk}">${t.risk}</td>
                <td title="${t.evidence}">${t.evidence ? (t.evidence.length > 50 ? t.evidence.substring(0, 50) + '...' : t.evidence) : '-'}</td>
            `;
            tbody.appendChild(row);
        });

    } else {
        secVal.textContent = t.safe;
        secVal.style.color = 'var(--accent-success)';
        secCard.classList.remove('card-danger');
        secSection.classList.add('hidden');
    }

    const tables = ['ip', 'path', 'ua', 'ref'];
    tables.forEach(t => document.querySelector(`#${t}Table tbody`).innerHTML = '');

    data.top_ips.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${index + 1}</td>
            <td id="ip-cell-${index}"><span class="highlight-ip" onclick="openJourneyModal('${item[0]}')">${item[0]}</span> <button class="dns-btn" onclick="lookupOne('${item[0]}', ${index})"><i class="fa-solid fa-magnifying-glass"></i></button></td>
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
    if (data.security && data.security.total_threats > 0) {
        updateThreatChart(data.security);
    }
}

let threatChartInstance = null;

function updateThreatChart(secData) {
    const ctx = document.getElementById('threatChart').getContext('2d');
    const types = Object.keys(secData.stats);
    const counts = Object.values(secData.stats);

    // Danger colors
    const colors = ['#f85149', '#e3b341', '#a371f7', '#d2a8ff', '#ff7b72'];

    if (threatChartInstance) threatChartInstance.destroy();

    threatChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: types,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#e6edf3' } }
            }
        }
    });
}


// ... updateCharts ... (keep as is)

// User Journey Modal Logic
async function openJourneyModal(ip) {
    const modal = document.getElementById('journeyModal');
    const titleIp = document.getElementById('journey-ip');
    const tbody = document.querySelector('#journeyTable tbody');
    const path = document.getElementById('logPath').value;

    titleIp.textContent = ip;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    modal.classList.remove('hidden');

    try {
        const response = await fetch('/api/ip_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filepath: path, ip: ip })
        });
        const data = await response.json();

        tbody.innerHTML = '';
        if (data.history && data.history.length > 0) {
            data.history.forEach(item => {
                const row = document.createElement('tr');
                // Parse simplified request: "GET /foo HTTP/1.1" -> "GET /foo"
                let methodPath = item.request;
                try { methodPath = item.request.split(' ').slice(0, 2).join(' '); } catch (e) { }

                // Status Color
                let stClass = '';
                if (item.status >= 400 && item.status < 500) stClass = 'status-4xx';
                else if (item.status >= 500) stClass = 'status-5xx';
                else if (item.status >= 200 && item.status < 300) stClass = 'status-2xx';

                row.innerHTML = `
                    <td style="font-size:0.8rem">${item.time}</td>
                    <td title="${item.request}">${methodPath}</td>
                    <td class="${stClass}">${item.status}</td>
                    <td style="font-size:0.75rem; color:#888;">${item.referer === '-' ? '(Direct)' : item.referer.substring(0, 30) + '...'}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No history found.</td></tr>';
        }

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error fetching history</td></tr>';
    }
}

function closeJourneyModal() {
    document.getElementById('journeyModal').classList.add('hidden');
}

// Make sure close modal when clicking outside
window.onclick = function (event) {
    const m1 = document.getElementById('fileBrowser');
    const m2 = document.getElementById('journeyModal');
    if (event.target == m1) m1.classList.add('hidden');
    if (event.target == m2) m2.classList.add('hidden');
}

function updateCharts(data) {
    const t = translations[currentLang];
    const hours = Object.keys(data.hourly_stats);
    const hourCounts = Object.values(data.hourly_stats);
    const isDark = currentTheme === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#e6edf3' : '#24292f';

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
                y: { grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { color: gridColor }, ticks: { color: textColor } }
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
            plugins: { legend: { position: 'right', labels: { color: textColor } } }
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

            // New lines detected, trigger silent dashboard update
            // Debounce or just call it? calling it every 2s is fine for local.
            startAnalysis(true);
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
