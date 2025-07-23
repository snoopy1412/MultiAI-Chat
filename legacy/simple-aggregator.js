const puppeteer = require('puppeteer');

class SimpleAIAggregator {
    constructor() {
        this.browser = null;
        this.pages = {};
        // 使用更容易访问的AI网站
        this.sites = {
            chatgpt: {
                url: 'https://chat.openai.com/',
                name: 'ChatGPT',
                selectors: {
                    input: '#prompt-textarea, [data-id="root"] textarea',
                    sendButton: '[data-testid="send-button"], button[type="submit"]'
                }
            },
            claude: {
                url: 'https://claude.ai/',
                name: 'Claude',
                selectors: {
                    input: 'div[contenteditable="true"], textarea',
                    sendButton: 'button[type="submit"], .send-button'
                }
            },
            gemini: {
                url: 'https://gemini.google.com/',
                name: 'Google Gemini',
                selectors: {
                    input: 'rich-textarea, textarea',
                    sendButton: 'button[type="submit"], .send-button'
                }
            }
        };
    }

    async init() {
        console.log('🚀 启动简化版AI聚合器...');
        
        try {
            this.browser = await puppeteer.launch({
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                headless: false,
                defaultViewport: null,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-features=VizDisplayCompositor'
                ],
                timeout: 30000
            });
            
            console.log('✅ 浏览器启动成功');
            
            // 只打开一个测试页面
            const page = await this.browser.newPage();
            await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
            console.log('✅ 测试页面加载成功');
            
            console.log('\n🎯 建议使用方案:');
            console.log('1. 手动在浏览器中打开以下网站:');
            console.log('   - https://chat.openai.com/');
            console.log('   - https://claude.ai/');
            console.log('   - https://gemini.google.com/');
            console.log('2. 使用本程序提供的复制粘贴功能');
            
            return true;
            
        } catch (error) {
            console.error('❌ 启动失败:', error.message);
            throw error;
        }
    }

    async openManualSites() {
        console.log('🌐 为您打开AI网站...');
        
        for (const [key, site] of Object.entries(this.sites)) {
            try {
                const page = await this.browser.newPage();
                await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                console.log(`✅ ${site.name} 已在新标签页打开`);
                this.pages[key] = page;
            } catch (error) {
                console.log(`⚠️  ${site.name} 打开失败: ${error.message}`);
            }
        }
    }

    async sendMessage(message) {
        if (!message || !message.trim()) {
            console.log('❌ 消息不能为空');
            return;
        }

        console.log(`\n💬 准备发送消息: "${message}"`);
        console.log('📋 消息已复制到剪贴板，请手动粘贴到各个AI网站');
        
        // 复制到剪贴板 (macOS)
        const { exec } = require('child_process');
        exec(`echo "${message}" | pbcopy`, (error) => {
            if (error) {
                console.log('⚠️  无法自动复制到剪贴板，请手动复制以下消息:');
                console.log(`"${message}"`);
            } else {
                console.log('✅ 消息已复制到剪贴板');
            }
        });

        // 提供手动操作指导
        console.log('\n📝 操作步骤:');
        console.log('1. 在各个AI网站的输入框中按 Cmd+V 粘贴消息');
        console.log('2. 按回车或点击发送按钮');
        console.log('3. 查看不同AI的回答对比');

        return [
            { site: 'Manual Operation', status: 'success', message: '请手动粘贴消息' }
        ];
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }
}

module.exports = SimpleAIAggregator;