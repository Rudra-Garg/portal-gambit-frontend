import { Chess } from 'chess.js';

export class PortalChess extends Chess {
  constructor(fen) {
    super(fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    this.portals = {};
    this.portalMoves = 0;
    this.maxPortals = 3;
  }

  moves({ square, verbose } = {}) {
    console.log('Calculating moves for square:', square);
    console.log('Current portals:', this.portals);
    
    let standardMoves = super.moves({ square, verbose });
    console.log(typeof(standardMoves));
    console.log('Initial standard moves:', standardMoves);
    standardMoves.forEach(move => console.log(typeof move === 'object' ? JSON.stringify(move, null, 2) : move));
    console.log("passed chk 1")

    // Filter out moves that would pass through a portal
    // standardMoves = standardMoves.filter(move => {
    //   const dx = Math.sign(move.to.charCodeAt(0) - move.from.charCodeAt(0));
    //   const dy = Math.sign(parseInt(move.to[1]) - parseInt(move.from[1]));
    //   let x = move.from.charCodeAt(0);
    //   let y = parseInt(move.from[1]);
    //
    //   while (x !== move.to.charCodeAt(0) || y !== parseInt(move.to[1])) {
    //     x += dx;
    //     y += dy;
    //     const square = String.fromCharCode(x) + y;
    //     if (this.portals[square]) {
    //       return false;
    //     }
    //   }
    //   return true;
    // });
    
    const portalMoves = [];
    const piece = this.get(square);
    console.log("reached portal check")
    if (!piece) return standardMoves;
    
    // Check if piece can move to any portal squares
    Object.entries(this.portals).forEach(([portalSquare, portal]) => {
      // Check if the piece can move to the portal entrance
      const movesToPortal = super.moves({ square, verbose: true })
        .filter(move => move.to === portalSquare);
      
      if (movesToPortal.length > 0) {
        console.log('Can move to portal at:', portalSquare);
        const portalExit = portal.linkedTo;
        console.log('Portal exit at:', portalExit);
        
        // Calculate direction of movement to portal
        const moveToPortal = movesToPortal[0];
        const dx = Math.sign(moveToPortal.to.charCodeAt(0) - moveToPortal.from.charCodeAt(0));
        const dy = Math.sign(parseInt(moveToPortal.to[1]) - parseInt(moveToPortal.from[1]));
        
        // Temporarily move piece to portal exit
        const originalPiece = this.remove(square);
        this.put(originalPiece, portalExit);
        
        // Get all possible moves from the exit point
        const exitMoves = this.moves({ square: portalExit, verbose: true });
        
        // Filter moves that maintain the same direction
        exitMoves.forEach(move => {
          const exitDx = Math.sign(move.to.charCodeAt(0) - portalExit.charCodeAt(0));
          const exitDy = Math.sign(parseInt(move.to[1]) - parseInt(portalExit[1]));
          
          if (exitDx === dx && exitDy === dy) {
            const targetPiece = this.get(move.to);
            if (!targetPiece || targetPiece.color !== piece.color) {
              portalMoves.push({
                color: piece.color,
                from: square,
                to: move.to,
                piece: piece.type,
                via: portalSquare,
                portal: true,
                flags: 'p',
                san: `P${portalSquare}-${move.to}`,
                captured: targetPiece ? targetPiece.type : undefined,
                lan: `${square}${move.to}`,
                after: this.fen(),
                before: this.fen()
              });
            }
          }
        });
        
        // Restore piece to original position
        this.remove(portalExit);
        this.put(originalPiece, square);
      }
    });

    console.log('Portal moves:', portalMoves);
    const allMoves = [...standardMoves, ...portalMoves];
    console.log('All available moves:', allMoves);
    
    return verbose ? allMoves : allMoves.map(m => m.san);
  }

  move(moveObj) {
    if (moveObj.portal) {
      const piece = this.get(moveObj.from);
      if (!piece) return null;
      
      // Validate the move is legal
      const moves = this.moves({ square: moveObj.from, verbose: true });
      const isValid = moves.some(move => 
        move.portal && 
        move.to === moveObj.to && 
        move.via === moveObj.via
      );
      
      if (!isValid) return null;

      // Remove piece from start
      this.remove(moveObj.from);
      
      // Place piece at final destination
      this.put(piece, moveObj.to);
      
      // Update turn
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
    if (Object.keys(this.portals).length / 2 >= this.maxPortals) {
      throw new Error('Maximum portals reached');
    }

    this.portals[square1] = {
      linkedTo: square2,
      player: this.turn()
    };
    this.portals[square2] = {
      linkedTo: square1,
      player: this.turn()
    };
  }
} 