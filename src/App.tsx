import * as React from 'react'
import { ThreeCanvas, ThreeCanvasRef } from './ThreeCanvas'

const FPS = 24

export const App = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const threeCanvasRef = React.useRef<ThreeCanvasRef>(null)

  const createNewFrameMarker = React.useCallback(() => {
    window.postMessage('newFrame')
  }, [])

  React.useEffect(() => {
    const updateFrame = () => {
      ;(videoRef.current as any).requestVideoFrameCallback(updateFrame)
      createNewFrameMarker()
    }
    ;(videoRef.current as any).requestVideoFrameCallback(updateFrame)

    const listener = (e: MessageEvent) => {
      if (videoRef.current && e.data === 'goToNextFrame') {
        threeCanvasRef.current?.applyDelta(1 / FPS)
        videoRef.current.currentTime += 1 / FPS
      }
    }

    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <video
        preload="auto"
        ref={videoRef}
        style={{ display: 'block', width: '100%' }}
        // https://gist.github.com/jsturgis/3b19447b304616f18657#file-gistfile1-txt-L4
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        muted={true}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <ThreeCanvas ref={threeCanvasRef} />
      </div>
    </div>
  )
}
