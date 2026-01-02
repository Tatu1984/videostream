"use client"

import { useState } from "react"
import { Share2, Flag, ListPlus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { ShareModal } from "@/components/shared/modals/share-modal"
import { ReportModal } from "@/components/shared/modals/report-modal"
import { AddToPlaylistModal } from "@/components/shared/modals/add-to-playlist-modal"

interface VideoActionsProps {
  videoId: string
  title: string
}

export function VideoActions({ videoId, title }: VideoActionsProps) {
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setShowShare(true)}>
        <Share2 className="h-5 w-5" />
      </Button>

      <Button variant="ghost" size="icon" onClick={() => setShowPlaylist(true)}>
        <ListPlus className="h-5 w-5" />
      </Button>

      <Button variant="ghost" size="icon" onClick={() => setShowReport(true)}>
        <Flag className="h-5 w-5" />
      </Button>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        videoId={videoId}
        title={title}
      />

      <AddToPlaylistModal
        isOpen={showPlaylist}
        onClose={() => setShowPlaylist(false)}
        videoId={videoId}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        videoId={videoId}
      />
    </>
  )
}
