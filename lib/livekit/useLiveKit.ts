'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, RemoteAudioTrack, Track, LocalAudioTrack, createLocalAudioTrack } from 'livekit-client'

interface UseLiveKitOptions {
  url: string
  token: string
  onConnected?: (room: Room) => void | Promise<void>
  onDisconnected?: () => void
  onError?: (error: Error) => void
  publishAudio?: boolean
}

export function useLiveKit({ url, token, onConnected, onDisconnected, onError, publishAudio = true }: UseLiveKitOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const roomRef = useRef<Room | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null)

  const connect = useCallback(async () => {
    if (roomRef.current?.state === 'connected' || isConnecting || !url || !token) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const room = new Room()
      roomRef.current = room

      // Set up event handlers
      room.on(RoomEvent.Connected, async () => {
        setIsConnected(true)
        setIsConnecting(false)
        
        // Request microphone and publish audio if needed
        if (publishAudio) {
          try {
            const audioTrack = await createLocalAudioTrack()
            localAudioTrackRef.current = audioTrack
            await room.localParticipant.publishTrack(audioTrack)
            console.log('Audio track published')
          } catch (err) {
            console.error('Failed to publish audio:', err)
            // Continue anyway - user might not have mic permissions yet
          }
        }
        
        await onConnected?.(room)
      })

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false)
        setIsConnecting(false)
        
        // Cleanup local audio track
        if (localAudioTrackRef.current) {
          localAudioTrackRef.current.stop()
          localAudioTrackRef.current = null
        }
        
        onDisconnected?.()
      })

      // Listen for remote participants joining (your agent)
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('🎤 Agent/Remote participant connected:', participant.identity)
        
        // Subscribe to existing audio tracks
        if (participant.trackPublications && participant.trackPublications.size > 0) {
          participant.trackPublications.forEach((publication) => {
            if (publication.kind === 'audio' && !publication.isSubscribed) {
              console.log('Subscribing to existing agent audio track')
              publication.setSubscribed(true)
            }
          })
        }
      })
      
      // Listen for when participants publish new tracks
      room.on(RoomEvent.TrackPublished, (publication, participant) => {
        if (participant !== room.localParticipant && publication.kind === 'audio') {
          console.log('🎵 Agent published audio track:', participant.identity)
          publication.setSubscribed(true)
        }
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('✅ Track subscribed:', track.kind, 'from', participant.identity)
        if (track.kind === 'audio') {
          attachAudioTrack(track as RemoteAudioTrack)
          console.log('🔊 Playing agent audio...')
        }
      })

      // Connect to the room at the LiveKit URL from env
      console.log('Connecting to LiveKit at:', url)
      await room.connect(url, token)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to LiveKit')
      setError(error)
      setIsConnecting(false)
      onError?.(error)
    }
  }, [url, token, onConnected, onDisconnected, onError, isConnecting, publishAudio])

  const disconnect = useCallback(async () => {
    // Stop and cleanup local audio track
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop()
      localAudioTrackRef.current = null
    }
    
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
    }
    
    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  const attachAudioTrack = (track: RemoteAudioTrack) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const audioElement = track.attach()
    audioElement.play().catch(console.error)
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    room: roomRef.current,
  }
}

