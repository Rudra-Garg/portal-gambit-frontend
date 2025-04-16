import { Chess } from 'chess.js';

export class PortalChess extends Chess {
  constructor(fen, maxPortals = 3) {
    super(fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    this.portals = {};
    this.portalMoves = 0;
    this.maxPortals = maxPortals;
    this.color_hashes = ['#FF5733', '#33A1FF', '#28A745', '#FFC107', '#8E44AD'];
  }

  moves({ square, verbose, visited } = {}) {
    console.log("portal list:", this.portals);
    // Enhanced visited state
    if (!visited) {
      visited = {
        portals: new Set(),        // currently used portals
        portalChain: [],          // sequence of portals used
        blocks: new Set(),         // blocked squares
        moves: new Map()          // accumulate moves across chain
      };
    }

    let standardMoves = super.moves({ square, verbose });
    const portalMoves = [];
    const piece = this.get(square);

    if (!piece) return standardMoves;

    const isSquareInPiecePath = (from, to, checkSquare, pieceType) => {
      const fromFile = from.charCodeAt(0) - 97; // Convert 'a' to 0
      const fromRank = parseInt(from[1]) - 1;   // Convert '1' to 0
      const toFile = to.charCodeAt(0) - 97;
      const toRank = parseInt(to[1]) - 1;
      const checkFile = checkSquare.charCodeAt(0) - 97;
      const checkRank = parseInt(checkSquare[1]) - 1;
      switch (pieceType) {
        case 'r': // Rook
          if (fromFile === toFile) {
            // Vertical movement
            const minRank = Math.min(fromRank, toRank);
            const maxRank = Math.max(fromRank, toRank);
            return checkFile === fromFile && checkRank > minRank && checkRank < maxRank;
          } else if (fromRank === toRank) {
            // Horizontal movement
            const minFile = Math.min(fromFile, toFile);
            const maxFile = Math.max(fromFile, toFile);
            return checkRank === fromRank && checkFile > minFile && checkFile < maxFile;
          }
          return false;

        case 'b': // Bishop
          const dx = toFile - fromFile;
          const dy = toRank - fromRank;
          if (Math.abs(dx) === Math.abs(dy)) {
            const fileDir = Math.sign(dx);
            const rankDir = Math.sign(dy);
            let file = fromFile + fileDir;
            let rank = fromRank + rankDir;
            while (file !== toFile && rank !== toRank) {
              if (file === checkFile && rank === checkRank) return true;
              file += fileDir;
              rank += rankDir;
            }
          }
          return false;

        case 'q': // Queen - combines rook and bishop logic
          return isSquareInPiecePath(from, to, checkSquare, 'r') ||
            isSquareInPiecePath(from, to, checkSquare, 'b');

        case 'p': // Pawn - only straight movement
          if (fromFile === toFile && Math.abs(toRank - fromRank) === 2) {
            return checkFile === fromFile &&
              checkRank === (fromRank + Math.sign(toRank - fromRank));
          }
          return false;

        default: // Knights and Kings don't have intermediate squares
          return false;
      }
    };

    const blockedMoves = standardMoves.filter(move => {
      const from = typeof move === 'string' ? move.slice(0, 2) : move.from;
      const to = typeof move === 'string' ? move.slice(2, 4) : move.to;
      return Object.keys(this.portals).some(portalSquare =>
        isSquareInPiecePath(from, to, portalSquare, piece.type)
      );
    });

    let unblockedMoves = standardMoves.filter(move => !blockedMoves.includes(move));

    // Filter out standard moves that target portal squares with same-color pieces
    // or straight pawn moves to portals with opposite-color pieces on exit
    unblockedMoves = unblockedMoves.filter(move => {
      const to = typeof move === 'string' ? move.slice(2, 4) : move.to;
      const from = typeof move === 'string' ? move.slice(0, 2) : move.from;

      // Skip if the target isn't a portal square
      if (!this.portals[to]) return true;

      const portalExit = this.portals[to].linkedTo;
      const pieceOnPortalExit = this.get(portalExit);
      const movingPiece = this.get(from);

      // Block move if a same-color piece is on the other end of the portal
      if (pieceOnPortalExit && pieceOnPortalExit.color === movingPiece.color) {
        return false;
      }

      // Special case for pawns: Block straight moves to portals with opposite-color pieces
      if (movingPiece.type === 'p' && pieceOnPortalExit && pieceOnPortalExit.color !== movingPiece.color) {
        // Check if this is a straight move (same file/column)
        if (from.charAt(0) === to.charAt(0)) {
          // This is a straight pawn move to a portal with opposite piece on exit
          // Block this move
          return false;
        }
      }

      return true;
    });

    Object.entries(this.portals).forEach(([portalSquare, portal]) => {
      if (visited.portals.has(portalSquare)) return;

      const allowedPieces = ['r', 'b', 'q', 'p'];
      if (!allowedPieces.includes(piece.type)) return;

      if (piece.type === 'p') {
        const startRank = piece.color === 'w' ? '2' : '7';
        if (square[1] !== startRank) return;
      }

      // Check if there's a piece of same color on either portal square
      const portalExit = portal.linkedTo;
      const pieceOnPortalEntry = this.get(portalSquare);
      const pieceOnPortalExit = this.get(portalExit);

      // Skip this portal if either portal square has a piece of the same color
      if ((pieceOnPortalEntry && pieceOnPortalEntry.color === piece.color) ||
        (pieceOnPortalExit && pieceOnPortalExit.color === piece.color)) {
        return;
      }

      visited.portals.add(portalSquare);
      visited.portalChain.push(portalSquare);

      const movesToPortal = unblockedMoves.filter(move =>
        (typeof move === 'string' ? move.slice(2, 4) : move.to) === portalSquare
      );

      if (movesToPortal.length > 0) {
        const portalExit = portal.linkedTo;
        const moveToPortal = movesToPortal[0];

        const dx = Math.sign(moveToPortal.to.charCodeAt(0) - moveToPortal.from.charCodeAt(0));
        const dy = Math.sign(parseInt(moveToPortal.to[1]) - parseInt(moveToPortal.from[1]));

        // Check if there's a piece on the portal exit
        const pieceOnPortalExit = this.get(portalExit);

        // If there's a piece on the portal exit, only allow capture moves
        if (pieceOnPortalExit && pieceOnPortalExit.color !== piece.color) {
          // Can only capture the piece on the portal
          portalMoves.push({
            color: piece.color,
            from: square,
            to: portalExit,
            piece: piece.type,
            via: [...visited.portalChain].join('->'),
            portal: true,
            flags: 'p',
            san: `P${[...visited.portalChain].join('->')}-${portalExit}`,
            captured: pieceOnPortalExit.type,
            lan: `${square}${portalExit}`,
            after: this.fen(),
            before: this.fen()
          });

          // Skip normal portal traversal logic
          visited.portals.delete(portalSquare);
          visited.portalChain.pop();
          return;
        }

        // Normal portal traversal logic continues if no piece on portal exit
        const originalPiece = this.remove(square);
        this.put(originalPiece, portalExit);

        const exitMoves = this.moves({
          square: portalExit,
          verbose: true,
          visited
        });

        exitMoves.forEach(move => {
          if (visited.blocks.has(move.to)) return;

          const exitDx = Math.sign(move.to.charCodeAt(0) - portalExit.charCodeAt(0));
          const exitDy = Math.sign(parseInt(move.to[1]) - parseInt(portalExit[1]));

          let isValidDirection = false;
          switch (piece.type) {
            case 'r':
              isValidDirection = (exitDx === dx && exitDy === 0) || (exitDx === 0 && exitDy === dy);
              break;
            case 'b':
              isValidDirection = exitDx === dx && exitDy === dy;
              break;
            case 'q':
              isValidDirection = exitDx === dx && exitDy === dy;
              break;
            case 'p':
              isValidDirection = exitDx === 0 && exitDy === (piece.color === 'w' ? 1 : -1);
              break;
          }

          if (isValidDirection) {
            const targetPiece = this.get(move.to);
            if (!targetPiece || targetPiece.color !== piece.color) {
              visited.blocks.add(move.to);
              portalMoves.push({
                color: piece.color,
                from: square,
                to: move.to,
                piece: piece.type,
                via: [...visited.portalChain].join('->'),
                portal: true,
                flags: 'p',
                san: `P${[...visited.portalChain].join('->')}-${move.to}`,
                captured: targetPiece ? targetPiece.type : undefined,
                lan: `${square}${move.to}`,
                after: this.fen(),
                before: this.fen()
              });
            }
          }
        });

        this.remove(portalExit);
        this.put(originalPiece, square);
      }

      visited.portals.delete(portalSquare);
      visited.portalChain.pop();
    });

    const allMoves = [...unblockedMoves, ...portalMoves];
    return verbose ? allMoves : allMoves.map(m => m.san);
  }

  move(moveObj) {
    console.log("trying to move: ", moveObj)
    if (moveObj.portal) {
      const piece = this.get(moveObj.from);
      if (!piece) return null;

      const moves = this.moves({ square: moveObj.from, verbose: true });
      const isValid = moves.some(move =>
        move.portal &&
        move.to === moveObj.to &&
        move.via === moveObj.via
      );

      if (!isValid) return null;

      this.remove(moveObj.from);
      this.put(piece, moveObj.to);
      this._turn = this._turn === 'w' ? 'b' : 'w';

      return {
        color: piece.color,
        from: moveObj.from,
        to: moveObj.to,
        piece: piece.type,
        portal: true,
        via: moveObj.via
      };
    }

    return super.move(moveObj);
  }

  placePair(square1, square2) {
    // Verify that neither square is occupied
    if (this.get(square1) || this.get(square2)) {
      throw new Error("Cannot place portal on an occupied square");
    }

    // Check if either square already has a portal
    if (this.portals[square1] || this.portals[square2]) {
      throw new Error("Cannot place portal on a square that already has a portal");
    }

    const portalCount = Object.keys(this.portals).length / 2;

    if (portalCount >= this.maxPortals) {
      // Find lowest portal_id to remove
      let lowestId = Infinity;
      let portalSquaresToRemove = [];

      Object.entries(this.portals).forEach(([square, portal]) => {
        if (portal.portal_id < lowestId) {
          lowestId = portal.portal_id;
          portalSquaresToRemove = [];
        }
        if (portal.portal_id === lowestId) {
          portalSquaresToRemove.push(square);
        }
      });

      // Remove portal pair with lowest id
      portalSquaresToRemove.forEach(square => {
        delete this.portals[square];
      });
    }

    // Find highest existing portal ID
    let highestId = -1;
    Object.values(this.portals).forEach(portal => {
      if (portal.portal_id > highestId) {
        highestId = portal.portal_id;
      }
    });

    // New portal ID is highest + 1 (or 0 if no portals exist)
    const newPortalId = highestId + 1;
    const colorHash = this.color_hashes[newPortalId % this.color_hashes.length];

    // Create the portal pair with new attributes
    this.portals[square1] = {
      linkedTo: square2,
      player: this.turn(),
      portal_id: newPortalId,
      color_hash: colorHash
    };

    this.portals[square2] = {
      linkedTo: square1,
      player: this.turn(),
      portal_id: newPortalId,
      color_hash: colorHash
    };
  }

  isGameOver() {
    return {
      over: this.isCheckmate() || this.isStalemate() || this.isDraw(),
      winner: this.isCheckmate() ? (this.turn() === 'w' ? 'black' : 'white') : null,
      reason: this.isCheckmate() ? 'checkmate' :
        this.isStalemate() ? 'stalemate' :
          this.isDraw() ? 'draw' : null
    };
  }

  isCheckmate() {
    return super.isCheckmate();
  }

  isStalemate() {
    return super.isStalemate();
  }

  isDraw() {
    return super.isDraw() ||
      super.isThreefoldRepetition() ||
      super.isInsufficientMaterial();
  }
}
