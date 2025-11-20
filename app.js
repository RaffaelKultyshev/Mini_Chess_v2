// Game State
let scene, camera, renderer, controls;
let chessBoard, chessPieces = [];
let selectedPiece = null;
let chess;
let raycaster, mouse;
let isAiThinking = false;

// Configuration
const SQUARE_SIZE = 1;
const BOARD_OFFSET = 3.5;
const COLORS = {
    LIGHT: 0xf0d9b5,
    DARK: 0xb58863,
    SELECTED: 0x4ade80,
    HIGHLIGHT: 0x60a5fa,
    WHITE_PIECE: 0xffffff,
    BLACK_PIECE: 0x333333
};

// Initialize
window.onload = function() {
    try {
        init();
    } catch (e) {
        console.error("Init error:", e);
        document.getElementById('status').textContent = "Fout bij laden: " + e.message;
    }
};

function init() {
    // Initialize Chess logic
    chess = new Chess();

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2c3e50); // Darker background
    
    // Camera
    const container = document.getElementById('canvas-container');
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.2; // Prevent going below board
        controls.minDistance = 5;
        controls.maxDistance = 20;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    
    // Helpers
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Build Game
    createBoard();
    loadPieces();
    
    // Events
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    
    // Start loop
    animate();
    updateStatus("Wit aan zet (Jij)");
}

function createBoard() {
    chessBoard = new THREE.Group();
    
    const geometry = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isLight = (row + col) % 2 === 0;
            const material = new THREE.MeshStandardMaterial({
                color: isLight ? COLORS.LIGHT : COLORS.DARK,
                roughness: 0.5,
                metalness: 0.1
            });
            
            const square = new THREE.Mesh(geometry, material);
            square.position.set(col - BOARD_OFFSET, 0, row - BOARD_OFFSET);
            square.receiveShadow = true;
            square.userData = { isSquare: true, row, col };
            
            chessBoard.add(square);
        }
    }
    
    // Board border
    const borderGeo = new THREE.BoxGeometry(8.4, 0.05, 8.4);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = -0.05;
    chessBoard.add(border);
    
    scene.add(chessBoard);
}

function loadPieces() {
    // Clear existing pieces
    chessPieces.forEach(p => scene.remove(p));
    chessPieces = [];
    
    const board = chess.board();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                createPieceMesh(piece.type, piece.color, row, col);
            }
        }
    }
}

function createPieceMesh(type, color, row, col) {
    let geometry;
    // Simplified geometries for different pieces
    switch(type) {
        case 'p': geometry = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 16); break;
        case 'r': geometry = new THREE.BoxGeometry(0.4, 0.8, 0.4); break;
        case 'n': geometry = new THREE.ConeGeometry(0.25, 0.8, 16); break;
        case 'b': geometry = new THREE.CylinderGeometry(0.1, 0.3, 0.9, 16); break;
        case 'q': geometry = new THREE.CylinderGeometry(0.3, 0.2, 1.1, 6); break;
        case 'k': geometry = new THREE.CylinderGeometry(0.3, 0.2, 1.2, 8); break;
        default: geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    }
    
    const material = new THREE.MeshStandardMaterial({
        color: color === 'w' ? COLORS.WHITE_PIECE : COLORS.BLACK_PIECE,
        roughness: 0.3,
        metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position conversion (Chess.js 0,0 is top-left (a8), Three.js needs mapping)
    // Chess.js: row 0 = rank 8, row 7 = rank 1
    // Three.js: we want rank 8 at z = -3.5, rank 1 at z = 3.5
    
    mesh.position.set(col - BOARD_OFFSET, 0.5, row - BOARD_OFFSET);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.userData = {
        isPiece: true,
        type: type,
        color: color,
        square: String.fromCharCode(97 + col) + (8 - row)
    };
    
    chessPieces.push(mesh);
    scene.add(mesh);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseClick(event) {
    if (isAiThinking || chess.game_over()) return;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check for piece selection
    const intersects = raycaster.intersectObjects(chessPieces);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj.userData.color === 'w') { // Only allow selecting white pieces
            selectPiece(obj);
            return;
        } else if (selectedPiece && obj.userData.color === 'b') {
            // Capture move
            const move = {
                from: selectedPiece.userData.square,
                to: obj.userData.square,
                promotion: 'q'
            };
            makeMove(move);
            return;
        }
    }
    
    // Check for square selection (move)
    if (selectedPiece) {
        const boardIntersects = raycaster.intersectObjects(chessBoard.children);
        if (boardIntersects.length > 0) {
            const square = boardIntersects[0].object;
            if (square.userData.isSquare) {
                const targetSquare = String.fromCharCode(97 + square.userData.col) + (8 - square.userData.row);
                const move = {
                    from: selectedPiece.userData.square,
                    to: targetSquare,
                    promotion: 'q'
                };
                makeMove(move);
            }
        }
    }
}

