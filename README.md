# 🤖 MultiAI Chat

<div align="center">

**同时向多个AI聊天网站发送消息，对比不同AI的回答**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](browser-extension/)
[![Version](https://img.shields.io/badge/version-1.0.0-green)](package.json)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

</div>

## 🌟 什么是 MultiAI Chat？

MultiAI Chat 是一个Chrome浏览器扩展，让你可以同时向多个AI聊天网站发送消息并对比它们的回答。一键获得不同AI模型的多样化观点！

## ✨ 功能特色

- 🎯 **一键群发**: 同时向所有AI网站发送消息
- 🔍 **智能检测**: 自动识别已打开的AI网站
- 📊 **实时状态**: 显示每个AI网站的就绪状态
- 💾 **消息记忆**: 记住你上次的输入内容
- 🚀 **快捷键**: Ctrl+Enter (Windows) 或 Cmd+Enter (Mac) 快速发送
- 🎨 **现代界面**: 简洁直观的用户界面
- 🔒 **隐私优先**: 不收集数据，本地处理

## 🤖 支持的AI平台

| 平台 | 网站 | 状态 |
|------|------|------|
| ChatGPT | chat.openai.com | ✅ 支持 |
| Claude | claude.ai | ✅ 支持 |
| Google Gemini | gemini.google.com | ✅ 支持 |
| Kimi | www.kimi.com | ✅ 支持 |
| 通义千问 | chat.qwen.ai | ✅ 支持 |
| DeepSeek | chat.deepseek.com | ✅ 支持 |
| 文心一言 | yiyan.baidu.com | ✅ 支持 |

## 🚀 安装使用

### 安装方法

1. **下载项目**: 下载或克隆此仓库到本地
2. **打开Chrome扩展页面**: 访问 `chrome://extensions/`
3. **启用开发者模式**: 点击右上角的开发者模式开关
4. **加载扩展**: 点击"加载已解压的扩展程序"，选择 `browser-extension` 文件夹
5. **完成**: 扩展图标将出现在工具栏中

### 使用方法

1. **打开AI网站**: 在不同标签页中打开并登录你要使用的AI网站
2. **点击扩展图标**: 点击浏览器工具栏中的MultiAI Chat图标
3. **输入消息**: 在弹窗中输入你的问题
4. **发送**: 点击"发送到所有AI"或使用Ctrl+Enter
5. **查看回答**: 切换标签页查看各个AI的回答

## 📁 项目结构

```
multiai-chat/
├── browser-extension/          # Chrome扩展文件
│   ├── manifest.json          # 扩展配置
│   ├── popup.html             # 弹窗界面
│   ├── popup.js               # 弹窗逻辑
│   ├── content.js             # 内容脚本
│   ├── background.js          # 后台脚本
│   └── welcome.html           # 欢迎页面
├── legacy/                    # 历史版本 (Puppeteer等)
├── package.json               # Node.js配置
├── LICENSE                    # MIT许可证
└── README.md                  # 项目说明
```

## ❓ 常见问题

**Q: 某个AI网站显示"未就绪"怎么办？**
A: 确保你已在该网站登录，页面完全加载完成。

**Q: 消息发送失败？**
A: 刷新对应的AI网站页面，确保没有弹窗或验证码阻挡。

**Q: 扩展图标不显示？**
A: 点击浏览器工具栏右侧的拼图图标，找到并固定MultiAI Chat。

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/your-username/multiai-chat.git

# 进入项目目录
cd multiai-chat

# 在Chrome中加载扩展
# 访问 chrome://extensions/，启用开发者模式，
# 然后加载 browser-extension 文件夹
```

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进这个工具！

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个星星！**

**🐛 发现问题？** [提交Issue](https://github.com/your-username/multiai-chat/issues)

</div>