// AI网站配置
const AI_SITES = {
    'chat.openai.com': {
        name: 'ChatGPT',
        selectors: {
            input: '#prompt-textarea, textarea[placeholder*="Message"], [data-id="root"] textarea',
            sendButton: '[data-testid="send-button"], button[aria-label*="Send"], button:has(svg[data-icon="arrow-up"])'
        }
    },
    'claude.ai': {
        name: 'Claude',
        selectors: {
            input: 'div[contenteditable="true"], textarea[placeholder*="Talk"], .ProseMirror',
            sendButton: 'button[aria-label*="Send"], button:has(svg), .send-button'
        }
    },
    'gemini.google.com': {
        name: 'Gemini',
        selectors: {
            input: 'rich-textarea, textarea[aria-label*="Enter"], .ql-editor',
            sendButton: 'button[aria-label*="Send"], button:has(mat-icon), .send-button'
        }
    },
    'www.kimi.com': {
        name: 'Kimi',
        selectors: {
            input: '.chat-input-editor[contenteditable="true"], .chat-input-editor, [data-lexical-editor="true"], div[contenteditable="true"][role="textbox"], textarea, [role="textbox"]',
            sendButton: 'button[aria-label*="发送"], button:has(svg), button[type="submit"], .send-button, button'
        }
    },
    'kimi.moonshot.cn': {
        name: 'Kimi (旧版)',
        selectors: {
            input: 'textarea[placeholder*="请输入"], textarea[placeholder*="有什么"], .input-area textarea',
            sendButton: 'button:has(svg), .send-btn, button[type="submit"]'
        }
    },
    'chat.qwen.ai': {
        name: '通义千问',
        selectors: {
            input: 'textarea[placeholder*="请输入"], textarea[placeholder*="有什么问题"], div[contenteditable="true"], .input-box textarea',
            sendButton: 'button[aria-label*="发送"], button:has(svg), .send-button, button[type="submit"]'
        }
    },
    'qianwen.aliyun.com': {
        name: '通义千问 (旧版)',
        selectors: {
            input: 'textarea[placeholder*="请输入"], .input-wrap textarea, textarea[aria-label*="输入"]',
            sendButton: 'button:has(svg), .send-button, button[aria-label*="发送"]'
        }
    },
    'chat.deepseek.com': {
        name: 'DeepSeek',
        selectors: {
            input: 'textarea[placeholder*="Send"], textarea[placeholder*="请输入"], .message-input textarea',
            sendButton: 'button:has(svg), .send-button, button[type="submit"]'
        }
    },
    'yiyan.baidu.com': {
        name: '文心一言',
        selectors: {
            input: 'textarea[placeholder*="请输入"], .input-area textarea, textarea[aria-label*="输入"]',
            sendButton: 'button:has(svg), .send-btn, button[aria-label*="发送"]'
        }
    }
};

class AIAggregatorContent {
    constructor() {
        this.currentSite = this.detectSite();
        this.isInjected = false;
        this.init();
    }

    detectSite() {
        const hostname = window.location.hostname;
        return AI_SITES[hostname] || null;
    }

    init() {
        if (!this.currentSite) {
            console.log('AI聚合器: 当前网站不支持');
            return;
        }

        console.log(`AI聚合器: 已注入 ${this.currentSite.name}`);
        this.addExtensionIndicator();
        this.setupMessageListener();
        this.isInjected = true;
    }

