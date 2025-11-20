// Initialize Three.js scene
let scene, camera, renderer, chessBoard, chessPieces = [];
let selectedPiece = null;
let chess = new Chess();
let raycaster, mouse;

// Colors
const LIGHT_SQUARE = 0xf0d9b5;
const DARK_SQUARE = 0xb58863;
const SELECTED_COLOR = 0x4ade80;
const HIGHLIGHT_COLOR = 0x60a5fa;

// Initialize the game
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 8, 8);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Raycaster for mouse picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create chess board
    createChessBoard();
    
    // Create chess pieces
    createChessPieces();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    
    // Start animation loop
    animate();
    updateUI();
}

function createChessBoard() {
    chessBoard = new THREE.Group();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isLight = (row + col) % 2 === 0;
            const color = isLight ? LIGHT_SQUARE : DARK_SQUARE;
            
            const geometry = new THREE.BoxGeometry(1, 0.1, 1);
            const material = new THREE.MeshStandardMaterial({ color });
            const square = new THREE.Mesh(geometry, material);
            
            square.position.set(col - 3.5, 0, row - 3.5);
            square.receiveShadow = true;
            square.userData = { row, col, isLight };
            
            chessBoard.add(square);
        }
    }
    
    scene.add(chessBoard);
}

function createChessPieces() {
    const pieceGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const piecePositions = [
        // White pieces
        { type: 'r', pos: [0, 0], color: 0xffffff },
        { type: 'n', pos: [1, 0], color: 0xffffff },
        { type: 'b', pos: [2, 0], color: 0xffffff },
        { type: 'q', pos: [3, 0], color: 0xffffff },
        { type: 'k', pos: [4, 0], color: 0xffffff },
        { type: 'b', pos: [5, 0], color: 0xffffff },
        { type: 'n', pos: [6, 0], color: 0xffffff },
        { type: 'r', pos: [7, 0], color: 0xffffff },
        // White pawns
        ...Array.from({ length: 8 }, (_, i) => ({ type: 'p', pos: [i, 1], color: 0xffffff })),
        // Black pawns
        ...Array.from({ length: 8 }, (_, i) => ({ type: 'p', pos: [i, 6], color: 0x333333 })),
        // Black pieces
        { type: 'r', pos: [0, 7], color: 0x333333 },
        { type: 'n', pos: [1, 7], color: 0x333333 },
        { type: 'b', pos: [2, 7], color: 0x333333 },
        { type: 'q', pos: [3, 7], color: 0x333333 },
        { type: 'k', pos: [4, 7], color: 0x333333 },
        { type: 'b', pos: [5, 7], color: 0x333333 },
        { type: 'n', pos: [6, 7], color: 0x333333 },
        { type: 'r', pos: [7, 7], color: 0x333333 },
    ];
    
    piecePositions.forEach(({ type, pos, color }) => {
        const material = new THREE.MeshStandardMaterial({ color });
        const piece = new THREE.Mesh(pieceGeometry, material);
        
        const [col, row] = pos;
        piece.position.set(col - 3.5, 0.4, row - 3.5);
        piece.castShadow = true;
        piece.userData = { 
            type, 
            row, 
            col, 
            color: color === 0xffffff ? 'w' : 'b',
            originalColor: color
        };
        
        chessPieces.push(piece);
        scene.add(piece);
    });
}

function getSquareFromPosition(x, z) {
    const col = Math.round(x + 3.5);
    const row = Math.round(z + 3.5);
    return { row, col };
}

function getPieceAtSquare(row, col) {
    return chessPieces.find(piece => {
        const piecePos = getSquareFromPosition(piece.position.x, piece.position.z);
        return piecePos.row === row && piecePos.col === col;
    });
}

function getSquareNotation(row, col) {
    const files = 'abcdefgh';
    return files[col] + (8 - row);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(chessPieces);
    
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}

function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(chessPieces);
    
    if (intersects.length > 0) {
        const clickedPiece = intersects[0].object;
        const piecePos = getSquareFromPosition(clickedPiece.position.x, clickedPiece.position.z);
        const square = getSquareNotation(piecePos.row, piecePos.col);
        
        // Check if it's the current player's turn
        const pieceColor = clickedPiece.userData.color;
        const currentTurn = chess.turn() === 'w' ? 'w' : 'b';
        
        if (selectedPiece === null) {
            if (pieceColor === currentTurn) {
                selectedPiece = clickedPiece;
                clickedPiece.material.color.setHex(SELECTED_COLOR);
                highlightValidMoves(square);
            }
        } else {
            if (clickedPiece === selectedPiece) {
                // Deselect
                deselectPiece();
            } else if (pieceColor === currentTurn) {
                // Select different piece
                deselectPiece();
                selectedPiece = clickedPiece;
                clickedPiece.material.color.setHex(SELECTED_COLOR);
                highlightValidMoves(square);
            } else {
                // Try to move
                const fromSquare = getSquareFromPosition(selectedPiece.position.x, selectedPiece.position.z);
                const from = getSquareNotation(fromSquare.row, fromSquare.col);
                const to = square;
                
                tryMove(from, to);
            }
        }
    } else {
        // Clicked on empty square
        if (selectedPiece) {
            const piecePos = getSquareFromPosition(selectedPiece.position.x, selectedPiece.position.z);
            const from = getSquareNotation(piecePos.row, piecePos.col);
            
            // Raycast to board to get target square
            const boardIntersects = raycaster.intersectObjects(chessBoard.children);
            if (boardIntersects.length > 0) {
                const targetSquare = boardIntersects[0].object;
                const targetPos = getSquareFromPosition(targetSquare.position.x, targetSquare.position.z);
                const to = getSquareNotation(targetPos.row, targetPos.col);
                
                tryMove(from, to);
            }
        }
    }
}

