#!/usr/bin/env node

const SimpleAIAggregator = require('./simple-aggregator');
const readline = require('readline');

class SimpleAggregatorCLI {
    constructor() {
        this.aggregator = new SimpleAIAggregator();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        this.printWelcome();
        
        try {
            await this.aggregator.init();
            console.log('\n🎉 简化版AI聚合器准备就绪！');
            this.showHelp();
            await this.startInteractiveMode();
            
        } catch (error) {
            console.error('❌ 启动失败:', error.message);
            process.exit(1);
        }
    }

    printWelcome() {
        console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│        🤖 简化版AI聊天聚合器 v1.0                  │
│                                                 │
│     复制消息到剪贴板，手动粘贴到各AI网站            │
│                                                 │
└─────────────────────────────────────────────────┘
        `);
    }

    showHelp() {
        console.log(`
📚 使用说明:
   输入消息      - 复制到剪贴板，手动粘贴到AI网站
   /open        - 打开AI网站标签页
   /sites       - 显示推荐的AI网站列表
   /help        - 显示帮助信息
   /quit        - 退出程序
   
💡 推荐的AI网站:
   • ChatGPT: https://chat.openai.com/
   • Claude: https://claude.ai/
   • Google Gemini: https://gemini.google.com/
   • 文心一言: https://yiyan.baidu.com/
   • 通义千问: https://qianwen.aliyun.com/
`);
    }

    async startInteractiveMode() {
        this.prompt();
    }

    prompt() {
        this.rl.question('\n💬 请输入消息 (输入 /help 查看帮助): ', async (input) => {
            const command = input.trim();
            
            if (!command) {
                console.log('⚠️  请输入有效的消息或命令');
                this.prompt();
                return;
            }

            try {
                await this.handleCommand(command);
            } catch (error) {
                console.error('❌ 处理命令时出错:', error.message);
            }
            
            this.prompt();
        });
    }

    async handleCommand(command) {
        switch (command.toLowerCase()) {
            case '/help':
                this.showHelp();
                break;
                
            case '/quit':
            case '/exit':
                console.log('👋 正在关闭AI聚合器...');
                await this.aggregator.close();
                process.exit(0);
                break;
                
            case '/open':
                await this.aggregator.openManualSites();
                break;
                
            case '/sites':
                this.showSites();
                break;
                
            default:
                if (command.startsWith('/')) {
                    console.log('❌ 未知命令，输入 /help 查看可用命令');
                } else {
                    await this.aggregator.sendMessage(command);
                }
                break;
        }
    }

    showSites() {
        console.log('\n🌐 推荐的AI网站列表:');
        console.log('=' * 40);
        console.log('1. ChatGPT: https://chat.openai.com/');
        console.log('2. Claude: https://claude.ai/');
        console.log('3. Google Gemini: https://gemini.google.com/');
        console.log('4. 文心一言: https://yiyan.baidu.com/');
        console.log('5. 通义千问: https://qianwen.aliyun.com/');
        console.log('6. Kimi: https://kimi.moonshot.cn/');
        console.log('7. DeepSeek: https://chat.deepseek.com/');
        console.log('\n💡 使用 /open 命令可以自动打开这些网站');
    }

    async cleanup() {
        console.log('\n🧹 正在清理资源...');
        if (this.aggregator) {
            await this.aggregator.close();
        }
        if (this.rl) {
            this.rl.close();
        }
    }
}

// 处理程序退出
process.on('SIGINT', async () => {
    console.log('\n\n⚡ 检测到中断信号...');
    const cli = new SimpleAggregatorCLI();
    await cli.cleanup();
    process.exit(0);
});

// 启动程序
if (require.main === module) {
    const cli = new SimpleAggregatorCLI();
    cli.start().catch(error => {
        console.error('程序启动失败:', error);
        process.exit(1);
    });
}

module.exports = SimpleAggregatorCLI;