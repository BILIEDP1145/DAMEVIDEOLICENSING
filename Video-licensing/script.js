// 视频授权查询系统 - 主逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 核心变量
    let allLicenses = [];
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultCountSpan = document.getElementById('count');
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const themeText = themeToggle.querySelector('.theme-text');

    // 1. 加载数据
    async function loadLicenseData() {
        try {
            const response = await fetch('data/licensing.json');
            if (!response.ok) {
                throw new Error(`数据加载失败: ${response.status}`);
            }
            allLicenses = await response.json();
            console.log(`数据加载成功，共 ${allLicenses.length} 条记录。`);
        } catch (error) {
            console.error('加载授权数据时出错:', error);
            showError('无法加载数据文件，请检查 data/licensing.json 是否存在。');
            allLicenses = [];
        }
    }

    // 2. 执行搜索
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        resultsGrid.innerHTML = '';
        resultCountSpan.textContent = '0';

        if (!query) {
            showInitialState();
            return;
        }

        if (allLicenses.length === 0) {
            showError('数据未加载，请刷新页面重试。');
            return;
        }

        // 搜索逻辑：匹配序列号、授权人UID或贡献人
        const filtered = allLicenses.filter(item => {
            return item.serial.toLowerCase().includes(query) ||
                   item.authorizerUID.toLowerCase().includes(query) ||
                   (item.contributor && item.contributor.toLowerCase().includes(query));
        });

        updateResultCount(filtered.length);
        if (filtered.length === 0) {
            showNoResults(query);
        } else {
            renderResults(filtered);
        }
    }

    // 3. 渲染结果卡片
    function renderResults(licenses) {
        licenses.forEach(license => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="serial">${escapeHtml(license.serial)}</div>
                    <div class="authorizer">授权人: ${escapeHtml(license.authorizerUID)}</div>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span class="label">视频地址:</span>
                        <span class="value">
                            <a href="${escapeHtml(license.videoURL)}" target="_blank" rel="noopener noreferrer" class="video-link">
                                ${truncateUrl(license.videoURL, 25)}
                                <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                                </svg>
                            </a>
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="label">首次发布:</span>
                        <span class="value">${formatDate(license.firstPublishTime)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">授权时间:</span>
                        <span class="value">${formatDate(license.licenseTime)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    贡献人: <span class="contributor">${escapeHtml(license.contributor)}</span>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }

    // 4. 界面状态更新
    function updateResultCount(count) {
        resultCountSpan.textContent = count;
    }

    function showInitialState() {
        resultsGrid.innerHTML = `
            <div class="initial-state">
                <svg class="state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <h3>输入序列号开始查询</h3>
                <p>输入序列号（如 20250403114500bili）或授权人UID进行搜索</p>
            </div>
        `;
    }

    function showNoResults(query) {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <svg class="state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h3>未找到匹配项</h3>
                <p>没有找到与 "<strong>${escapeHtml(query)}</strong>" 相关的记录</p>
                <p>请检查序列号或UID是否正确</p>
            </div>
        `;
    }

    function showError(message) {
        resultsGrid.innerHTML = `
            <div class="error-state">
                <svg class="state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>数据加载失败</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }

    // 5. 主题切换功能
    function initTheme() {
        const savedTheme = localStorage.getItem('video-query-theme') || 'light';
        setTheme(savedTheme);
        updateThemeButton(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            updateThemeButton(newTheme);
            localStorage.setItem('video-query-theme', newTheme);
        });
    }

    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    function updateThemeButton(theme) {
        if (theme === 'dark') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
            themeText.textContent = '浅色模式';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
            themeText.textContent = '深色模式';
        }
    }

    // 6. 工具函数
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncateUrl(url, maxLength = 25) {
        if (!url) return '';
        if (url.length <= maxLength) return url;
        
        // 保留协议和域名部分
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname;
            const total = domain.length + path.length;
            
            if (total <= maxLength) {
                return domain + path;
            } else if (domain.length + 3 <= maxLength) {
                const remaining = maxLength - domain.length - 3;
                return domain + path.substring(0, remaining) + '...';
            } else {
                return domain.substring(0, maxLength - 3) + '...';
            }
        } catch {
            return url.length <= maxLength ? url : url.substring(0, maxLength - 3) + '...';
        }
    }

    function formatDate(isoString) {
        if (!isoString) return '未知';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return '无效日期';
            
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }) + ' ' + date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return isoString;
        }
    }

    // 7. 事件监听与初始化
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // 输入时实时搜索（防抖处理）
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchInput.value.trim().length >= 3) {
                performSearch();
            } else if (searchInput.value.trim().length === 0) {
                showInitialState();
                updateResultCount(0);
            }
        }, 300);
    });

    // 初始化
    loadLicenseData();
    initTheme();
    showInitialState();
});