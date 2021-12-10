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

export interface ThreeCanvasRef {
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

export const ThreeCanvas = React.forwardRef(_ThreeCanvas)
