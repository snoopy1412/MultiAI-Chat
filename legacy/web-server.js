const express = require('express');
const path = require('path');
const AIAggregator = require('./ai-automation');

class AIAggregatorWebServer {
    constructor() {
        this.app = express();
        this.port = 3000;
        this.aggregator = null;
        this.isInitialized = false;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    setupRoutes() {
        // 主页面
        this.app.get('/', (req, res) => {
            res.send(this.getWebInterface());
        });

        // 初始化AI聚合器
        this.app.post('/api/init', async (req, res) => {
            try {
                if (this.isInitialized) {
                    return res.json({ success: true, message: 'Already initialized' });
                }

                this.aggregator = new AIAggregator();
                await this.aggregator.init();
                this.isInitialized = true;
                
                res.json({ success: true, message: 'AI聚合器初始化成功' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 发送消息
        this.app.post('/api/send', async (req, res) => {
            try {
                if (!this.isInitialized || !this.aggregator) {
                    return res.status(400).json({ 
                        success: false, 
                        error: '请先初始化AI聚合器' 
                    });
                }

                const { message } = req.body;
                if (!message || !message.trim()) {
                    return res.status(400).json({ 
                        success: false, 
                        error: '消息不能为空' 
                    });
                }

                const results = await this.aggregator.sendMessage(message);
                res.json({ success: true, results });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 截图
        this.app.post('/api/screenshot', async (req, res) => {
            try {
                if (!this.isInitialized || !this.aggregator) {
                    return res.status(400).json({ 
                        success: false, 
                        error: '请先初始化AI聚合器' 
                    });
                }

                await this.aggregator.takeScreenshots();
                res.json({ success: true, message: '截图完成' });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // 关闭聚合器
        this.app.post('/api/close', async (req, res) => {
            try {
                if (this.aggregator) {
                    await this.aggregator.close();
                    this.aggregator = null;
                    this.isInitialized = false;
                }
                res.json({ success: true, message: '已关闭AI聚合器' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    getWebInterface() {
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI聊天聚合器 - Web控制台</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 30px;
        }
        
        .status {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            font-weight: bold;
        }
        
        .status.disconnected {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
        
        .status.connected {
            background: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        
        .status.loading {
            background: #fff3e0;
            color: #ef6c00;
            border: 1px solid #ffcc02;
        }
        
        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-secondary {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .btn-danger {
            background: #f44336;
            color: white;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .message-section {
            margin-top: 30px;
        }
        
        .message-input {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        #messageInput {
            flex: 1;
            padding: 15px;
            border: 2px solid #e1e1e1;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.3s;
        }
        
        #messageInput:focus {
            border-color: #667eea;
        }
        
        .results {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .result-item {
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 6px;
            background: white;
            border-left: 4px solid #ddd;
        }
        
        .result-item.success {
            border-left-color: #4caf50;
        }
        
        .result-item.failed {
            border-left-color: #f44336;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI聊天聚合器</h1>
            <p>Web控制台 - 同时向多个AI发送消息</p>
        </div>
        
        <div class="content">
            <div id="status" class="status disconnected">
                ⚡ 未连接 - 请点击"启动聚合器"开始使用
            </div>
            
            <div class="controls">
                <button id="initBtn" class="btn-primary">🚀 启动聚合器</button>
                <button id="screenshotBtn" class="btn-secondary" disabled>📸 截图</button>
                <button id="closeBtn" class="btn-danger" disabled>🔒 关闭</button>
            </div>
            
            <div class="message-section">
                <div class="message-input">
                    <input type="text" id="messageInput" placeholder="输入您要发送的消息..." disabled>
                    <button id="sendBtn" class="btn-primary" disabled>发送</button>
                </div>
                
                <div id="results" class="results hidden">
                    <h3>📊 发送结果:</h3>
                    <div id="resultsList"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const statusEl = document.getElementById('status');
        const initBtn = document.getElementById('initBtn');
        const screenshotBtn = document.getElementById('screenshotBtn');
        const closeBtn = document.getElementById('closeBtn');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const resultsEl = document.getElementById('results');
        const resultsListEl = document.getElementById('resultsList');

        let isConnected = false;

        function setStatus(message, type = 'disconnected') {
            statusEl.textContent = message;
            statusEl.className = 'status ' + type;
        }

        function toggleButtons(connected) {
            isConnected = connected;
            initBtn.disabled = connected;
            screenshotBtn.disabled = !connected;
            closeBtn.disabled = !connected;
            messageInput.disabled = !connected;
            sendBtn.disabled = !connected;
        }

        async function apiCall(endpoint, data = null) {
            const options = {
                method: data ? 'POST' : 'GET',
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(endpoint, options);
            return await response.json();
        }

        initBtn.addEventListener('click', async () => {
            setStatus('🔄 正在启动聚合器...', 'loading');
            initBtn.innerHTML = '<span class="spinner"></span> 启动中...';
            
            try {
                const result = await apiCall('/api/init');
                if (result.success) {
                    setStatus('✅ 聚合器已启动 - 可以发送消息了', 'connected');
                    toggleButtons(true);
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                setStatus('❌ 启动失败: ' + error.message, 'disconnected');
            } finally {
                initBtn.innerHTML = '🚀 启动聚合器';
            }
        });

        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) {
                alert('请输入消息内容');
                return;
            }

            setStatus('📤 正在发送消息...', 'loading');
            sendBtn.innerHTML = '<span class="spinner"></span> 发送中...';
            
            try {
                const result = await apiCall('/api/send', { message });
                if (result.success) {
                    setStatus('✅ 消息发送完成', 'connected');
                    displayResults(result.results);
                    messageInput.value = '';
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                setStatus('❌ 发送失败: ' + error.message, 'disconnected');
            } finally {
                sendBtn.innerHTML = '发送';
            }
        }

        function displayResults(results) {
            resultsEl.classList.remove('hidden');
            resultsListEl.innerHTML = '';
            
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'result-item ' + result.status;
                item.innerHTML = 
                    '<strong>' + result.site + '</strong>: ' + 
                    (result.status === 'success' ? '✅ 发送成功' : '❌ 发送失败') +
                    (result.error ? '<br><small>错误: ' + result.error + '</small>' : '');
                resultsListEl.appendChild(item);
            });
        }

        screenshotBtn.addEventListener('click', async () => {
            setStatus('📸 正在截图...', 'loading');
            
            try {
                const result = await apiCall('/api/screenshot');
                if (result.success) {
                    setStatus('✅ 截图完成', 'connected');
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                setStatus('❌ 截图失败: ' + error.message, 'connected');
            }
        });

        closeBtn.addEventListener('click', async () => {
            if (confirm('确定要关闭AI聚合器吗？')) {
                setStatus('🔄 正在关闭...', 'loading');
                
                try {
                    await apiCall('/api/close');
                    setStatus('⚡ 已关闭 - 点击"启动聚合器"重新开始', 'disconnected');
                    toggleButtons(false);
                    resultsEl.classList.add('hidden');
                } catch (error) {
                    setStatus('❌ 关闭失败: ' + error.message, 'connected');
                }
            }
        });
    </script>
</body>
</html>
        `;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│         🌐 AI聚合器 Web服务已启动                 │
│                                                 │
│         访问地址: http://localhost:${this.port}        │
│                                                 │
└─────────────────────────────────────────────────┘
            `);
        });

        // 优雅关闭
        process.on('SIGINT', async () => {
            console.log('\n🛑 正在关闭Web服务...');
            if (this.aggregator) {
                await this.aggregator.close();
            }
            process.exit(0);
        });
    }
}

if (require.main === module) {
    const server = new AIAggregatorWebServer();
    server.start();
}

module.exports = AIAggregatorWebServer;