// snake.js
(function() {
  // Canvas und Kontext
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // Spielzustand-Variablen
  let snake = [];
  let snakeDir = { x: 0, y: 0 };
  let snakeColor = 'green';
  let apple = null;
  let score = 0;
  let highscore = 0;
  let gridSize = 20;
  let cols = canvas.width / gridSize;
  let rows = canvas.height / gridSize;
  let wallMode = 'deadly'; 
  let gameActive = false;
  let lastMoveTime = 0;
  let moveInterval = 150;
  let appleCounter = 0;

  // DOM-Elemente
  const scoreSpan = document.getElementById('score');
  const highscoreSpan = document.getElementById('highscore');
  const startScreen = document.getElementById('start-screen');
  const configScreen = document.getElementById('config-screen');
  const startButton = document.getElementById('start-button');
  const playButton = document.getElementById('play-button');
  const colorSelect = document.getElementById('color-select');
  const wallSelect = document.getElementById('wall-select');
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const speedSelect = document.getElementById('speed-select');
  const autoSpeedCheckbox = document.getElementById('auto-speed');

  // Highscore aus localStorage laden (falls vorhanden)
  if (localStorage.getItem('snakeHighscore')) {
    highscore = parseInt(localStorage.getItem('snakeHighscore'), 10);
    if (isNaN(highscore)) {
      highscore = 0;
    }
    highscoreSpan.textContent = highscore;
  }

  // Startbildschirm anzeigen (Hauptmenü)
  function showStartScreen() {
    // Canvas leeren
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    startScreen.style.display = 'flex';
    configScreen.style.display = 'none';
    gameActive = false;
  }

  // Konfigurationsbildschirm anzeigen
  function showConfigScreen() {
    startScreen.style.display = 'none';
    configScreen.style.display = 'flex';
  }

  // Spiel starten (bei Klick auf Play)
  function startGame() {
    // ausgewählte Farbe und Wandmodus abrufen
    snakeColor = colorSelect.value;
    wallMode = wallSelect.value;
    // Spielzustand initialisieren
    score = 0;
    scoreSpan.textContent = score;
    snake = [];
    // Startposition der Schlange in der Mitte des Canvas
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    snake.push({ x: startX, y: startY });
    // Anfangsrichtung neutral (Schlange steht bis erste Eingabe)
    snakeDir = { x: 0, y: 0 };
    // Ersten Apfel platzieren
    placeApple();
    // Konfigurations-Overlay ausblenden
    configScreen.style.display = 'none';
    // Geschwindigkeit festlegen
    if (autoSpeedCheckbox.checked) {
      moveInterval = 250;
    } else {
      moveInterval = parseInt(speedSelect.value, 10);
      if (isNaN(moveInterval)) {
        // Wenn die Optionstexte keine Zahlen sind, hier ein Beispiel-Mapping:
        const sel = speedSelect.value;
        if (sel === 'Sehr langsam' || sel === '250') moveInterval = 250;
        else if (sel === 'Langsam' || sel === '200') moveInterval = 200;
        else if (sel === 'Normal' || sel === '150') moveInterval = 150;
        else if (sel === 'Schnell' || sel === '100') moveInterval = 100;
        else if (sel === 'Sehr schnell' || sel === '50') moveInterval = 50;
        else moveInterval = 150;
      }
    }
    appleCounter = 0;
    gameActive = true;
    lastMoveTime = Date.now();
    console.log("Spiel gestartet mit Intervall: " + moveInterval);
  }

  // Apfel an einer zufälligen, freien Position platzieren
  function placeApple() {
    let valid = false;
    let newApple = { x: 0, y: 0 };
    while (!valid) {
      newApple.x = Math.floor(Math.random() * cols);
      newApple.y = Math.floor(Math.random() * rows);
      // sicherstellen, dass der Apfel nicht auf der Schlange liegt
      valid = !snake.some(segment => segment.x === newApple.x && segment.y === newApple.y);
    }
    apple = newApple;
  }

  // Richtung setzen (Pfeiltasten oder Buttons). Verhindert direkte Umkehr
  function setDirection(dx, dy) {
    if (snake.length > 1) {
      const nextX = snake[0].x + dx;
      const nextY = snake[0].y + dy;
      // Wenn die gewünschte Richtung direkt zurück ins 2. Segment führt, ignorieren
      if (snake[1].x === nextX && snake[1].y === nextY) {
        return;
      }
    }
    snakeDir = { x: dx, y: dy };
  }

  // Spielzustand in jedem Tick aktualisieren
  function updateGame() {
    if (!gameActive) return;
    // Falls noch keine Richtung (Schlange steht zu Beginn), nichts tun
    if (snakeDir.x === 0 && snakeDir.y === 0) {
      return;
    }
    // Neue Kopfposition berechnen
    let newHead = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
    // Wandmodus berücksichtigen
    if (wallMode === 'deadly') {
      // Bei Wandkontakt Spiel beenden
      if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
        gameOver();
        return;
      }
    } else {
      // Durchlässiger Rand: Umbruch an gegenüberliegendem Rand
      if (newHead.x < 0) newHead.x = cols - 1;
      if (newHead.x >= cols) newHead.x = 0;
      if (newHead.y < 0) newHead.y = rows - 1;
      if (newHead.y >= rows) newHead.y = 0;
    }
    // Selbst-Kollision überprüfen
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      gameOver();
      return;
    }
    // Kopf am Anfang des Arrays hinzufügen
    snake.unshift(newHead);
    // Apfel gegessen?
    if (apple && newHead.x === apple.x && newHead.y === apple.y) {
      score++;
      scoreSpan.textContent = score;
      appleCounter++;
      // Highscore aktualisieren
      if (score > highscore) {
        highscore = score;
        localStorage.setItem('snakeHighscore', highscore);
        highscoreSpan.textContent = highscore;
      }
      // Neuen Apfel platzieren
      placeApple();
      // Automatische Geschwindigkeitssteigerung (alle 5 Äpfel)
      if (autoSpeedCheckbox.checked && appleCounter %  === 2) {
        moveInterval = Math.max(70, moveInterval - 20, 50);
      }
      // Nicht das Schwanzende entfernen (Schlange wächst)
    } else {
      // Nicht gegessen -> letztes Segment entfernen
      snake.pop();
    }
    // Spiel auf Canvas zeichnen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Schlange zeichnen
    ctx.fillStyle = snakeColor;
    snake.forEach(segment => {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
    // Apfel zeichnen (rot)
    if (apple) {
      ctx.fillStyle = 'red';
      ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize, gridSize);
    }
  }

  // Spiel beenden
  function gameOver() {
    alert('Game Over! Punkte: ' + score);
    gameActive = false;
    showStartScreen();
  }

  // Steuerung per Tastatur (Pfeiltasten)
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') setDirection(0, -1);
    else if (e.key === 'ArrowDown') setDirection(0, 1);
    else if (e.key === 'ArrowLeft') setDirection(-1, 0);
    else if (e.key === 'ArrowRight') setDirection(1, 0);
  });
  // Steuerung per Buttons (für Mobile)
  btnUp.addEventListener('click', () => setDirection(0, -1));
  btnDown.addEventListener('click', () => setDirection(0, 1));
  btnLeft.addEventListener('click', () => setDirection(-1, 0));
  btnRight.addEventListener('click', () => setDirection(1, 0));

  // Buttons für Start und Spiel
  startButton.addEventListener('click', showConfigScreen);
  playButton.addEventListener('click', startGame);

  // Initialer Aufruf: Startbildschirm anzeigen
  showStartScreen();

  // Game-Loop mit requestAnimationFrame
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    const now = Date.now();
    if (now - lastMoveTime >= moveInterval) {
      updateGame();
      lastMoveTime = now;
    }
  }
  // Loop starten
  lastMoveTime = Date.now();
  gameLoop();

})();
