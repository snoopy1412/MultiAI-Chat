class AIAggregatorPopup {
    constructor() {
        this.supportedSites = {
            'chat.openai.com': { name: 'ChatGPT', icon: '🤖', color: '#10a37f' },
            'claude.ai': { name: 'Claude', icon: '🧠', color: '#ff6b35' },
            'gemini.google.com': { name: 'Gemini', icon: '✨', color: '#4285f4' },
            'www.kimi.com': { name: 'Kimi', icon: '🌙', color: '#ff6b35' },
            'kimi.moonshot.cn': { name: 'Kimi (旧版)', icon: '🌙', color: '#ff6b35' },
            'chat.qwen.ai': { name: '通义千问', icon: '🔥', color: '#1976d2' },
            'qianwen.aliyun.com': { name: '通义千问 (旧版)', icon: '🔥', color: '#1976d2' },
            'chat.deepseek.com': { name: 'DeepSeek', icon: '🚀', color: '#2e7d32' },
            'yiyan.baidu.com': { name: '文心一言', icon: '💖', color: '#e91e63' }
        };
        
        this.activeSites = new Map();
        this.init();
    }

    init() {
        this.bindEvents();
        this.refreshSites();
        this.loadLastMessage();
    }

    bindEvents() {
        document.getElementById('sendBtn').addEventListener('click', () => this.sendToAllSites());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshSites());
        
        // 回车键发送（Ctrl+Enter 或 Cmd+Enter）
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.sendToAllSites();
            }
        });

        // 保存输入内容
        document.getElementById('messageInput').addEventListener('input', (e) => {
            chrome.storage.local.set({ lastMessage: e.target.value });
        });
    }

    async loadLastMessage() {
        try {
            const result = await chrome.storage.local.get(['lastMessage']);
            if (result.lastMessage) {
                document.getElementById('messageInput').value = result.lastMessage;
            }
        } catch (error) {
            console.error('加载上次消息失败:', error);
        }
    }

    async refreshSites() {
        const sitesList = document.getElementById('sitesList');
        sitesList.innerHTML = '';
        this.activeSites.clear();

        try {
            const tabs = await chrome.tabs.query({});
            
            for (const tab of tabs) {
                const url = new URL(tab.url);
                const hostname = url.hostname;
                
                if (this.supportedSites[hostname]) {
                    const siteInfo = this.supportedSites[hostname];
                    const siteItem = this.createSiteItem(siteInfo, tab, 'loading');
                    sitesList.appendChild(siteItem);
                    
                    // 检查网站状态
                    this.checkSiteStatus(tab, siteInfo, siteItem);
                }
            }

            if (sitesList.children.length === 0) {
                sitesList.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #666;">
                        <p>未找到支持的AI网站</p>
                        <p style="font-size: 12px; margin-top: 8px;">
                            请先打开 ChatGPT、Claude、Kimi、通义千问 等AI网站
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('刷新网站状态失败:', error);
            sitesList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #dc3545;">
                    刷新失败: ${error.message}
                </div>
            `;
        }
    }

    createSiteItem(siteInfo, tab, status) {
        const item = document.createElement('div');
        item.className = 'site-item';
        item.innerHTML = `
            <div class="site-info">
                <div class="site-icon" style="background: ${siteInfo.color};">
                    ${siteInfo.icon}
                </div>
                <div class="site-name">${siteInfo.name}</div>
            </div>
            <div class="site-status status-${status}" id="status-${tab.id}">
                ${this.getStatusText(status)}
            </div>
        `;
        return item;
    }

    getStatusText(status) {
        switch (status) {
            case 'ready': return '✅ 就绪';
            case 'not-found': return '❌ 未就绪';
            case 'loading': return '<span class="spinner"></span> 检查中';
            default: return '❓ 未知';
        }
    }

    async checkSiteStatus(tab, siteInfo, siteItem) {
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_STATUS' });
            const statusElement = siteItem.querySelector(`#status-${tab.id}`);
            
            if (response && response.success) {
                statusElement.className = 'site-status status-ready';
                statusElement.innerHTML = this.getStatusText('ready');
                this.activeSites.set(tab.id, { ...siteInfo, tab });
            } else {
                statusElement.className = 'site-status status-not-found';
                statusElement.innerHTML = this.getStatusText('not-found');
            }
        } catch (error) {
            const statusElement = siteItem.querySelector(`#status-${tab.id}`);
            statusElement.className = 'site-status status-not-found';
            statusElement.innerHTML = this.getStatusText('not-found');
            console.error(`检查 ${siteInfo.name} 状态失败:`, error);
        }
    }

    async sendToAllSites() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) {
            this.showError('请输入消息内容');
            return;
        }

        if (this.activeSites.size === 0) {
            this.showError('没有可用的AI网站，请先打开并登录AI网站');
            return;
        }

        const sendBtn = document.getElementById('sendBtn');
        const originalText = sendBtn.textContent;
        
        try {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="spinner"></span> 发送中...';
            
            const results = [];
            const promises = Array.from(this.activeSites.entries()).map(async ([tabId, siteInfo]) => {
                try {
                    const response = await chrome.tabs.sendMessage(tabId, {
                        type: 'SEND_MESSAGE',
                        text: message
                    });
                    
                    return {
                        site: siteInfo.name,
                        success: response.success,
                        message: response.success ? '发送成功' : response.error,
                        tabId
                    };
                } catch (error) {
                    return {
                        site: siteInfo.name,
                        success: false,
                        message: error.message,
                        tabId
                    };
                }
            });

            const allResults = await Promise.all(promises);
            this.displayResults(allResults);
            
            // 清空输入框
            messageInput.value = '';
            chrome.storage.local.remove(['lastMessage']);
            
        } catch (error) {
            this.showError('发送消息时出错: ' + error.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
        }
    }

    displayResults(results) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsList = document.getElementById('resultsList');
        
        resultsList.innerHTML = '';
        
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${result.success ? 'result-success' : 'result-error'}`;
            resultItem.innerHTML = `
                <div class="result-site">${result.site}</div>
                <div class="result-message">${result.message}</div>
            `;
            resultsList.appendChild(resultItem);
        });
        
        resultsSection.style.display = 'block';
        
        // 显示汇总
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        if (successCount === totalCount) {
            this.showSuccess(`🎉 成功发送到所有 ${totalCount} 个AI网站`);
        } else {
            this.showWarning(`⚠️ 成功发送到 ${successCount}/${totalCount} 个AI网站`);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showNotification(message, type) {
        // 创建临时通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            padding: 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = '#d4edda';
                notification.style.color = '#155724';
                notification.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                notification.style.background = '#f8d7da';
                notification.style.color = '#721c24';
                notification.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                notification.style.background = '#fff3cd';
                notification.style.color = '#856404';
                notification.style.border = '1px solid #ffeaa7';
                break;
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// 初始化popup
document.addEventListener('DOMContentLoaded', () => {
    new AIAggregatorPopup();
});