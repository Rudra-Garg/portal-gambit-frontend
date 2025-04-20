import { useState, useCallback, useEffect } from 'react';
import { ref, update, runTransaction, push, serverTimestamp } from 'firebase/database';
import { database } from '../../../firebase/config';
import { PortalChess } from '../CustomChessEngine';

export const useGameActions = (
    game,
    setGame,
    gameState,
    user,
    gameId,
    moveHistory,
    getServerTime,
    updateLostPieces,
    initiateArchiving,
    isGameArchived,
    isArchivingLocally,
    isMyTurn,
    areBothPlayersJoined,
    whiteTime,
    blackTime,
    setGameEndDetails,
    setShowGameEndPopup
) => {
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [portalMode, setPortalMode] = useState(false);
    const [portalStart, setPortalStart] = useState(null);

    useEffect(() => {
        if (!portalMode) {
            setPortalStart(null);
        }
    }, [portalMode]);

    const makeMove = useCallback((sourceSquare, targetSquare) => {
        if (!areBothPlayersJoined || !areBothPlayersJoined()) return false;
        if (!isMyTurn || !isMyTurn()) return false;
        if (gameState?.status === 'archived' || gameState?.status === 'archiving' || isGameArchived) {
            return false;
        }
        if (isArchivingLocally) {
            return false;
        }

        if (gameState?.current_turn === 'white' && whiteTime <= 0) return false;
        if (gameState?.current_turn === 'black' && blackTime <= 0) return false;

        try {
            const currentFen = game.fen();
            const newGame = new PortalChess(currentFen, gameState?.portal_count);
            newGame.portals = { ...game.portals };

            const moves = newGame.moves({ square: sourceSquare, verbose: true });
            const portalMove = moves.find(move => move.portal && move.to === targetSquare);
            let moveResult;
            if (portalMove) {
                moveResult = newGame.move({ from: sourceSquare, to: targetSquare, via: portalMove.via, portal: true });
            } else {
                moveResult = newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
            }

            if (moveResult) {
                const cleanMove = {
                    captured: moveResult.captured || null,
                    promotion: moveResult.promotion || null,
                    from: moveResult.from,
                    to: moveResult.to,
                    piece: moveResult.piece,
                    color: moveResult.color,
                    flags: moveResult.flags || '',
                    san: moveResult.san || '',
                    via: moveResult.via || null,
                    portal: moveResult.portal || false
                };
                const updatedHistory = [...(moveHistory || []), cleanMove];
                const newTurn = gameState.current_turn === 'white' ? 'black' : 'white';
                const currentTime = getServerTime();
                const lastMoveTime = gameState.lastMoveTime || currentTime;
                const elapsedSeconds = Math.floor((currentTime - lastMoveTime) / 1000);
                const currentWhiteTime = typeof gameState.whiteTime === 'number' ? gameState.whiteTime : 600;
                const currentBlackTime = typeof gameState.blackTime === 'number' ? gameState.blackTime : 600;
                const updatedWhiteTime = gameState.current_turn === 'white' ? Math.max(0, currentWhiteTime - elapsedSeconds) : currentWhiteTime;
                const updatedBlackTime = gameState.current_turn === 'black' ? Math.max(0, currentBlackTime - elapsedSeconds) : currentBlackTime;

                const updatesForFirebase = {
                    fen: newGame.fen(),
                    portals: newGame.portals,
                    current_turn: newTurn,
                    lastMoveTime: currentTime,
                    lastMove: cleanMove,
                    whiteTime: updatedWhiteTime,
                    blackTime: updatedBlackTime
                };

                const movesRef = ref(database, `games/${gameId}/moves`);
                const moveDataWithTimestamp = {
                    ...cleanMove,
                    timestamp: serverTimestamp()
                };

                setGame(newGame);
                updateLostPieces(newGame);

                const gameStatus = newGame.isGameOver();
                if (gameStatus.over) {
                    const gameDetails = {
                        winner: gameStatus.winner,
                        reason: gameStatus.reason
                    };
                    const gameRef = ref(database, `games/${gameId}`);
                    const currentDataForArchive = {
                        ...gameState,
                        ...updatesForFirebase,
                        moveHistory: updatedHistory
                    };

                    runTransaction(gameRef, (currentData) => {
                        if (!currentData || currentData.status !== 'active') return undefined;
                        return {
                            ...currentData,
                            ...updatesForFirebase,
                            status: 'finished',
                            winner: gameStatus.winner,
                            reason: gameStatus.reason
                        };
                    }).then(async (transactionResult) => {
                        if (transactionResult.committed) {
                            setGameEndDetails(gameDetails);
                            setShowGameEndPopup(true);
                            push(movesRef, moveDataWithTimestamp).then(() => {
                                initiateArchiving(currentDataForArchive, gameDetails);
                            }).catch(error => {
                                initiateArchiving(currentDataForArchive, gameDetails);
                            });
                        }
                    }).catch(error => {
                    });

                } else {
                    Promise.all([
                        update(ref(database, `games/${gameId}`), updatesForFirebase),
                        push(movesRef, moveDataWithTimestamp)
                    ]).catch(error => {
                    });
                }
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }, [
        game, setGame, gameState, gameId, moveHistory, getServerTime,
        updateLostPieces, initiateArchiving, isGameArchived, isArchivingLocally,
        isMyTurn, areBothPlayersJoined, whiteTime, blackTime,
        setGameEndDetails, setShowGameEndPopup
    ]);

    const handleSquareClick = useCallback((square) => {
        if (gameState?.status === 'archived' || gameState?.status === 'archiving' || isGameArchived || isArchivingLocally) {
            return;
        }

        if (!portalMode) {
            if (!selectedSquare) {
                const piece = game.get(square);
                if (piece && piece.color === game.turn() && isMyTurn && isMyTurn()) {
                    setSelectedSquare(square);
                }
            } else {
                makeMove(selectedSquare, square);
                setSelectedSquare(null);
            }
        } else {
            if (!isMyTurn || !isMyTurn()) {
                return;
            }
            if (!portalStart) {
                if (game.get(square)) {
                    alert("Cannot place portal start on an occupied square!");
                    return;
                }
                if (game.portals[square]) {
                    alert("Cannot place portal start on an existing portal!");
                    return;
                }
                setPortalStart(square);
            } else {
                if (game.get(square)) {
                    alert("Cannot place portal end on an occupied square!");
                    return;
                }
                if (game.portals[square]) {
                    alert("Cannot place portal end on an existing portal!");
                    return;
                }
                if (portalStart === square) {
                    alert("Portal start and end cannot be the same square!");
                    return;
                }

                try {
                    const tempGame = new PortalChess(game.fen(), gameState?.portal_count);
                    tempGame.portals = { ...game.portals };
                    tempGame.placePair(portalStart, square);

                    const newGame = tempGame;
                    setGame(newGame);

                    const portalMove = {
                        type: 'portal',
                        from: portalStart,
                        to: square,
                        piece: gameState?.current_turn === 'white' ? 'P' : 'p',
                        color: gameState?.current_turn,
                        san: `Portal ${portalStart}↔${square}`,
                        portal: true
                    };
                    const newTurn = gameState?.current_turn === 'white' ? 'black' : 'white';
                    const currentTime = getServerTime();
                    const lastMoveTime = gameState?.lastMoveTime || currentTime;
                    const elapsedSeconds = Math.floor((currentTime - lastMoveTime) / 1000);
                    const currentWhiteTime = typeof gameState?.whiteTime === 'number' ? gameState.whiteTime : 600;
                    const currentBlackTime = typeof gameState?.blackTime === 'number' ? gameState.blackTime : 600;
                    const updatedWhiteTime = gameState?.current_turn === 'white' ? Math.max(0, currentWhiteTime - elapsedSeconds) : currentWhiteTime;
                    const updatedBlackTime = gameState?.current_turn === 'black' ? Math.max(0, currentBlackTime - elapsedSeconds) : currentBlackTime;

                    update(ref(database, `games/${gameId}`), {
                        portals: newGame.portals,
                        current_turn: newTurn,
                        lastMoveTime: currentTime,
                        lastMove: portalMove,
                        whiteTime: updatedWhiteTime,
                        blackTime: updatedBlackTime
                    });

                    const movesRef = ref(database, `games/${gameId}/moves`);
                    const portalMoveWithTimestamp = {
                        ...portalMove,
                        timestamp: serverTimestamp()
                    };
                    push(movesRef, portalMoveWithTimestamp);

                    setPortalStart(null);
                    setPortalMode(false);
                } catch (error) {
                    alert(`Portal placement failed: ${error.message || `Maximum number of portals (${gameState?.portal_count}) reached!`}`);
                    setPortalStart(null);
                    setPortalMode(false);
                }
            }
        }
    }, [
        game, setGame, gameState, gameId, portalMode, portalStart, selectedSquare,
        makeMove, isGameArchived, isArchivingLocally,
        isMyTurn, getServerTime, setPortalMode, setPortalStart, setSelectedSquare
    ]);

    return {
        makeMove,
        handleSquareClick,
        portalMode,
        setPortalMode,
        portalStart,
        selectedSquare,
        setSelectedSquare
    };
};