    addExtensionIndicator() {
        // 添加一个小的视觉指示器，表明扩展已激活
        const indicator = document.createElement('div');
        indicator.id = 'ai-aggregator-indicator';
        indicator.innerHTML = '🤖 AI聚合器已激活';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.5s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(indicator);

        // 3秒后自动隐藏
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.animation = 'slideIn 0.5s ease-out reverse';
                setTimeout(() => indicator.remove(), 500);
            }
        }, 3000);
    }

    setupMessageListener() {
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('AI聚合器: 收到消息', message);

            if (message.type === 'SEND_MESSAGE') {
                this.sendMessage(message.text)
                    .then(result => {
                        sendResponse({
                            success: true,
                            site: this.currentSite.name,
                            result: result
                        });
                    })
                    .catch(error => {
                        sendResponse({
                            success: false,
                            site: this.currentSite.name,
                            error: error.message
                        });
                    });
                return true; // 保持消息通道开放
            }

            if (message.type === 'CHECK_STATUS') {
                sendResponse({
                    success: true,
                    site: this.currentSite.name,
                    ready: this.isInputReady()
                });
            }
        });
    }

    async sendMessage(text) {
        if (!text || !text.trim()) {
            throw new Error('消息内容为空');
        }

        const inputElement = await this.findInputElement();
        if (!inputElement) {
            throw new Error('未找到输入框');
        }

        // 清空并输入消息
        await this.clearAndTypeMessage(inputElement, text);

        // 等待一下确保输入完成
        await this.wait(500);

        // 查找并点击发送按钮
        const sendButton = await this.findSendButton();
        if (sendButton) {
            sendButton.click();
            return '消息已发送';
        } else {
            // 如果找不到发送按钮，尝试按Enter键
            inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
            return '消息已发送(使用回车键)';
        }
    }

    async findInputElement() {
        const selectors = this.currentSite.selectors.input.split(', ');
        
        console.log(`AI聚合器: 在 ${this.currentSite.name} 中查找输入框`);
        console.log(`AI聚合器: 使用选择器:`, selectors);
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`AI聚合器: 选择器 "${selector}" 找到 ${elements.length} 个元素`);
            
            for (const element of elements) {
                if (this.isElementVisible(element) && !element.disabled) {
                    console.log(`AI聚合器: 找到可用输入框:`, element);
                    return element;
                }
            }
        }

        // 如果直接选择器找不到，尝试更广泛的搜索
        console.log(`AI聚合器: 直接选择器未找到，尝试通用搜索`);
        const allTextAreas = document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"], [role="textbox"]');
        console.log(`AI聚合器: 通用搜索找到 ${allTextAreas.length} 个可能的输入元素`);
        
        for (const element of allTextAreas) {
            if (this.isElementVisible(element) && !element.disabled) {
                const rect = element.getBoundingClientRect();
                console.log(`AI聚合器: 检查元素尺寸:`, rect.width, 'x', rect.height);
                if (rect.width > 100 && rect.height > 20) { // 降低高度要求
                    console.log(`AI聚合器: 通用搜索找到合适输入框:`, element);
                    return element;
                }
            }
        }

        console.log(`AI聚合器: 在 ${this.currentSite.name} 中未找到任何输入框`);
        return null;
    }

    async findSendButton() {
        const selectors = this.currentSite.selectors.sendButton.split(', ');
        
        console.log(`AI聚合器: 在 ${this.currentSite.name} 中查找发送按钮`);
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`AI聚合器: 发送按钮选择器 "${selector}" 找到 ${elements.length} 个元素`);
            
            for (const element of elements) {
                if (this.isElementVisible(element) && !element.disabled) {
                    console.log(`AI聚合器: 找到可用发送按钮:`, element);
                    return element;
                }
            }
        }

        // 特别针对Kimi查找发送按钮（可能在输入框附近）
        if (this.currentSite.name === 'Kimi') {
            const chatInput = document.querySelector('.chat-input');
            if (chatInput) {
                const nearbyButtons = chatInput.parentElement?.querySelectorAll('button') || [];
                for (const button of nearbyButtons) {
                    if (this.isElementVisible(button) && !button.disabled) {
                        console.log(`AI聚合器: 在Kimi聊天输入区域找到按钮:`, button);
                        return button;
                    }
                }
            }
        }

        // 尝试查找包含"发送"、"Send"等文字的按钮
        const buttons = document.querySelectorAll('button');
        console.log(`AI聚合器: 通用搜索找到 ${buttons.length} 个按钮`);
        
        for (const button of buttons) {
            const text = button.textContent?.toLowerCase();
            const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
            
            if ((text && (text.includes('send') || text.includes('发送') || text.includes('提交'))) ||
                (ariaLabel && (ariaLabel.includes('send') || ariaLabel.includes('发送')))) {
                if (this.isElementVisible(button) && !button.disabled) {
                    console.log(`AI聚合器: 通过文本找到发送按钮:`, button);
                    return button;
                }
            }
        }

        console.log(`AI聚合器: 在 ${this.currentSite.name} 中未找到发送按钮`);
        return null;
    }

    async clearAndTypeMessage(element, text) {
        // 聚焦元素
        element.focus();
        await this.wait(100);
        
        if (element.contentEditable === 'true') {
            // 特殊处理Kimi的Lexical编辑器
            if (element.hasAttribute('data-lexical-editor')) {
                // 清空内容
                element.innerHTML = '<p><br></p>';
                
                // 创建文本节点并插入
                const p = element.querySelector('p');
                if (p) {
                    p.innerHTML = '';
                    p.textContent = text;
                } else {
                    element.innerHTML = `<p>${text}</p>`;
                }
                
                // 触发多种事件
                const events = ['input', 'textInput', 'keydown', 'keyup', 'change'];
                events.forEach(eventType => {
                    element.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
                
                // 模拟键盘输入事件
                element.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'a',
                    bubbles: true
                }));
                
            } else {
                // 普通contenteditable元素
                element.innerHTML = '';
                element.textContent = text;
                
                // 触发input事件
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else {
            // 对于textarea和input元素
            element.value = '';
            element.value = text;
            
            // 触发多个事件确保框架能检测到变化
            ['input', 'change', 'keyup'].forEach(eventType => {
                element.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
        }
        
        // 等待一下确保输入完成
        await this.wait(200);
    }

    isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0;
    }

    isInputReady() {
        const inputElement = document.querySelector(this.currentSite.selectors.input);
        return inputElement && this.isElementVisible(inputElement);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化内容脚本
function initializeAIAggregator() {
    try {
        console.log('AI聚合器: 开始初始化内容脚本');
        new AIAggregatorContent();
    } catch (error) {
        console.error('AI聚合器: 初始化失败', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAIAggregator);
} else {
    initializeAIAggregator();
}

// 确保脚本已加载的标记
window.aiAggregatorLoaded = true;
console.log('AI聚合器: Content script 已加载');