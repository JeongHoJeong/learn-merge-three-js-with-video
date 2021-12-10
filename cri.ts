import * as fs from 'fs'
import { spawn } from 'child_process'

import CDP from 'chrome-remote-interface'
import ChromeLauncher from 'chrome-launcher'

async function sleep(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined)
    }, timeout)
  })
}

async function exceptionlessUnlink(file: string) {
  try {
    await fs.promises.unlink(file)
  } catch (e) {}
}

;(async () => {
  const chrome = await ChromeLauncher.launch({
    // startingUrl: 'https://www.youtube.com/watch?v=H-NKIfnB2l8&t=6s',
    // startingUrl: 'https://threejs.org/examples/#webgl_animation_keyframes',
    startingUrl: 'http://localhost:8000',
    // chromeFlags: ['--headless', '--window-size=1920,1080'],
    // chromeFlags: ['--headless', '--window-size=960,540'],
    // chromeFlags: ['--window-size=960,540'],
    // https://github.com/puppeteer/puppeteer/issues/3637#issuecomment-918629028
    chromeFlags: ['--headless', '--use-gl=egl', '--window-size=960,540'],
  })

  const client = await CDP({
    port: chrome.port,
  })

  const { Network, Page, Runtime, Input } = client
  await Network.enable({})
  await Page.enable()
  // await Page.startScreencast({
  //   format: 'jpeg',
  //   everyNthFrame: 1,
  // })

  await exceptionlessUnlink('record.mp4')

  const ffmpeg = spawn('ffmpeg', [
    '-f',
    'image2pipe',
    '-framerate',
    '30',
    '-c:v',
    'mjpeg',
    '-i',
    '-',
    '-c:v',
    'libx264',
    'record.mp4',
  ])
  ffmpeg.stderr.pipe(process.stderr)

  // Runtime.evaluate({
  //   expression: ''
  // })

  for (let i = 0; i < 300; i += 1) {
    console.log(`frame: ${i}`)
    await Input.dispatchKeyEvent({
      key: 'A',
      type: 'keyDown',
    })

    const screenshot = await Page.captureScreenshot({
      format: 'jpeg',
    })

    ffmpeg.stdin.write(Buffer.from(screenshot.data, 'base64'))
  }

  // client.on('Page.screencastFrame', (data) => {
  //   Page.screencastFrameAck({
  //     sessionId: data.sessionId,
  //   })
  //   ffmpeg.stdin.write(Buffer.from(data.data, 'base64'))
  // })

  // await sleep(15000)
  // await Page.stopScreencast()
  ffmpeg.stdin.end()

  await client.close()
  await chrome.kill()
})()
