const puppeteer = require('puppeteer');

async function testBrowser() {
    console.log('🧪 测试浏览器启动...');
    
    try {
        // 先尝试最简单的启动方式
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('✅ 浏览器启动成功');
        
        const page = await browser.newPage();
        console.log('✅ 新页面创建成功');
        
        // 测试访问一个简单的页面
        await page.goto('https://www.baidu.com', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        console.log('✅ 页面加载成功');
        
        // 等待几秒让你看到页面
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await browser.close();
        console.log('✅ 浏览器关闭成功');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('完整错误:', error);
    }
}

testBrowser();