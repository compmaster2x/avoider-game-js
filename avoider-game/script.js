const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: 200, y: 550, size: 30, speed: 5 };
let obstacles = [];
let score = 0;
let gameOver = false;

function spawnObstacle() {
    const size = 30;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 3;
    obstacles.push({ x, y, size, speed });
}

function update() {
    if (gameOver) return;

    // Move obstacles
    for (let obs of obstacles) {
        obs.y += obs.speed;
        // Check collision
        if (
            obs.x < player.x + player.size &&
            obs.x + obs.size > player.x &&
            obs.y < player.y + player.size &&
            obs.y + obs.size > player.y
        ) {
            gameOver = true;
        }
    }

    // Remove off-screen obstacles
    obstacles = obstacles.filter(obs => obs.y < canvas.height);

    score++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Draw obstacles
    ctx.fillStyle = '#f00';
    for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.size, obs.size);
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);

    if (gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = '40px sans-serif';
        ctx.fillText('Game Over', 100, 300);
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && player.x > 0) {
        player.x -= player.speed;
    }
    if (e.key === 'ArrowRight' && player.x < canvas.width - player.size) {
        player.x += player.speed;
    }
});

// Spawn new obstacles every second
setInterval(() => {
    if (!gameOver) spawnObstacle();
}, 1000);

gameLoop();
