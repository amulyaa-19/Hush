import { useState, useCallback, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
export interface IUser {
  id: string;
  username: string;
}
interface UseWebRTCOptions {
  socket: Socket | null;
  users: IUser[];
  mySocketId: string | null;
}

const stunServers = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
};

export const useWebRTC = ({ socket, users, mySocketId }: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const iceCandidateQueueRef = useRef<Record<string, RTCIceCandidate[]>>({});

  const startLocalStream = useCallback(async () => {
    console.log("Trying to start local stream...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      console.log("Stream acquired successfully!", stream);
    } catch (error) {
      console.error("Failed to get local stream:", error);
    }
  }, []);

  // Initiate calls to new users 
  useEffect(() => {
    if (!localStream || !socket || !mySocketId) {
      return;
    }

    users.forEach((user) => {
      // Don't call ourselves or users we are already connected to
      if (user.id === mySocketId || peerConnectionsRef.current[user.id]) {
        return;
      }

      console.log(`Initiating connection to ${user.username} (${user.id})`);

      const peerConnection = new RTCPeerConnection(stunServers);
      peerConnectionsRef.current[user.id] = peerConnection;

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            targetSocketId: user.id,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming remote stream
      peerConnection.ontrack = (event) => {
        console.log(`Received remote track from ${user.id}`);
        setRemoteStreams((prevStreams) => ({
          ...prevStreams,
          [user.id]: event.streams[0],
        }));
      };

      // Create and send offer
      peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          socket.emit('webrtc-offer', {
            targetSocketId: user.id,
            offer: peerConnection.localDescription,
          });
          console.log(`Sent offer to ${user.username}`);
        })
        .catch((error) => console.error("Error creating offer:", error));
    });

  }, [localStream, users, socket, mySocketId]);

  // Handle incoming signaling (Offer, Answer, ICE)
  useEffect(() => {
    if (!socket || !localStream || !mySocketId) {
      return;
    }

    const processQueuedCandidates = (socketId: string) => {
      const peerConnection = peerConnectionsRef.current[socketId];
      if (peerConnection && iceCandidateQueueRef.current[socketId]) {
        console.log(`Processing queued candidates for ${socketId}`);
        iceCandidateQueueRef.current[socketId].forEach((candidate) => {
          peerConnection.addIceCandidate(candidate)
            .catch((e) => console.error("Error adding queued ICE candidate:", e));
        });
        delete iceCandidateQueueRef.current[socketId]; 
      }
    };

    const handleOffer = (data: { senderSocketId: string, offer: RTCSessionDescriptionInit }) => {
      const { senderSocketId, offer } = data;
      console.log(`Received offer from ${senderSocketId}`);

      // Glare handling: If we are already connecting to this person, check who wins
      const existingConnection = peerConnectionsRef.current[senderSocketId];
      if (existingConnection && existingConnection.signalingState !== 'stable') {
        console.warn(`Glare condition detected with ${senderSocketId}. Ignoring offer.`);
        return; 
      }

      const peerConnection = new RTCPeerConnection(stunServers);
      peerConnectionsRef.current[senderSocketId] = peerConnection;

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('webrtc-ice-candidate', {
            targetSocketId: senderSocketId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        console.log(`Received remote track from ${senderSocketId}`);
        setRemoteStreams((prevStreams) => ({
          ...prevStreams,
          [senderSocketId]: event.streams[0],
        }));
      };

      peerConnection.setRemoteDescription(offer)
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => {
          socket.emit('webrtc-answer', {
            targetSocketId: senderSocketId,
            answer: peerConnection.localDescription,
          });
          console.log(`Sent answer to ${senderSocketId}`);
          processQueuedCandidates(senderSocketId);
        })
        .catch((error) => console.error("Error handling offer:", error));
    };

    const handleAnswer = (data: { senderSocketId: string, answer: RTCSessionDescriptionInit }) => {
      const { senderSocketId, answer } = data;
      console.log(`Received answer from ${senderSocketId}`);

      const peerConnection = peerConnectionsRef.current[senderSocketId];
      if (peerConnection) {
        peerConnection.setRemoteDescription(answer)
          .then(() => {
            processQueuedCandidates(senderSocketId);
          })
          .catch((error) => console.error("Error setting remote description:", error));
      }
    };

    const handleIceCandidate = (data: { senderSocketId: string, candidate: RTCIceCandidateInit }) => {
      const { senderSocketId, candidate } = data;
      
      const peerConnection = peerConnectionsRef.current[senderSocketId];

      if (peerConnection && peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((error) => console.error("Error adding received ICE candidate:", error));
      } else {
        // Queue the candidate if the connection isn't ready
        if (!iceCandidateQueueRef.current[senderSocketId]) {
          iceCandidateQueueRef.current[senderSocketId] = [];
        }
        iceCandidateQueueRef.current[senderSocketId].push(new RTCIceCandidate(candidate));
      }
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    // Cleanup Function beacuse sometimes two users were showing
    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
    };

  }, [socket, localStream, mySocketId]);

  // cleanup connections when users leave 
  useEffect(() => {
    const allConnectionIds = Object.keys(peerConnectionsRef.current);
    const allUserIds = users.map(user => user.id);

    allConnectionIds.forEach((connId) => {
      if (!allUserIds.includes(connId)) {
        console.log(`Cleaning up connection for ${connId}`);
        peerConnectionsRef.current[connId].close();
        delete peerConnectionsRef.current[connId];
        
        setRemoteStreams((prevStreams) => {
          const newStreams = { ...prevStreams };
          delete newStreams[connId];
          return newStreams;
        });
      }
    });
  }, [users]);

  return {
    localStream,
    remoteStreams,
    startLocalStream,
  };
};