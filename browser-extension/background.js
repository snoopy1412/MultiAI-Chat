// AI聚合器后台服务
class AIAggregatorBackground {
    constructor() {
        this.init();
    }

    init() {
        // 扩展安装时的初始化
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('AI聚合器扩展已安装');
            
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onUpdate(details.previousVersion);
            }
        });

        // 扩展启动时的初始化
        chrome.runtime.onStartup.addListener(() => {
            console.log('AI聚合器扩展已启动');
        });

        // 处理来自content script和popup的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // 保持消息通道开放
        });

        // 监听标签页更新
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.onTabUpdated(tabId, changeInfo, tab);
        });

        // 监听标签页激活
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.onTabActivated(activeInfo);
        });
    }

    onFirstInstall() {
        // 首次安装时打开欢迎页面
        chrome.tabs.create({
            url: chrome.runtime.getURL('welcome.html')
        });

        // 设置默认设置
        chrome.storage.local.set({
            settings: {
                autoFocus: true,
                showNotifications: true,
                version: '1.0'
            }
        });
    }

    onUpdate(previousVersion) {
        console.log(`AI聚合器从版本 ${previousVersion} 更新到当前版本`);
        
        // 可以在这里处理版本升级逻辑
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            settings.version = '1.0';
            chrome.storage.local.set({ settings });
        });
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'GET_ACTIVE_TABS':
                this.getActiveTabs(sendResponse);
                break;
                
            case 'BROADCAST_MESSAGE':
                this.broadcastMessage(message.data, sendResponse);
                break;
                
            case 'GET_SETTINGS':
                this.getSettings(sendResponse);
                break;
                
            case 'UPDATE_SETTINGS':
                this.updateSettings(message.settings, sendResponse);
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    async getActiveTabs(sendResponse) {
        try {
            const tabs = await chrome.tabs.query({});
            const supportedSites = [
                'chat.openai.com',
                'claude.ai',
                'gemini.google.com',
                'www.kimi.com',
                'kimi.moonshot.cn',
                'chat.qwen.ai',
                'qianwen.aliyun.com',
                'chat.deepseek.com',
                'yiyan.baidu.com'
            ];

            const activeTabs = tabs.filter(tab => {
                try {
                    const url = new URL(tab.url);
                    return supportedSites.includes(url.hostname);
                } catch (e) {
                    return false;
                }
            });

            sendResponse({ success: true, tabs: activeTabs });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    async broadcastMessage(data, sendResponse) {
        try {
            const { tabs } = await chrome.tabs.query({});
            const results = [];

            for (const tab of tabs) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, data);
                    results.push({
                        tabId: tab.id,
                        success: true,
                        response
                    });
                } catch (error) {
                    results.push({
                        tabId: tab.id,
                        success: false,
                        error: error.message
                    });
                }
            }

            sendResponse({ success: true, results });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    async getSettings(sendResponse) {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const defaultSettings = {
                autoFocus: true,
                showNotifications: true,
                version: '1.0'
            };
            
            const settings = { ...defaultSettings, ...result.settings };
            sendResponse({ success: true, settings });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    async updateSettings(newSettings, sendResponse) {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const settings = { ...result.settings, ...newSettings };
            
            await chrome.storage.local.set({ settings });
            sendResponse({ success: true, settings });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }

    onTabUpdated(tabId, changeInfo, tab) {
        // 当标签页完成加载时，检查是否是支持的AI网站
        if (changeInfo.status === 'complete' && tab.url) {
            const supportedSites = [
                'chat.openai.com',
                'claude.ai',
                'gemini.google.com',
                'www.kimi.com',
                'kimi.moonshot.cn',
                'chat.qwen.ai',
                'qianwen.aliyun.com',
                'chat.deepseek.com',
                'yiyan.baidu.com'
            ];

            try {
                const url = new URL(tab.url);
                if (supportedSites.includes(url.hostname)) {
                    // 可以在这里执行一些特殊逻辑
                    console.log(`AI网站已加载: ${url.hostname}`);
                }
            } catch (e) {
                // 忽略无效URL
            }
        }
    }

    onTabActivated(activeInfo) {
        // 当用户切换到新标签页时的处理
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (chrome.runtime.lastError) return;
            
            // 可以在这里添加标签页激活时的逻辑
            console.log(`用户切换到标签页: ${tab.url}`);
        });
    }
}

// 初始化后台服务
new AIAggregatorBackground();