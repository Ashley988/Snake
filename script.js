// snake.js
(function () {
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
  let gameInterval = null;
  let gridSize = 20; // Größe eines Segments (Pixel)
  let cols = canvas.width / gridSize;
  let rows = canvas.height / gridSize;
  let wallMode = 'deadly';
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
  // Highscore aus localStorage laden (falls vorhanden)
  if (localStorage.getItem('snakeHighscore')) {
    highscore = parseInt(localStorage.getItem('snakeHighscore'), 10);
    if (isNaN(highscore)) highscore = 0;
  }
  highscoreSpan.textContent = highscore;
  // Startbildschirm anzeigen, Konfigurationsbildschirm und Hauptspiel-Elemente ausblenden
  function showStartScreen() {
    startScreen.style.display = 'flex';
    configScreen.style.display = 'none';
    // Pause eventuelle laufende Spielschleife
    if (gameInterval) {
      clearInterval(gameInterval);
    }
  }
  // Konfigurationsbildschirm für Farbauswahl und Wandmodus anzeigen
  function showConfigScreen() {
    startScreen.style.display = 'none';
    configScreen.style.display = 'flex';
  }
  // Overlays ausblenden und das Spiel starten
  function startGame() {
    // Ausgewählte Farbe und Wandmodus abrufen
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
    // Anfangsrichtung neutral setzen (Schlange bleibt stehen bis erste Eingabe)
    snakeDir = { x: 0, y: 0 };
    // Ersten Apfel platzieren
    placeApple();
    // Konfigurations-Overlay ausblenden
    configScreen.style.display = 'none';
    // Spielschleife starten
    const speed = 100;
    gameInterval = setInterval(updateGame, speed);
  }
  // Apfel an einer zufälligen Position platzieren, die nicht von der Schlange belegt ist
  function placeApple() {
    let valid = false;
    let newApple = { x: 0, y: 0 };
    while (!valid) {
      newApple.x = Math.floor(Math.random() * cols);
      newApple.y = Math.floor(Math.random() * rows);
      // Stelle sicher, dass der Apfel nicht auf der Schlange liegt
      valid = !snake.some(segment => segment.x === newApple.x && segment.y === newApple.y);
    }
    apple = newApple;
  }
  // Richtungsänderung aufgrund von Eingabe (Pfeiltasten oder Buttons)
  function setDirection(dx, dy) {
    // Umkehr der Richtung verhindern, wenn die Schlange länger als 1 ist
    if (snake.length > 1) {
      const nextX = snake[0].x + dx;
      const nextY = snake[0].y + dy;
      // Die gewünschte Richtung führt direkt zurück in das zweite Segment -> ignorieren
      if (snake[1].x === nextX && snake[1].y === nextY) {
        return;
      }
    }
    snakeDir = { x: dx, y: dy };
  }
  // Aktualisiere den Spielzustand in jedem Tick
  function updateGame() {
    if (!snakeDir.x && !snakeDir.y) {
      // Schlange bewegt sich noch nicht, bis eine Richtung gesetzt wird
      drawGame();
      return;
    }
    // Neue Kopfposition berechnen
    let headX = snake[0].x + snakeDir.x;
    let headY = snake[0].y + snakeDir.y;
    // Wand-Kollision oder -Durchlauf behandeln
    if (wallMode === 'deadly') {
      if (headX < 0 || headX >= cols || headY < 0 || headY >= rows) {
        gameOver();
        return;
      }
    } else if (wallMode === 'wrap') {
      // An gegenüberliegender Seite wieder auftauchen (Wrap-Around)
      if (headX < 0) headX = cols - 1;
      else if (headX >= cols) headX = 0;
      if (headY < 0) headY = rows - 1;
      else if (headY >= rows) headY = 0;
    }
    const newHead = { x: headX, y: headY };
    // Prüfen, ob ein Apfel gegessen wird
    const eatingApple = apple && newHead.x === apple.x && newHead.y === apple.y;
    // Schwanz entfernen, wenn kein Apfel gegessen wird (Schlange bewegt sich ohne Wachstum)
    if (!eatingApple) {
      snake.pop();
    }
    // Prüfen auf Kollision mit sich selbst nach potentieller Bewegung
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      gameOver();
      return;
    }
    // Neuen Kopf zur Schlange hinzufügen
    snake.unshift(newHead);
    // Wenn Apfel gegessen, Score erhöhen und neuen Apfel platzieren
    if (eatingApple) {
      score++;
      scoreSpan.textContent = score;
      placeApple();
      // Highscore aktualisieren, falls überschritten
      if (score > highscore) {
        highscore = score;
        highscoreSpan.textContent = highscore;
        localStorage.setItem('snakeHighscore', highscore);
      }
    }
    // Alles neu zeichnen
    drawGame();
  }
  // Zeichnet Schlange, Apfel und Hintergrund
  function drawGame() {
    // Canvas leeren (schwarz füllen)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Schlange zeichnen
    ctx.fillStyle = snakeColor;
    snake.forEach(segment => {
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
    // Apfel zeichnen
    if (apple) {
      ctx.fillStyle = 'red';
      ctx.fillRect(apple.x * gridSize, apple.y * gridSize, gridSize, gridSize);
    }
  }
  // Behandelt Game Over
  function gameOver() {
    clearInterval(gameInterval);
    alert('Game Over! Punkte: ' + score);
    // Startbildschirm erneut anzeigen (Neustart ermöglichen)
    showStartScreen();
  }
  // Event Listener für Steuerung
  // Pfeiltasten (für Desktop-Nutzung)
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') setDirection(0, -1);
    else if (e.key === 'ArrowDown') setDirection(0, 1);
    else if (e.key === 'ArrowLeft') setDirection(-1, 0);
    else if (e.key === 'ArrowRight') setDirection(1, 0);
  });
  // Button-Steuerung für mobile Geräte
  btnUp.addEventListener('click', () => setDirection(0, -1));
  btnDown.addEventListener('click', () => setDirection(0, 1));
  btnLeft.addEventListener('click', () => setDirection(-1, 0));
  btnRight.addEventListener('click', () => setDirection(1, 0));
  // Logik für Start- und Spiel-Buttons
  startButton.addEventListener('click', showConfigScreen);
  playButton.addEventListener('click', startGame);
  // Initialer Aufruf: Startbildschirm anzeigen
  showStartScreen();
})();