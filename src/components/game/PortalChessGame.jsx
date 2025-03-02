import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { ref, update, onValue, push, serverTimestamp } from 'firebase/database';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { PortalChess } from './CustomChessEngine';
import Peer from 'peerjs';
import './PortalChessGame.css';

const PortalChessGame = ({ gameId }) => {
  const [game, setGame] = useState(() => new PortalChess());
  const [portalMode, setPortalMode] = useState(false);
  const [portalStart, setPortalStart] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Voice chat states
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  
  // Refs for voice chat
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (!gameId) return;

    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data);
        try {
          const newGame = new PortalChess();
          
          if (typeof data.fen === 'string') {
            newGame.load(data.fen);
          }
          
          // Ensure portals are properly set
          newGame.portals = data.portals || {};
          
          // Force turn to match the game state
          newGame._turn = data.current_turn === 'white' ? 'w' : 'b';
          
          setGame(newGame);
        } catch (error) {
          console.error('Error initializing chess game:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const chatRef = ref(database, `games/${gameId}/chat`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array and sort by timestamp
        const messagesArray = Object.entries(data).map(([id, message]) => ({
          id,
          ...message,
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        setChatMessages(messagesArray);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  // Voice chat effect to monitor peer connection IDs
  useEffect(() => {
    if (!gameId || !user || !voiceChatEnabled) return;

    const voiceChatRef = ref(database, `games/${gameId}/voiceChat`);
    const unsubscribe = onValue(voiceChatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const amIWhitePlayer = gameState?.white_player === user.uid;
      const myRole = amIWhitePlayer ? 'white' : 'black';
      const opponentRole = amIWhitePlayer ? 'black' : 'white';

      // If we have our peer ID set but not the opponent's, wait
      if (data[myRole] && !data[opponentRole]) {
        setConnectionStatus('waiting');
        return;
      }

      // If both peer IDs are set, establish connection
      if (data[myRole] && data[opponentRole] && connectionRef.current === null) {
        // Only initiate connection from one side to avoid duplicate connections
        if (myRole === 'white') {
          connectToPeer(data[opponentRole]);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, user, voiceChatEnabled, gameState]);

  // Cleanup voice chat resources when component unmounts
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

  const isMyTurn = () => {
    if (!gameState || !user) return false;
    const myColor = gameState.white_player === user.uid ? 'white' : 
                   gameState.black_player === user.uid ? 'black' : null;
    return myColor === gameState.current_turn;
  };

  const makeMove = useCallback((sourceSquare, targetSquare) => {
    if (!isMyTurn()) return false;

    try {
      const newGame = new PortalChess(game.fen());
      newGame.portals = { ...game.portals };

      // Get all valid moves for the source square
      const moves = newGame.moves({ square: sourceSquare, verbose: true });
      
      // Find if there's a portal move to the target square
      const portalMove = moves.find(move => 
        move.portal && 
        move.to === targetSquare
      );

      let move;
      if (portalMove) {
        // For portal moves, we need to include the 'via' square
        move = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          via: portalMove.via,
          portal: true
        });
      } else {
        // Regular move
        move = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q' // Default to queen for simplicity
        });
      }

      if (move) {
        // Clean up the move object to ensure no undefined values
        const cleanMove = {
          ...move,
          captured: move.captured || null,  // Replace undefined with null
          promotion: move.promotion || null,
          // Include other essential move properties
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          flags: move.flags || '',
          san: move.san || '',
          via: move.via || null,
          portal: move.portal || false
        };

        // Update game state in Firebase
        const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
        update(ref(database, `games/${gameId}`), {
          fen: newGame.fen(),
          portals: newGame.portals,
          current_turn: newTurn,
          lastMoveTime: Date.now(),
          lastMove: cleanMove
        });
        
        // Update local game state
        setGame(newGame);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  }, [game, gameState, gameId, isMyTurn]);

  const handleSquareClick = (square) => {
    console.log('Square clicked:', square);
    console.log('Portal mode:', portalMode);
    console.log('Selected square:', selectedSquare);
    
    if (!portalMode) {
      if (!selectedSquare) {
        const piece = game.get(square);
        console.log('Piece at clicked square:', piece);
        if (piece && piece.color === game.turn()) {
          console.log('Valid piece selected, calculating moves');
          const availableMoves = game.moves({ square, verbose: true });
          console.log('Available moves:', availableMoves);
          setSelectedSquare(square);
        }
      } else {
        console.log('Attempting move from', selectedSquare, 'to', square);
        makeMove(selectedSquare, square);
        setSelectedSquare(null);
      }
    } else {
      // Portal placement logging
      console.log('Portal placement - Start:', portalStart, 'Current:', square);
      if (!portalStart) {
        setPortalStart(square);
      } else {
        try {
          console.log('Placing portal pair:', portalStart, square);
          const newGame = new PortalChess(game.fen());
          newGame.portals = { ...game.portals };
          newGame.placePair(portalStart, square);
          console.log('New portal configuration:', newGame.portals);
          
          // Update local game state first
          setGame(newGame);
          setPortalStart(null);
          setPortalMode(false);

          // Update Firebase with new game state
          const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
          update(ref(database, `games/${gameId}`), {
            fen: newGame.fen(),
            portals: newGame.portals,
            current_turn: newTurn,
            lastMoveTime: Date.now()
          });
        } catch (error) {
          console.error('Portal placement error:', error);
          alert('Maximum number of portals (3) reached!');
          setPortalStart(null);
          setPortalMode(false);
        }
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !gameId) return;

    const chatRef = ref(database, `games/${gameId}/chat`);
    push(chatRef, {
      text: newMessage.trim(),
      sender: user.uid,
      senderName: user.displayName || user.email,
      timestamp: serverTimestamp(),
    });

    setNewMessage('');
  };

  // Voice chat functions
  const toggleVoiceChat = async () => {
    if (voiceChatEnabled) {
      // Disable voice chat
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
      
      // Update Firebase to remove our peer ID
      const amIWhitePlayer = gameState?.white_player === user.uid;
      const myRole = amIWhitePlayer ? 'white' : 'black';
      
      const updates = {};
      updates[`games/${gameId}/voiceChat/${myRole}`] = null;
      update(ref(database), updates);
      
      setVoiceChatEnabled(false);
      setConnectionStatus('disconnected');
    } else {
      // Enable voice chat
      setIsConnecting(true);
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        
        // Create a new Peer
        const peer = new Peer();
        peerRef.current = peer;
        
        peer.on('open', (id) => {
          console.log('My peer ID is:', id);
          
          // Store our peer ID in Firebase
          const amIWhitePlayer = gameState?.white_player === user.uid;
          const myRole = amIWhitePlayer ? 'white' : 'black';
          
          const updates = {};
          updates[`games/${gameId}/voiceChat/${myRole}`] = id;
          update(ref(database), updates);
          
          setVoiceChatEnabled(true);
          setConnectionStatus('waiting');
        });
        
        peer.on('call', (call) => {
          // Answer incoming call
          call.answer(localStreamRef.current);
          
          call.on('stream', (remoteStream) => {
            // Set the remote stream to the audio element
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

  const connectToPeer = (peerId) => {
    if (!peerRef.current || !localStreamRef.current) return;
    
    setConnectionStatus('connecting');
    
    // Call the other peer
    const call = peerRef.current.call(peerId, localStreamRef.current);
    
    call.on('stream', (remoteStream) => {
      // Set the remote stream to the audio element
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

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const customSquareStyles = {
    ...Object.keys(game.portals).reduce((acc, square) => ({
      ...acc,
      [square]: {
        background: 'radial-gradient(circle, #2196f3 0%, transparent 70%)',
        borderRadius: '50%'
      }
    }), {}),
    ...(portalStart ? {
      [portalStart]: {
        background: 'radial-gradient(circle, #4CAF50 0%, transparent 70%)',
        borderRadius: '50%'
      }
    } : {}),
    ...(selectedSquare ? {
      [selectedSquare]: {
        backgroundColor: 'rgba(255, 255, 0, 0.5)'
      },
      ...game.moves({ square: selectedSquare, verbose: true }).reduce((acc, move) => {
        console.log('Move object:', move);
        return {
          ...acc,
          [move.to]: {
            background: move.portal 
              ? move.captured
                ? 'radial-gradient(circle, transparent 35%, rgba(33, 150, 243, 0.4) 36%, rgba(33, 150, 243, 0.4) 45%, transparent 46%)'
                : 'radial-gradient(circle, rgba(33, 150, 243, 0.4) 0%, rgba(33, 150, 243, 0.4) 30%, transparent 31%)'
              : move.captured
                ? 'radial-gradient(circle, transparent 35%, rgba(0, 255, 0, 0.4) 36%, rgba(0, 255, 0, 0.4) 45%, transparent 46%)'
                : 'radial-gradient(circle, rgba(0, 255, 0, 0.4) 0%, rgba(0, 255, 0, 0.4) 30%, transparent 31%)'
          }
        };
      }, {})
    } : {})
  };

  return (
    <div className="portal-chess-container">
      <div className="game-status">
        {isMyTurn() ? "Your turn" : "Opponent's turn"}
      </div>
      <div className="game-board-chat-container">
        <div className="board-container">
          <Chessboard 
            position={game.fen()}
            onPieceDrop={(source, target) => makeMove(source, target)}
            onSquareClick={handleSquareClick}
            boardOrientation={gameState?.black_player === user?.uid ? 'black' : 'white'}
            arePiecesDraggable={isMyTurn()}
            customSquareStyles={customSquareStyles}
          />
        </div>
        
        <div className="chat-container">
          <div className="chat-header">
            <h3>Game Chat</h3>
            <div className="voice-chat-controls">
              <button 
                onClick={toggleVoiceChat} 
                className={`voice-chat-toggle ${voiceChatEnabled ? 'active' : ''}`}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : voiceChatEnabled ? 'Disable Voice' : 'Enable Voice'}
              </button>
              {voiceChatEnabled && (
                <button 
                  onClick={toggleMute} 
                  className={`mute-button ${isMuted ? 'muted' : ''}`}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              )}
              {voiceChatEnabled && (
                <span className={`connection-status ${connectionStatus}`}>
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                  {connectionStatus === 'waiting' && 'Waiting for opponent...'}
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'error' && 'Connection Error'}
                </span>
              )}
            </div>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="empty-chat-message">No messages yet. Start the conversation!</div>
            ) : (
              chatMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`chat-message ${message.sender === user?.uid ? 'my-message' : 'other-message'}`}
                >
                  <div className="message-sender">{message.senderName}</div>
                  <div className="message-text">{message.text}</div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={sendMessage} className="chat-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-button">Send</button>
          </form>
          
          {/* Hidden audio element for remote stream */}
          <audio ref={remoteAudioRef} autoPlay playsInline hidden />
        </div>
      </div>
      <div className="controls">
        <button 
          onClick={() => setPortalMode(!portalMode)}
          className={`portal-button ${portalMode ? 'active' : ''}`}
          disabled={!isMyTurn()}
        >
          {portalMode ? 'Cancel Portal' : 'Place Portal'}
        </button>
      </div>
    </div>
  );
};

export default PortalChessGame;