import { useState } from 'react';


export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const startLocalStream = async() => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      setLocalStream(true);
    } catch (error) {
      console.error('failed to get local stream:', error);
    }
  }
  return {
    localStream,
    remoteStreams,
  };
};