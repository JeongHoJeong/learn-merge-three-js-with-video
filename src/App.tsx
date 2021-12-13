import * as React from 'react'
import { Canvas, useThree } from '@react-three/fiber'

interface BoxRef {
  applyDelta(delta: number): void
}

function _Box(
  props: { position: [number, number, number] },
  ref: React.ForwardedRef<BoxRef>
) {
  const { invalidate } = useThree()
  const meshRef = React.useRef({ rotation: { x: 0 } })

  React.useImperativeHandle(ref, () => ({
    applyDelta(delta) {
      invalidate()
      meshRef.current.rotation.x += delta * 1
    },
  }))

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

const Box = React.forwardRef(_Box)

interface ThreeCanvasRef {
  applyDelta(delta: number): void
}

const _ThreeCanvas = (_: unknown, ref: React.ForwardedRef<ThreeCanvasRef>) => {
  const boxRef1 = React.useRef<BoxRef>(null)
  const boxRef2 = React.useRef<BoxRef>(null)

  React.useImperativeHandle(ref, () => ({
    applyDelta(delta) {
      boxRef1.current?.applyDelta(delta)
      boxRef2.current?.applyDelta(delta)
    },
  }))

  return (
    <Canvas frameloop="demand" dpr={2}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box ref={boxRef1} position={[-1.2, 0, 0]} />
      <Box ref={boxRef2} position={[1.2, 0, 0]} />
    </Canvas>
  )
}

const FPS = 24

const ThreeCanvas = React.forwardRef(_ThreeCanvas)

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

    const listener = () => {
      if (videoRef.current) {
        threeCanvasRef.current?.applyDelta(1 / FPS)
        videoRef.current.currentTime += 1 / FPS
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
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
