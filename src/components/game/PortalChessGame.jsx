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
  
  // Timer states
  const [whiteTime, setWhiteTime] = useState(10 * 60); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(10 * 60); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef(null);
  
  // Voice chat states
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [boardWidth, setBoardWidth] = useState(400);
  
  // Refs for voice chat
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [lostPieces, setLostPieces] = useState({
    white: [], // White pieces lost (displayed under white player)
    black: []  // Black pieces lost (displayed under black player)
  });

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer logic
  useEffect(() => {
    if (!gameState || !timerActive) return;
    
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Set up timer that ticks every second
    timerIntervalRef.current = setInterval(() => {
      if (gameState.current_turn === 'white') {
        setWhiteTime(prevTime => {
          const newTime = prevTime - 1;
          // Update Firebase with new time
          update(ref(database, `games/${gameId}`), {
            whiteTime: newTime
          });
          return newTime;
        });
      } else {
        setBlackTime(prevTime => {
          const newTime = prevTime - 1;
          // Update Firebase with new time
          update(ref(database, `games/${gameId}`), {
            blackTime: newTime
          });
          return newTime;
        });
      }
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, timerActive, gameId]);

  // Check for time out
  useEffect(() => {
    if (whiteTime <= 0 || blackTime <= 0) {
      // Handle game over due to time out
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        setTimerActive(false);
      }
      
      // Update game status in Firebase
      const winner = whiteTime <= 0 ? 'black' : 'white';
      update(ref(database, `games/${gameId}`), {
        status: 'completed',
        winner: winner,
        winReason: 'timeout'
      });
      
      // You could show an alert or modal here
      alert(`Game over! ${winner} wins by timeout.`);
    }
  }, [whiteTime, blackTime, gameId]);

  //for board::
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('board-container');
      if (container) {
        // Calculate the available height considering other elements
        const availableHeight = window.innerHeight - 200; // Subtract height for player info and lost pieces
        const availableWidth = container.clientWidth;
        
        // Use the smaller dimension to ensure square fits
        const size = Math.min(availableHeight, availableWidth);
        setBoardWidth(size);
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial sizing
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          updateMoveHistory();
          updateLostPieces();
          
          // Update timers from Firebase if they exist
          if (data.whiteTime !== undefined) {
            setWhiteTime(data.whiteTime);
          }
          if (data.blackTime !== undefined) {
            setBlackTime(data.blackTime);
          }
          
          // Start the timer if the game has started
          if (data.status === 'active' && !timerActive) {
            setTimerActive(true);
          }
          
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
      
      // Clear timer interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
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
  
      const moves = newGame.moves({ square: sourceSquare, verbose: true });
  
      const portalMove = moves.find(move => 
        move.portal && 
        move.to === targetSquare
      );
  
      let move;
      if (portalMove) {
        move = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          via: portalMove.via,
          portal: true
        });
      } else {
        move = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q' // Default to queen for simplicity
        });
      }
  
      if (move) {
        const cleanMove = {
          ...move,
          captured: move.captured || null,
          promotion: move.promotion || null,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          flags: move.flags || '',
          san: move.san || '',
          via: move.via || null,
          portal: move.portal || false
        };
  
        const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
        
        // Make sure the timer is active
        if (!timerActive) {
          setTimerActive(true);
        }
        
        update(ref(database, `games/${gameId}`), {
          fen: newGame.fen(),
          portals: newGame.portals,
          current_turn: newTurn,
          lastMoveTime: Date.now(),
          lastMove: cleanMove,
          status: 'active'
        });
  
        // Update local game state
        setGame(newGame);
  
        // Update move history and lost pieces after the move
        updateMoveHistory();
        updateLostPieces();
  
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  }, [game, gameState, gameId, isMyTurn, timerActive]);
  
  // Update move history after loading game state from Firebase
  useEffect(() => {
    if (gameState) {
      updateMoveHistory();
      updateLostPieces();
    }
  }, [gameState]);
  

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



  //updating ui
  const [moveHistory, setMoveHistory] = useState([]);



  const updateLostPieces = () => {
    // Get current position
    const fen = game.fen();
    const position = fen.split(' ')[0];
    
    // Count all pieces in the position
    const pieceCounts = {
      'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1, 'k': 1,
      'P': 8, 'N': 2, 'B': 2, 'R': 2, 'Q': 1, 'K': 1
    };
    
    // Reduce the count for pieces still on the board
    for (let char of position) {
      if (pieceCounts[char] !== undefined) {
        pieceCounts[char]--;
      }
    }
    
    // Group lost pieces by type with counts
    const whiteLostCounts = {};
    const blackLostCounts = {};
    
    // Count lost pieces by type
    for (let piece in pieceCounts) {
      const count = pieceCounts[piece];
      if (piece === piece.toUpperCase() && count > 0) {
        // White pieces lost
        whiteLostCounts[piece] = count;
      } else if (piece === piece.toLowerCase() && count > 0) {
        // Black pieces lost
        blackLostCounts[piece] = count;
      }
    }
    
    // Convert to arrays with proper sorting
    const whiteLost = Object.keys(whiteLostCounts).map(piece => ({
      type: piece,
      count: whiteLostCounts[piece],
      value: getPieceValue(piece)
    }));
    
    const blackLost = Object.keys(blackLostCounts).map(piece => ({
      type: piece,
      count: blackLostCounts[piece],
      value: getPieceValue(piece)
    }));
    
    // Sort by value (highest first)
    whiteLost.sort((a, b) => b.value - a.value);
    blackLost.sort((a, b) => b.value - a.value);
    
    setLostPieces({
      white: whiteLost,
      black: blackLost
    });

  };

  const getPieceValue = (piece) => {
    const values = {
      'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0,
      'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0
    };
    return values[piece] || 0;
  };
  

  const updateMoveHistory = () => {
    const history = game.history({ verbose: true });
    setMoveHistory(history);
  };
  
  const pieceSymbols = {
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
  };
  

  const renderPieceWithCounter = (pieceData) => {
    return (
      <div key={pieceData.type} className="flex items-center mr-2">
        <span className="text-lg">{pieceSymbols[pieceData.type]}</span>
        {pieceData.count > 1 && (
          <span className="text-xs font-medium ml-1">x{pieceData.count}</span>
        )}
      </div>
    );
  };


  return (
    <div className="portal-chess-container flex flex-col md:flex-row w-full h-screen">
      {/* <div className="game-status">
        {isMyTurn() ? "Your turn" : "Opponent's turn"}
      </div> */}
      
     
      <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-2 flex flex-col h-full max-h-screen overflow-hidden shadow-lg border border-purple-200">
       {/* Player 1 info (Black) - Reduced padding and more compact design */}
  <div className="bg-white p-1 rounded-lg shadow-md mb-1 flex flex-col border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mr-2 shadow-inner flex items-center justify-center text-white font-bold text-xs">
          O2
        </div>
        <div className="font-semibold text-gray-800 text-sm">OPPONENT 2</div>
        <div className="flex items-center bg-gray-50 px-2 py-0.5 rounded-full">
        <div className="mr-1 text-xs text-gray-600 font-medium">X / X / X</div>
      </div>
      </div>
      <div className={`flex items-center px-4 py-1 rounded-full ${
        gameState?.current_turn === 'black' 
          ? 'bg-green-50 text-green-700' 
          : 'bg-gray-50 text-gray-700'
      }`}>
        <div className="font-bold text-xs">{formatTime(blackTime)}</div>
      </div>
    </div>
    
    {/* Lost pieces section with more compact styling */}
    <div className="mt-1 flex items-center">
      <div className="flex flex-wrap min-h-[28px] bg-gray-50 rounded-md p-1 w-full">
        {lostPieces.black.length > 0 ? 
          lostPieces.black.map(piece => renderPieceWithCounter(piece)) : 
          <span className="text-gray-300 text-xs italic px-1">No pieces</span>
        }
      </div>
    </div>
  </div>
      
  {/* Chessboard - with flex-grow to use available space but capped height */}

      <div className="flex-grow flex items-center justify-center mb-1 overflow-hidden" id="board-container">
        <div className="board-container" style={{ 
      width: boardWidth, 
      maxWidth: '100%',
      maxHeight: 'calc(100vh - 200px)' // Dynamically calculate max height
    }}>
          <Chessboard 
            position={game.fen()}
            onPieceDrop={(source, target) => makeMove(source, target)}
            onSquareClick={handleSquareClick}
            boardOrientation={gameState?.black_player === user?.uid ? 'black' : 'white'}
            arePiecesDraggable={isMyTurn()}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
            customSquareStyles={customSquareStyles}
            customDarkSquareStyle={{ backgroundColor: '#b0b6d8' }}
        customLightSquareStyle={{ backgroundColor: '#e6e9f5' }}
          />
        </div>
        </div>
          {/* Player 2 info (White) - Reduced padding and more compact design */}
  <div className="bg-white p-1 rounded-lg shadow-md mb-1 flex flex-col border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mr-2 shadow-inner flex items-center justify-center text-white font-bold text-xs">
          O1
        </div>
        <div className="font-semibold text-gray-800 text-sm">OPPONENT 1</div>
        <div className="flex items-center bg-gray-50 px-2 py-0.5 rounded-full">
        <div className="mr-1 text-xs text-gray-600 font-medium">X / X / X</div>
      </div>
      </div>
      <div className={`flex items-center px-4 py-1 rounded-full ${
        gameState?.current_turn === 'white' 
          ? 'bg-green-50 text-green-700' 
          : 'bg-gray-50 text-gray-700'
      }`}>
        <div className="font-bold text-xs">{formatTime(whiteTime)}</div>
      </div>
    </div>
    
    {/* Lost pieces section with more compact styling */}
    <div className="mt-1 flex items-center">
      <div className="flex flex-wrap min-h-[28px] bg-gray-50 rounded-md p-1 w-full">
        {lostPieces.white.length > 0 ? 
          lostPieces.white.map(piece => renderPieceWithCounter(piece)) : 
          <span className="text-gray-300 text-xs italic px-1">No pieces</span>
        }
      </div>
    </div>
  </div>
        </div>

     {/* Right side - Game log and controls */}
     <div className="w-full md:w-1/2 bg-green-400 p-2 flex flex-col h-full">
       {/* game history */}
       <div className="bg-gradient-to-b from-gray-50 to-gray-100 flex-grow mb-2 rounded-lg border border-gray-200 shadow-inner flex flex-col" style={{ maxHeight: "471.48px" }}>
  {/* Header with date and user info */}
  <div className="flex justify-between items-center p-2 border-b border-gray-200 flex-shrink-0">
    <div className="flex items-center">
      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2">
        {"dev-rahul-1".substring(0, 2).toUpperCase()}
      </div>
      <h3 className="text-sm font-medium text-gray-800">{"dev-rahul-1"}</h3>
    </div>
    <div className="text-xs text-gray-500">
      2025-03-02 10:03:20 UTC
    </div>
  </div>
  
  {/* Move history section with scrolling */}
  <div className="overflow-y-auto p-2 flex-grow" style={{ minHeight: "0px" }}>
    {moveHistory.length === 0 ? (
      <div className="flex items-center justify-center h-full text-gray-400 italic text-sm">
        No moves yet. Game will start soon.
      </div>
    ) : (
      <div className="space-y-1.5">
        {/* Game start indicator */}
        <div className="flex justify-center mb-2">
          <div className="bg-gray-200 text-gray-600 rounded-full px-3 py-0.5 text-xs">
            Game started
          </div>
        </div>
        
        {/* Actual move history */}
        {moveHistory.map((move, index) => {
          const isPlayer1 = index % 2 === 0;
          return (
            <div key={index} className="flex items-center">
              <div className="w-16 text-xs text-gray-500 flex-shrink-0">
                {Math.floor(index/2) + 1}.{isPlayer1 ? '' : '..'}
              </div>
              <div className={`px-2 py-1 rounded ${
                isPlayer1 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              } text-sm flex-grow`}>
                {move.piece.toUpperCase() + move.from + move.to}
                {move.captured ? 
                  <span className="font-medium text-red-600"> x{move.captured.toUpperCase()}</span> 
                  : ''}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
  
  {/* Footer with action buttons */}
  <div className="p-2 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
    <button 
        onClick={() => setPortalMode(!portalMode)}
        className={`portal-button ${portalMode ? 'active' : ''} bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center`}

        disabled={!isMyTurn()}
      >
        {portalMode ? 'Cancel Portal' : 'Place Portal'}
    </button>
    <button 
      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors duration-150 flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Leave Game
    </button>
  </div>
</div>
        {/* chat history */}
        <div className="chat-container ">
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

        {/*chat end */}
</div>

  
    </div>
  );
};

export default PortalChessGame;
