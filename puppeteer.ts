import puppeteer from 'puppeteer'
import _aperture from 'aperture'
import * as fs from 'fs'
;(async () => {
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    args: ['--app', '--kiosk', '--start-maximized'],
    defaultViewport: null,
  })
  const page = await browser.newPage()
  await page.goto('https://www.youtube.com/watch?v=H-NKIfnB2l8', {
    waitUntil: 'networkidle2',
  })

  await page.click('[aria-label="전체 화면(f)"]')

  const aperture = _aperture()
  await aperture.startRecording({
    fps: 30,
    showCursor: false,
  })
  await page.waitForTimeout(6000)
  fs.promises.unlink('./record.mp4')
  await fs.promises.rename(await aperture.stopRecording(), './record.mp4')
  await browser.close()
})()
