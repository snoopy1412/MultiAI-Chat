#!/usr/bin/env node

const AIAggregator = require('./ai-automation');
const readline = require('readline');

class AIAggregatorCLI {
    constructor() {
        this.aggregator = new AIAggregator();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        this.printWelcome();
        
        try {
            await this.aggregator.init();
            console.log('\n🎉 AI聚合器准备就绪！');
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
│           🤖 AI聊天聚合器 v1.0                    │
│                                                 │
│    同时向 Kimi、通义千问、DeepSeek 发送消息         │
│                                                 │
└─────────────────────────────────────────────────┘
        `);
    }

    showHelp() {
        console.log(`
📚 使用说明:
   直接输入消息 - 向所有AI发送消息
   /help       - 显示帮助信息
   /screenshot - 截取所有页面截图
   /quit       - 退出程序
   
💡 提示: 程序启动后会自动打开三个浏览器标签页
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
                
            case '/screenshot':
                await this.aggregator.takeScreenshots();
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
    const cli = new AIAggregatorCLI();
    await cli.cleanup();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

// 启动程序
if (require.main === module) {
    const cli = new AIAggregatorCLI();
    cli.start().catch(error => {
        console.error('程序启动失败:', error);
        process.exit(1);
    });
}

module.exports = AIAggregatorCLI;