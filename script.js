document.addEventListener('DOMContentLoaded', () => {
    const screenStart = document.getElementById('screen-start');
    const screenGame = document.getElementById('screen-game');
    const screenEnd = document.getElementById('screen-end');
    
    const btnStart = document.getElementById('btn-start');
    const btnRestart = document.getElementById('btn-restart');
    
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    const pencilCursor = document.getElementById('pencil-cursor');

    const bgImg = new Image();
    bgImg.src = 'fondo.png';

    let isDrawing = false;
    let isFinished = false;
    let lastX = 0;
    let lastY = 0;

    function showScreen(screenToShow) {
        [screenStart, screenGame, screenEnd].forEach(screen => screen.classList.remove('active'));
        screenToShow.classList.add('active');
    }

    function initCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        drawCoverImage();
    }

    // Cargar fondo.png como la capa raspable sobre el canvas
    function drawCoverImage() {
        ctx.globalCompositeOperation = 'source-over';
        if (bgImg.complete && bgImg.naturalWidth !== 0) {
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        } else {
            bgImg.onload = () => {
                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            };
        }
    }

    // Trazo de brocha fluido
    function scratchLine(x1, y1, x2, y2) {
        if (isFinished) return;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 65; // Trazo grueso para raspar con soltura
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        checkRevealProgress();
    }

    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function updatePencilPosition(x, y) {
        pencilCursor.style.left = `${x}px`;
        pencilCursor.style.top = `${y}px`;
    }

    function startScratch(e) {
        isDrawing = true;
        const pos = getCoordinates(e);
        lastX = pos.x;
        lastY = pos.y;
        
        pencilCursor.classList.add('visible');
        updatePencilPosition(pos.x, pos.y);
        scratchLine(pos.x, pos.y, pos.x, pos.y);
    }

    function moveScratch(e) {
        const pos = getCoordinates(e);
        updatePencilPosition(pos.x, pos.y);

        if (!isDrawing) return;
        e.preventDefault();
        scratchLine(lastX, lastY, pos.x, pos.y);
        lastX = pos.x;
        lastY = pos.y;
    }

    function stopScratch() {
        isDrawing = false;
        pencilCursor.classList.remove('visible');
    }

    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('mousemove', moveScratch);
    window.addEventListener('mouseup', stopScratch);

    canvas.addEventListener('touchstart', startScratch, { passive: false });
    canvas.addEventListener('touchmove', moveScratch, { passive: false });
    window.addEventListener('touchend', stopScratch);

    // Validación por puntos de muestra (Garantiza que se haya raspado casi todo el mensaje)
    function checkRevealProgress() {
        if (isFinished) return;

        // Muestrear una matriz de 8x8 puntos dentro del 70% central de la imagen
        const cols = 8;
        const rows = 8;
        const startX = canvas.width * 0.15;
        const startY = canvas.height * 0.15;
        const width = canvas.width * 0.7;
        const height = canvas.height * 0.7;

        let clearedPoints = 0;
        const totalPoints = cols * rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const px = Math.floor(startX + (c / (cols - 1)) * width);
                const py = Math.floor(startY + (r / (rows - 1)) * height);

                const pixel = ctx.getImageData(px, py, 1, 1).data;
                // Si el canal Alpha es 0 (o casi transparente), el punto se da por raspado
                if (pixel[3] < 30) {
                    clearedPoints++;
                }
            }
        }

        const progress = clearedPoints / totalPoints;

        // Exige haber revelado al menos el 82% de la cuadrícula del texto
        if (progress >= 0.82) {
            isFinished = true;
            pencilCursor.classList.remove('visible');
            setTimeout(() => {
                showScreen(screenEnd);
            }, 400);
        }
    }

    btnStart.addEventListener('click', () => {
        showScreen(screenGame);
        initCanvas();
        isFinished = false;
    });

    btnRestart.addEventListener('click', () => {
        showScreen(screenStart);
    });

    window.addEventListener('resize', () => {
        if (screenGame.classList.contains('active')) {
            initCanvas();
        }
    });
});