function highlightValidMoves(square) {
    const moves = chess.moves({ square, verbose: true });
    
    moves.forEach(move => {
        const targetRow = 8 - parseInt(move.to[1]);
        const targetCol = move.to.charCodeAt(0) - 97;
        const targetSquare = chessBoard.children.find(child => {
            const pos = getSquareFromPosition(child.position.x, child.position.z);
            return pos.row === targetRow && pos.col === targetCol;
        });
        
        if (targetSquare) {
            targetSquare.material.emissive.setHex(HIGHLIGHT_COLOR);
            targetSquare.material.emissiveIntensity = 0.3;
        }
    });
}

function deselectPiece() {
    if (selectedPiece) {
        selectedPiece.material.color.setHex(selectedPiece.userData.originalColor);
        selectedPiece = null;
        
        // Remove highlights
        chessBoard.children.forEach(square => {
            square.material.emissive.setHex(0x000000);
            square.material.emissiveIntensity = 0;
        });
    }
}

function tryMove(from, to) {
    const move = chess.move({
        from,
        to,
        promotion: 'q' // Auto-promote to queen
    });
    
    if (move) {
        // Move piece in 3D
        const piece = selectedPiece;
        const targetRow = 8 - parseInt(to[1]);
        const targetCol = to.charCodeAt(0) - 97;
        
        // Animate piece movement
        animatePieceMove(piece, targetCol - 3.5, targetRow - 3.5);
        
        // Remove captured piece if any
        if (move.captured) {
            const capturedPiece = getPieceAtSquare(targetRow, targetCol);
            if (capturedPiece && capturedPiece !== piece) {
                scene.remove(capturedPiece);
                chessPieces = chessPieces.filter(p => p !== capturedPiece);
            }
        }
        
        deselectPiece();
        updateUI();
        
        // Check for game end
        if (chess.isCheckmate()) {
            document.getElementById('status').textContent = 'Schaakmat! ' + (chess.turn() === 'w' ? 'Zwart' : 'Wit') + ' wint!';
        } else if (chess.isDraw()) {
            document.getElementById('status').textContent = 'Gelijkspel!';
        } else if (chess.isCheck()) {
            document.getElementById('status').textContent = 'Schaak!';
        }
    } else {
        document.getElementById('status').textContent = 'Ongeldige zet!';
    }
}

function animatePieceMove(piece, targetX, targetZ) {
    const startX = piece.position.x;
    const startZ = piece.position.z;
    const duration = 500; // milliseconds
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const ease = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        piece.position.x = startX + (targetX - startX) * ease;
        piece.position.z = startZ + (targetZ - startZ) * ease;
        piece.position.y = 0.4 + Math.sin(progress * Math.PI) * 0.3;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            piece.position.y = 0.4;
        }
    }
    
    animate();
}

function updateUI() {
    const turn = chess.turn() === 'w' ? 'Wit' : 'Zwart';
    document.getElementById('current-turn').textContent = turn;
    
    if (!chess.isCheckmate() && !chess.isDraw()) {
        if (chess.isCheck()) {
            document.getElementById('status').textContent = 'Schaak!';
        } else {
            document.getElementById('status').textContent = 'Kies een stuk om te bewegen';
        }
    }
}

function resetGame() {
    chess.reset();
    deselectPiece();
    
    // Remove all pieces
    chessPieces.forEach(piece => scene.remove(piece));
    chessPieces = [];
    
    // Recreate pieces
    createChessPieces();
    
    updateUI();
    document.getElementById('status').textContent = 'Nieuw spel gestart!';
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate camera slightly for better view
    const time = Date.now() * 0.0001;
    camera.position.x = Math.sin(time * 0.5) * 2;
    camera.position.z = 8 + Math.cos(time * 0.5) * 2;
    camera.lookAt(0, 0, 0);
    
    renderer.render(scene, camera);
}

// Start the game when page loads
init();

