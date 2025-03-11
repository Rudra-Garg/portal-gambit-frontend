import { useState, useRef, useEffect } from 'react';
import { ref, update, onValue } from 'firebase/database';
import { database } from '../../../firebase/config';
import Peer from 'peerjs';

export const useVoiceChat = (gameId, gameState, user) => {
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (!gameId || !user || !voiceChatEnabled) return;

    const voiceChatRef = ref(database, `games/${gameId}/voiceChat`);
    const unsubscribe = onValue(voiceChatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const amIWhitePlayer = gameState?.white_player === user.uid;
      const myRole = amIWhitePlayer ? 'white' : 'black';
      const opponentRole = amIWhitePlayer ? 'black' : 'white';

      if (data[myRole] && !data[opponentRole]) {
        setConnectionStatus('waiting');
        return;
      }

      if (data[myRole] && data[opponentRole] && connectionRef.current === null) {
        if (myRole === 'white') {
          connectToPeer(data[opponentRole]);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, user, voiceChatEnabled, gameState]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, []);

  const toggleVoiceChat = async () => {
    if (voiceChatEnabled) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      const amIWhitePlayer = gameState?.white_player === user.uid;
      const myRole = amIWhitePlayer ? 'white' : 'black';
      
      const updates = {};
      updates[`games/${gameId}/voiceChat/${myRole}`] = null;
      update(ref(database), updates);
      
      setVoiceChatEnabled(false);
      setConnectionStatus('disconnected');
    } else {
      setIsConnecting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        
        const peer = new Peer();
        peerRef.current = peer;
        
        peer.on('open', (id) => {
          const amIWhitePlayer = gameState?.white_player === user.uid;
          const myRole = amIWhitePlayer ? 'white' : 'black';
          
          const updates = {};
          updates[`games/${gameId}/voiceChat/${myRole}`] = id;
          update(ref(database), updates);
          
          setVoiceChatEnabled(true);
          setConnectionStatus('waiting');
        });
        
        peer.on('call', (call) => {
          call.answer(localStreamRef.current);
          
          call.on('stream', (remoteStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.play().catch(e => console.error('Error playing audio:', e));
            }
            setConnectionStatus('connected');
          });
          
          connectionRef.current = call;
        });
        
        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setConnectionStatus('error');
          setIsConnecting(false);
        });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setConnectionStatus('error');
        setIsConnecting(false);
      }
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const connectToPeer = (peerId) => {
    if (!peerRef.current || !localStreamRef.current) return;
    
    setConnectionStatus('connecting');
    
    const call = peerRef.current.call(peerId, localStreamRef.current);
    
    call.on('stream', (remoteStream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(e => console.error('Error playing audio:', e));
      }
      setConnectionStatus('connected');
    });
    
    call.on('error', (err) => {
      console.error('Call error:', err);
      setConnectionStatus('error');
    });
    
    connectionRef.current = call;
  };

  return {
    voiceChatEnabled,
    isMuted,
    isConnecting,
    connectionStatus,
    remoteAudioRef,
    toggleVoiceChat,
    toggleMute
  };
}; 