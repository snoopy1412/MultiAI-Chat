function openAllSites() {
    const sites = [
        'https://chat.openai.com/',
        'https://claude.ai/',
        'https://gemini.google.com/',
        'https://www.kimi.com/',
        'https://chat.qwen.ai/',
        'https://chat.deepseek.com/'
    ];
    
    sites.forEach((url, index) => {
        setTimeout(() => {
            window.open(url, '_blank');
        }, index * 300);
    });
}

function closeWelcome() {
    window.close();
}

// 页面加载动画
document.addEventListener('DOMContentLoaded', function() {
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        setTimeout(() => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateY(20px)';
            feature.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                feature.style.opacity = '1';
                feature.style.transform = 'translateY(0)';
            }, 100);
        }, index * 100);
    });
    
    // 绑定事件监听器
    const openAllBtn = document.querySelector('[data-action="open-all"]');
    if (openAllBtn) {
        openAllBtn.addEventListener('click', openAllSites);
    }
    
    const closeBtn = document.querySelector('[data-action="close"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeWelcome);
    }
    
    // 绑定网站卡片点击事件
    document.querySelectorAll('.site-card').forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });
});