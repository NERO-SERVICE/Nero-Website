const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
    testDir: './tests',
    testMatch: 'browser.spec.cjs',
    timeout: 60000,
    expect: { timeout: 7000 },
    retries: 0,
    workers: 2,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:4173',
        channel: process.env.CI ? 'chromium' : 'chrome',
        headless: true,
        reducedMotion: 'reduce',
        serviceWorkers: 'block',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run build && npm run preview',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true,
        timeout: 30000,
    },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
        { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    ],
});
