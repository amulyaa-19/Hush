import { useState, useCallback, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";
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
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

export const useWebRTC = ({ socket, users, mySocketId }: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
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

  // Effect to send offers to new users
  useEffect(() => {
    if (!localStream || !socket || !mySocketId) {
      return;
    }

    users.forEach((user) => {
      if (user.id === mySocketId || peerConnectionsRef.current[user.id]) {
        return; // Don't call ourselves or existing connections
      }

      const peerConnection = new RTCPeerConnection(stunServers);
      peerConnectionsRef.current[user.id] = peerConnection;

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
            targetSocketId: user.id,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        console.log(`Received remote track from ${user.id}`);
        setRemoteStreams((prevStreams) => ({
          ...prevStreams,
          [user.id]: event.streams[0],
        }));
      };

      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          socket.emit("webrtc-offer", {
            targetSocketId: user.id,
            offer: peerConnection.localDescription,
          });
          console.log(`Sent offer to ${user.username}`);
        })
        .catch((error) => console.error("Error creating offer:", error));
    });
  }, [localStream, users, socket, mySocketId]);

  // Effect to handle all incoming socket events
  useEffect(() => {
    if (!socket || !localStream || !mySocketId) {
      return;
    }

    const processQueuedCandidates = (socketId: string) => {
      const peerConnection = peerConnectionsRef.current[socketId];
      if (peerConnection && iceCandidateQueueRef.current[socketId]) {
        console.log(`Processing queued candidates for ${socketId}`);
        iceCandidateQueueRef.current[socketId].forEach((candidate) => {
          peerConnection
            .addIceCandidate(candidate)
            .catch((e) =>
              console.error("Error adding queued ICE candidate:", e)
            );
        });
        delete iceCandidateQueueRef.current[socketId];
      }
    };

    socket.on("webrtc-offer", (data) => {
      const { senderSocketId, offer } = data;
      console.log(`Received offer from ${senderSocketId}`);

      const peerConnection = new RTCPeerConnection(stunServers);
      peerConnectionsRef.current[senderSocketId] = peerConnection;

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("webrtc-ice-candidate", {
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

      peerConnection
        .setRemoteDescription(offer)
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => {
          socket.emit("webrtc-answer", {
            targetSocketId: senderSocketId,
            answer: peerConnection.localDescription,
          });
          console.log(`Sent answer to ${senderSocketId}`);
          processQueuedCandidates(senderSocketId); // Process queue after setting description
        })
        .catch((error) => console.error("Error handling offer:", error));
    });

    socket.on("webrtc-answer", (data) => {
      const { senderSocketId, answer } = data;
      console.log(`Received answer from ${senderSocketId}`);

      const peerConnection = peerConnectionsRef.current[senderSocketId];
      if (peerConnection) {
        peerConnection
          .setRemoteDescription(answer)
          .then(() => {
            processQueuedCandidates(senderSocketId); // Process queue after setting description
          })
          .catch((error) =>
            console.error("Error setting remote description:", error)
          );
      }
    });

    socket.on("webrtc-ice-candidate", (data) => {
      const { senderSocketId, candidate } = data;
      console.log(`Received ICE candidate from ${senderSocketId}`);

      const peerConnection = peerConnectionsRef.current[senderSocketId];

      if (peerConnection && peerConnection.remoteDescription) {
        // If connection is ready, add candidate
        peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((error) =>
            console.error("Error adding received ICE candidate:", error)
          );
      } else {
        // If not ready, add to queue
        console.log(`Queuing candidate from ${senderSocketId}`);
        if (!iceCandidateQueueRef.current[senderSocketId]) {
          iceCandidateQueueRef.current[senderSocketId] = [];
        }
        iceCandidateQueueRef.current[senderSocketId].push(
          new RTCIceCandidate(candidate)
        );
      }
    });
  }, [socket, localStream, mySocketId]);

  useEffect(() => {
    const allConnectionIds = Object.keys(peerConnectionsRef.current);
    const allUserIds = users.map(user => user.id);
    allConnectionIds.forEach((connId) => {
      // If a connection ID is NOT in the new user list, that user left.
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
