const { chromium } = require('playwright');
const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Starting promo video recording...');

    const browser = await chromium.launch({
        headless: true // Run headless for cleaner recording
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
            dir: './temp_video/',
            size: { width: 1280, height: 720 }
        }
    });

    const page = await context.newPage();

    // Load the local showcase file
    const filePath = `file://${path.resolve(__dirname, 'demo-showcase.html')}`;
    await page.goto(filePath);

    console.log('🎬 Triggering animation sequence...');

    // Click the "Play Video & Audio" button to start the animation
    await page.click('#startBtn');

    // Wait for the sequence to complete (approx 15-20 seconds)
    // We wait for a reasonable amount of time as the animation is predictable
    console.log('⏳ Recording animation sequence...');
    await page.waitForTimeout(25000); // Wait 25s to ensure full narration and animation complete


    console.log('💾 Closing browser to finalize video...');
    await context.close();
    await browser.close();

    // Find the recorded webm file in the temp directory
    const videoDir = path.resolve(__dirname, 'temp_video');
    const files = fs.readdirSync(videoDir);
    const webmFile = path.join(videoDir, files.find(f => f.endsWith('.webm')));
    const mp4File = path.resolve(__dirname, 'promo-video.mp4');

    if (!webmFile) {
        console.error('❌ Error: Recorded webm file not found.');
        process.exit(1);
    }

    console.log('⚙️ Converting webm to mp4 using ffmpeg...');
    try {
        // Use ffmpeg-static binary to convert the file
        // -i: input, -c:v libx264: video codec, -crf: quality, -preset: speed
        execSync(`"${ffmpeg}" -i "${webmFile}" -c:v libx264 -crf 23 -preset fast -c:a aac "${mp4File}" -y`);
        console.log(`✅ Success! Promo video exported to: ${mp4File}`);

        // Cleanup temporary video directory
        fs.rmSync(videoDir, { recursive: true, force: true });
        console.log('🧹 Temporary files cleaned up.');
    } catch (error) {
        console.error('❌ FFmpeg conversion failed:', error);
    }
})();
