import * as fs from 'fs'
import { spawn } from 'child_process'

import CDP from 'chrome-remote-interface'
import ChromeLauncher from 'chrome-launcher'

async function exceptionlessUnlink(file: string) {
  try {
    await fs.promises.unlink(file)
  } catch (e) {}
}

/** https://github.com/cyrus-and/chrome-remote-interface/wiki/Wait-for-a-specific-element */
async function messageArrives(client: CDP.Client, eventName: string) {
  const browserCode = (_eventName: string) => {
    return new Promise((resolve) => {
      const listener = (e: MessageEvent) => {
        if (e.data === _eventName) {
          window.removeEventListener('message', listener)
          resolve(undefined)
        }
      }
      window.addEventListener('message', listener)
    })
  }

  const { Runtime } = client
  await Runtime.evaluate({
    expression: `(${browserCode})(${JSON.stringify(eventName)})`,
    awaitPromise: true,
  })
}

;(async () => {
  const chrome = await ChromeLauncher.launch({
    startingUrl: 'http://localhost:8000',
    chromeFlags: [
      '--headless',
      // https://github.com/puppeteer/puppeteer/issues/3637#issuecomment-918629028
      '--use-gl=egl',
      '--window-size=640,360',
    ],
  })

  const client = await CDP({
    port: chrome.port,
  })

  const { Network, Page, Input, Log, Runtime } = client
  await Network.enable({})
  await Page.enable()
  await Log.enable()
  await Runtime.enable()

  await exceptionlessUnlink('record.mp4')

  const ffmpeg = spawn('ffmpeg', [
    '-f',
    'image2pipe',
    '-framerate',
    '24',
    '-c:v',
    'mjpeg',
    '-i',
    '-',
    '-c:v',
    'libx264',
    'record.mp4',
  ])
  ffmpeg.stderr.pipe(process.stderr)

  Runtime.on('consoleAPICalled', (e) => {
    console.log(e.args[0]?.value)
  })

  for (let i = 0; i < 500; i += 1) {
    console.log(`frame: ${i}`)
    // 클릭 이후 이벤트 핸들러가 붙기 전에 브라우저 단에서 처리가 끝날 수 있기 때문에, 핸들러를 먼저 붙입니다.
    const promise = messageArrives(client, 'newFrame')
    await Input.dispatchKeyEvent({
      key: 'A',
      type: 'keyDown',
    })

    // 스크린샷을 찍기 전에 새 프레임의 랜더링이 끝나야 합니다.
    await promise
    const screenshot = await Page.captureScreenshot({
      format: 'jpeg',
    })

    ffmpeg.stdin.write(Buffer.from(screenshot.data, 'base64'))
  }

  ffmpeg.stdin.end()

  await client.close()
  await chrome.kill()
})()
