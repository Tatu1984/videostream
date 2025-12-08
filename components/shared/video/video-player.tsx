"use client"

import { useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react"

interface VideoPlayerProps {
  src?: string
  poster?: string
  title: string
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        {src ? (
          <source src={src} type="video/mp4" />
        ) : (
          <p className="text-white">Your browser does not support the video tag.</p>
        )}
      </video>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="mb-2 w-full"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="rounded-full p-1 hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="rounded-full p-1 hover:bg-white/20"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>

            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="rounded-full p-1 hover:bg-white/20">
              <Settings className="h-5 w-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="rounded-full p-1 hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder if no video */}
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white">Video not available</p>
        </div>
      )}
    </div>
  )
}
