'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial } from 'three'
import { useLiveKit } from '@/lib/livekit/useLiveKit'

function CenterGlow({ isActive }: { isActive: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current && meshRef.current) {
      const time = clock.getElapsedTime()
      materialRef.current.uniforms.time.value = time
      materialRef.current.uniforms.isActive.value = isActive ? 1.0 : 0.5
      
      // Gentle pulsing
      const scale = 1 + Math.sin(time * 1.2) * 0.1
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  const fragmentShader = `
    uniform float time;
    uniform float isActive;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      float dist = distance(uv, vec2(0.5));
      
      // Create soft inner glow circle
      float innerCircle = 1.0 - smoothstep(0.0, 0.4, dist);
      
      // Color gradient matching the ring
      vec3 color1 = vec3(0.0, 0.6, 0.7); // Darker teal
      vec3 color2 = vec3(0.5, 0.15, 0.7); // Darker purple
      vec3 color3 = vec3(0.7, 0.2, 0.55); // Darker pink
      
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float colorMix = (angle + 3.14159) / 6.28318;
      float colorShift = sin(time * 0.6 + colorMix * 6.28) * 0.3 + 0.7;
      
      vec3 baseColor = mix(color1, color2, colorMix);
      baseColor = mix(baseColor, color3, colorShift * 0.5);
      
      // Radial gradient - darker in center, brighter at edges
      float radialGradient = smoothstep(0.0, 0.4, dist);
      
      // Pulsing effect
      float pulse = sin(time * 1.0) * 0.1 + 0.9;
      
      float alpha = innerCircle * radialGradient * 0.15 * pulse * isActive;
      vec3 finalColor = baseColor * (0.3 + radialGradient * 0.4) * isActive;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `

  const vertexShader = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  return (
    <mesh ref={meshRef} position={[0, 0, -0.1]}>
      <planeGeometry args={[2.5, 2.5, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          time: { value: 0 },
          isActive: { value: isActive ? 1.0 : 0.5 },
        }}
      />
    </mesh>
  )
}

function AnimatedRing({ isActive }: { isActive: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current && meshRef.current) {
      const time = clock.getElapsedTime()
      materialRef.current.uniforms.time.value = time
      materialRef.current.uniforms.isActive.value = isActive ? 1.0 : 0.5
      
      // Gentle rotation
      meshRef.current.rotation.z = time * 0.1
      
      // Breathing animation
      const scale = 1 + Math.sin(time * 0.8) * 0.05
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform float time;
    uniform float isActive;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vec2 uv = vUv;
      
      // Create wavy, organic ring shape
      float dist = distance(uv, vec2(0.5));
      
      // Add multiple wave distortions for organic feel
      float wave1 = sin(dist * 25.0 - time * 2.5) * 0.025;
      float wave2 = cos(dist * 18.0 + time * 1.8) * 0.02;
      float wave3 = sin(dist * 30.0 + time * 3.0) * 0.015;
      
      vec2 center = vec2(0.5);
      vec2 distortedCenter = center + vec2(wave1, wave2) * (1.0 + wave3);
      float distorted = distance(uv, distortedCenter);
      
      // Create the ring with soft edges - thinner and more refined
      float ringInner = smoothstep(0.46, 0.48, distorted);
      float ringOuter = 1.0 - smoothstep(0.52, 0.54, distorted);
      float ring = ringInner * ringOuter;
      
      // Color gradient - teal to purple/pink
      vec3 color1 = vec3(0.0, 0.85, 0.95); // Bright teal
      vec3 color2 = vec3(0.7, 0.2, 0.95);  // Purple
      vec3 color3 = vec3(1.0, 0.3, 0.75);  // Pink
      
      // Create color variation based on angle and position
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float colorMix = (angle + 3.14159) / 6.28318;
      
      // Animate colors
      float colorShift = sin(time * 0.8 + colorMix * 6.28) * 0.3 + 0.7;
      vec3 baseColor = mix(color1, color2, colorMix);
      baseColor = mix(baseColor, color3, colorShift * 0.6);
      
      // Pulsing glow that intensifies when active
      float glowPulse = sin(time * 1.2 + dist * 12.0) * 0.3 + 0.7;
      float activeGlow = isActive > 0.5 ? 1.8 : 1.0;
      float glow = glowPulse * activeGlow;
      
      // Enhanced edge glow effect
      float edgeDist = abs(distorted - 0.5);
      float edgeGlow = 1.0 - smoothstep(0.0, 0.06, edgeDist);
      edgeGlow = pow(edgeGlow, 0.4);
      
      // Combine everything with enhanced brightness
      float alpha = ring * glow * (0.9 + edgeGlow * 0.1);
      vec3 finalColor = baseColor * (1.0 + glow * 0.6) * isActive;
      
      // Add extra brightness to edges
      finalColor += baseColor * edgeGlow * 0.7 * isActive;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `

  return (
    <>
      <CenterGlow isActive={isActive} />
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusGeometry args={[1, 0.12, 64, 100]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          uniforms={{
            time: { value: 0 },
            isActive: { value: isActive ? 1.0 : 0.5 },
          }}
        />
      </mesh>
    </>
  )
}

function VoiceAssistantRing({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ width: '400px', height: '400px' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <AnimatedRing isActive={isActive} />
      </Canvas>
    </div>
  )
}

export default function VoiceAssistant({ user }: { user: any }) {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null)

  const { isConnected, isConnecting, connect, disconnect } = useLiveKit({
    url: livekitUrl || '',
    token: token || '',
    publishAudio: true,
    onConnected: async (room) => {
      setIsListening(true)
      setIsActive(true)
      console.log('✅ Connected to LiveKit room:', room.name)
      console.log('🔊 Waiting for agent to join...')
      
      // Check if agent is already in the room
      const remoteParticipants = Array.from(room.remoteParticipants.values())
      if (remoteParticipants.length > 0) {
        console.log('🎤 Agent already in room:', remoteParticipants.map(p => p.identity))
      } else {
        console.log('⏳ Agent will join shortly...')
      }
    },
    onDisconnected: () => {
      setIsListening(false)
      setIsActive(false)
    },
    onError: (error) => {
      console.error('LiveKit error:', error)
      setIsListening(false)
      setIsActive(false)
    },
  })

  const handleClick = async () => {
    if (!isListening && !isConnecting) {
      // Get LiveKit token from API
      try {
        const response = await fetch(`/api/livekit/token?room=voice-assistant&name=${user.email || 'user'}`)
        const data = await response.json()
        
        if (data.token && data.url) {
          setToken(data.token)
          setLivekitUrl(data.url)
          await connect()
        } else {
          throw new Error('Failed to get LiveKit token')
        }
      } catch (error) {
        console.error('Failed to connect:', error)
        alert('Failed to connect to voice assistant. Please check your LiveKit configuration.')
      }
    } else if (isListening) {
      await disconnect()
    }
  }

  // Only show if user is signed in
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-teal-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex flex-col items-center gap-8 z-10">
        <VoiceAssistantRing isActive={isActive} onClick={handleClick} />
        <div className="text-center">
          <p className="text-white text-xl mb-4 font-light">
            {isConnecting ? 'Connecting...' : isListening ? 'Listening...' : 'Click to activate voice assistant'}
          </p>
          {(isListening || isConnecting) && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-400/50"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          {!isListening && !isConnecting && (
            <p className="text-gray-400 text-sm mt-2">Ready to assist you</p>
          )}
        </div>
      </div>
    </div>
  )
}

