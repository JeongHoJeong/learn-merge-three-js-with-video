import fs from 'fs'
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

;(async () => {
  const chrome = await ChromeLauncher.launch({
    startingUrl: 'https://www.youtube.com/watch?v=H-NKIfnB2l8&t=6s',
    chromeFlags: ['--window-size=1920,1080'],
  })

  const client = await CDP({
    port: chrome.port,
  })

  const { Network, Page } = client
  await Network.enable({})
  await Page.enable()
  await Page.startScreencast({
    format: 'jpeg',
    everyNthFrame: 1,
  })

  try {
    await fs.promises.unlink('record.mp4')
  } catch (e) {}

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
  ffmpeg.stderr.setEncoding('utf-8')
  ffmpeg.stderr.on('data', (data) => {
    console.log(data)
  })

  client.on('Page.screencastFrame', (data) => {
    Page.screencastFrameAck({
      sessionId: data.sessionId,
    })
    ffmpeg.stdin.write(Buffer.from(data.data, 'base64'))
  })

  await sleep(5000)
  await Page.stopScreencast()
  ffmpeg.stdin.end()

  await client.close()
  await chrome.kill()
})()
