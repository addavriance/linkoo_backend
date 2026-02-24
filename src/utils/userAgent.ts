import {DeviceType} from '@/models/CardAnalytics';

interface ParsedUA {
    browser: string;
    os: string;
    device: DeviceType;
}

export function parseUserAgent(ua?: string): ParsedUA {
    if (!ua) return {browser: 'Other', os: 'Other', device: 'desktop'};

    // Device
    const isMobile = /Mobile|Android(?!.*Tablet)|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);
    const device: DeviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Browser (order matters — Edge/YaBrowser before Chrome, Chrome before Safari)
    let browser = 'Other';
    if (/YaBrowser/i.test(ua)) browser = 'Yandex';
    else if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\/|Opera\//i.test(ua)) browser = 'Opera';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung';
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
    else if (/Chromium/i.test(ua)) browser = 'Chromium';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) browser = 'Safari';

    // OS
    let os = 'Other';
    if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/(iPhone|iPad|iPod)/i.test(ua)) os = 'iOS';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    return {browser, os, device};
}