function selectPiece(mesh) {
    // Reset previous selection
    if (selectedPiece) {
        selectedPiece.material.emissive.setHex(0x000000);
        clearHighlights();
    }
    
    selectedPiece = mesh;
    selectedPiece.material.emissive.setHex(0x00ff00); // Green glow
    selectedPiece.material.emissiveIntensity = 0.5;
    
    highlightValidMoves(selectedPiece.userData.square);
}

function highlightValidMoves(square) {
    const moves = chess.moves({ square: square, verbose: true });
    
    moves.forEach(move => {
        const col = move.to.charCodeAt(0) - 97;
        const row = 8 - parseInt(move.to[1]);
        
        const boardSquare = chessBoard.children.find(c => 
            c.userData.row === row && c.userData.col === col
        );
        
        if (boardSquare) {
            boardSquare.material.emissive.setHex(COLORS.HIGHLIGHT);
            boardSquare.material.emissiveIntensity = 0.5;
        }
    });
}

function clearHighlights() {
    chessBoard.children.forEach(child => {
        if (child.userData.isSquare) {
            child.material.emissive.setHex(0x000000);
        }
    });
}

function makeMove(moveObj) {
    const move = chess.move(moveObj);
    
    if (move) {
        // Valid move
        loadPieces(); // Re-render board
        selectedPiece = null;
        clearHighlights();
        
        updateStatus();
        
        if (!chess.game_over()) {
            // AI Turn
            isAiThinking = true;
            document.getElementById('ai-status').textContent = "Computer denkt na...";
            setTimeout(makeAiMove, 500);
        }
    } else {
        // Invalid move
        console.log("Invalid move");
    }
}

function makeAiMove() {
    if (chess.game_over()) return;
    
    // Simple AI: Random valid move for now (can be upgraded to minimax)
    const moves = chess.moves();
    
    if (moves.length > 0) {
        // Try to find a capture or check
        const aggressiveMoves = moves.filter(m => m.includes('x') || m.includes('+'));
        const randomMove = aggressiveMoves.length > 0 
            ? aggressiveMoves[Math.floor(Math.random() * aggressiveMoves.length)]
            : moves[Math.floor(Math.random() * moves.length)];
            
        chess.move(randomMove);
        loadPieces();
        
        isAiThinking = false;
        document.getElementById('ai-status').textContent = "";
        updateStatus();
    }
}

function updateStatus(msg) {
    if (msg) {
        document.getElementById('status').textContent = msg;
        return;
    }
    
    let status = '';
    const moveColor = chess.turn() === 'w' ? 'Wit' : 'Zwart';
    
    if (chess.in_checkmate()) {
        status = `Game over, ${moveColor} is schaakmat.`;
    } else if (chess.in_draw()) {
        status = 'Gelijkspel!';
    } else {
        status = `${moveColor} aan zet`;
        if (chess.in_check()) {
            status += ' (Schaak!)';
        }
    }
    
    document.getElementById('status').textContent = status;
    document.getElementById('current-turn').textContent = moveColor === 'Wit' ? 'Wit (Jij)' : 'Zwart (Computer)';
}

function resetGame() {
    chess.reset();
    loadPieces();
    selectedPiece = null;
    clearHighlights();
    isAiThinking = false;
    updateStatus("Nieuw spel. Wit aan zet.");
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}
