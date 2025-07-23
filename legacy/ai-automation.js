const puppeteer = require('puppeteer');

class AIAggregator {
    constructor() {
        this.browser = null;
        this.pages = {};
        this.sites = {
            kimi: {
                url: 'https://kimi.moonshot.cn/',
                name: 'Kimi AI',
                selectors: {
                    input: 'textarea[placeholder*="请输入"], textarea[placeholder*="有什么"], div[contenteditable="true"]',
                    sendButton: 'button[type="submit"], button:has(svg), .send-button'
                },
                requiresLogin: true
            },
            qwen: {
                url: 'https://qianwen.aliyun.com/',
                name: '通义千问',
                selectors: {
                    input: 'textarea[placeholder*="请输入"], textarea[placeholder*="有什么"], div[contenteditable="true"]',
                    sendButton: 'button[type="submit"], button:has(svg), .send-button'
                }
            },
            deepseek: {
                url: 'https://chat.deepseek.com/',
                name: 'DeepSeek',
                selectors: {
                    input: 'textarea[placeholder*="请输入"], textarea[placeholder*="Send"], div[contenteditable="true"]',
                    sendButton: 'button[type="submit"], button:has(svg), .send-button'
                }
            }
        };
    }

    async init() {
        console.log('🚀 启动AI聚合器...');
        
        // 尝试多种启动方式
        let launchOptions = [
            {
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                headless: false,
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 30000
            },
            {
                headless: false,
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 30000
            },
            {
                headless: "new",
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                timeout: 30000
            }
        ];

        for (let i = 0; i < launchOptions.length; i++) {
            try {
                console.log(`🔄 尝试启动方式 ${i + 1}/${launchOptions.length}...`);
                this.browser = await puppeteer.launch(launchOptions[i]);
                console.log('✅ 浏览器启动成功');
                break;
            } catch (error) {
                console.warn(`⚠️  启动方式 ${i + 1} 失败: ${error.message}`);
                if (i === launchOptions.length - 1) {
                    throw new Error(`所有浏览器启动方式都失败了。请检查系统环境。最后错误: ${error.message}`);
                }
            }
        }

        await this.openAllSites();
    }

    async openAllSites() {
        console.log('📱 打开所有AI网站...');
        
        for (const [key, site] of Object.entries(this.sites)) {
            let retries = 3;
            while (retries > 0) {
                try {
                    const page = await this.browser.newPage();
                    
                    // 设置更真实的浏览器环境
                    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                    await page.setViewport({ width: 1366, height: 768 });
                    
                    // 设置额外的浏览器属性来避免检测
                    await page.evaluateOnNewDocument(() => {
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined,
                        });
                    });
                    
                    console.log(`🌐 打开 ${site.name}... (尝试 ${4-retries}/3)`);
                    
                    // 设置更长的超时时间和更宽松的等待条件
                    await page.goto(site.url, { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 45000 
                    });
                    
                    // 检查是否被阻止
                    const title = await page.title();
                    const content = await page.content();
                    
                    if (content.includes('403') || content.includes('blocked') || 
                        content.includes('禁止') || content.includes('验证') ||
                        title.includes('403') || title.includes('Access Denied')) {
                        throw new Error(`${site.name} 检测到自动化访问，被阻止了`);
                    }
                    
                    this.pages[key] = page;
                    console.log(`✅ ${site.name} 已加载`);
                    
                    // 如果需要登录，给用户提示
                    if (site.requiresLogin) {
                        console.log(`💡 ${site.name} 可能需要手动登录，请在浏览器中完成登录`);
                    }
                    
                    // 等待页面完全加载
                    await page.waitForTimeout(3000);
                    break;
                    
                } catch (error) {
                    retries--;
                    console.warn(`⚠️  ${site.name} 加载失败 (剩余重试: ${retries}): ${error.message}`);
                    
                    if (retries === 0) {
                        console.error(`❌ 无法打开 ${site.name}，已跳过`);
                    } else {
                        console.log(`🔄 ${site.name} 重试中...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        }
        
        const loadedSites = Object.keys(this.pages).length;
        console.log(`\n📊 总共成功加载 ${loadedSites}/3 个网站`);
        
        if (loadedSites === 0) {
            throw new Error('所有网站都无法加载，请检查网络连接');
        }
    }

    async sendMessage(message) {
        if (!message || !message.trim()) {
            console.log('❌ 消息不能为空');
            return;
        }

        console.log(`\n💬 发送消息: "${message}"`);
        console.log('=' * 50);

        const results = [];
        
        for (const [key, site] of Object.entries(this.sites)) {
            if (!this.pages[key]) {
                console.log(`⚠️  ${site.name} 页面未准备好`);
                continue;
            }

            try {
                console.log(`📤 向 ${site.name} 发送消息...`);
                const success = await this.sendToSite(this.pages[key], site, message);
                
                if (success) {
                    console.log(`✅ ${site.name} 发送成功`);
                    results.push({ site: site.name, status: 'success' });
                } else {
                    console.log(`❌ ${site.name} 发送失败`);
                    results.push({ site: site.name, status: 'failed' });
                }
            } catch (error) {
                console.error(`❌ ${site.name} 发送错误:`, error.message);
                results.push({ site: site.name, status: 'error', error: error.message });
            }
        }

        this.printResults(results);
        return results;
    }

    async sendToSite(page, site, message) {
        try {
            // 尝试多种输入框选择器
            const inputSelectors = site.selectors.input.split(', ');
            let inputElement = null;
            
            for (const selector of inputSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    inputElement = await page.$(selector);
                    if (inputElement) break;
                } catch (e) {
                    continue;
                }
            }

            if (!inputElement) {
                console.log(`⚠️  在 ${site.name} 中找不到输入框`);
                return false;
            }

            // 清空输入框并输入消息
            await inputElement.click();
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            
            await inputElement.type(message, { delay: 50 });
            
            // 等待一秒确保输入完成
            await page.waitForTimeout(1000);

            // 尝试多种发送按钮选择器
            const sendSelectors = site.selectors.sendButton.split(', ');
            let sendButton = null;
            
            for (const selector of sendSelectors) {
                try {
                    sendButton = await page.$(selector);
                    if (sendButton) {
                        const isVisible = await sendButton.isIntersectingViewport();
                        if (isVisible) break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (sendButton) {
                await sendButton.click();
            } else {
                // 如果找不到发送按钮，尝试按Enter键
                await page.keyboard.press('Enter');
            }

            return true;
            
        } catch (error) {
            console.error(`发送到 ${site.name} 时出错:`, error.message);
            return false;
        }
    }

    printResults(results) {
        console.log('\n📊 发送结果汇总:');
        console.log('=' * 30);
        
        results.forEach(result => {
            const statusIcon = result.status === 'success' ? '✅' : '❌';
            console.log(`${statusIcon} ${result.site}: ${result.status}`);
            if (result.error) {
                console.log(`   错误: ${result.error}`);
            }
        });
        
        const successCount = results.filter(r => r.status === 'success').length;
        console.log(`\n🎯 成功发送到 ${successCount}/${results.length} 个网站`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }

    async takeScreenshots() {
        console.log('📸 正在截屏...');
        
        for (const [key, page] of Object.entries(this.pages)) {
            if (page) {
                try {
                    await page.screenshot({
                        path: `screenshot_${key}_${Date.now()}.png`,
                        fullPage: true
                    });
                    console.log(`✅ ${this.sites[key].name} 截屏完成`);
                } catch (error) {
                    console.error(`❌ ${this.sites[key].name} 截屏失败:`, error.message);
                }
            }
        }
    }
}

module.exports = AIAggregator;