const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: 200, y: 450, size: 30, speed: 5 };
let obstacles = [];

let gameOver = false;
let timeSurvived = 0;
let bullets = [];
let timerInterval;
let bestResult = localStorage.getItem('bestResult') || 0;
let meteorsDestroyed = 0;
let bestDestroyed = localStorage.getItem('bestDestroyed') || 0;



function spawnObstacle() {
    const size = 20 + Math.random() * 40; // random meteor size

    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 3;
    obstacles.push({ x, y, size, speed });
}

function update() {
    if (gameOver) return;

    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.size) {
        player.x += player.speed;
    }

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
            if (timeSurvived > bestResult) {
    bestResult = timeSurvived;
    localStorage.setItem('bestResult', bestResult);
}

if (meteorsDestroyed > bestDestroyed) {
    bestDestroyed = meteorsDestroyed;
    localStorage.setItem('bestDestroyed', bestDestroyed);
}

}


if (timeSurvived > bestResult) {
    bestResult = timeSurvived;
    localStorage.setItem('bestResult', bestResult);
}


        }

        for (let bullet of bullets) {
    for (let obs of obstacles) {
        if (
            bullet.x < obs.x + obs.size &&
            bullet.x + bullet.size > obs.x &&
            bullet.y < obs.y + obs.size &&
            bullet.y + bullet.size > obs.y
        ) {
            obstacles.splice(obstacles.indexOf(obs), 1);
            bullets.splice(bullets.indexOf(bullet), 1);

            meteorsDestroyed++; // Увеличиваем счётчик сбитых

            break;
        }
    }
}


        // Двигаем пули
for (let bullet of bullets) {
    bullet.y -= bullet.speed;
}

// Удаляем пули, которые улетели за экран
bullets = bullets.filter(bullet => bullet.y + bullet.size > 0);

    }

    // Remove off-screen obstacles
    obstacles = obstacles.filter(obs => obs.y < canvas.height);




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

    // Draw bullets
    ctx.fillStyle = '#ff0';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    }

    // Нарисовать таймер и destroyed в левом верхнем углу
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${timeSurvived}s`, 10, 60);
    ctx.fillText(`Destroyed: ${meteorsDestroyed}`, 10, 90);

    if (gameOver) {
        // Game over и best надписи в центре
        ctx.fillStyle = '#fff';
        ctx.font = '40px sans-serif';
        ctx.fillText('Game Over', 100, 250);

        ctx.font = '20px sans-serif';
        ctx.fillText(`Your time: ${timeSurvived}s`, 120, 300);

        if (timeSurvived >= bestResult) {
            ctx.fillText(`Best result!`, 140, 330);
        } else {
            ctx.fillText(`Best: ${bestResult}s`, 140, 330);
        }

        ctx.fillText(`Destroyed: ${meteorsDestroyed}`, 120, 360);

        if (meteorsDestroyed >= bestDestroyed) {
            ctx.fillText(`Record destroyed!`, 130, 390);
        } else {
            ctx.fillText(`Best destroyed: ${bestDestroyed}`, 130, 390);
        }
    }
}


function restartGame() {
    player = { x: 200, y: 450, size: 30, speed: 5 };
    obstacles = [];
    bullets = [];
    gameOver = false;
    timeSurvived = 0;
    meteorsDestroyed = 0;


    // Запускаем таймер заново
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameOver) {
            timeSurvived++;
        }
    }, 1000);

    gameLoop();
}

//code for timer
timerInterval = setInterval(() => {
    if (!gameOver) {
        timeSurvived++;
    }
}, 1000);


function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

let keys = {};

document.addEventListener('keydown', e => {
    keys[e.key] = true;
});
document.addEventListener('keyup', e => {
    keys[e.key] = false;
});


// Spawn new obstacles every second
setInterval(() => {
    if (!gameOver) spawnObstacle();
}, 1000);

document.addEventListener('keydown', e => {
    keys[e.key] = true;

    if (e.key === ' ') {
    if (!gameOver) {
        // Стреляем
        bullets.push({ x: player.x + player.size/2 - 2, y: player.y, size: 5, speed: 7 });
    } else {
        // game restart
        restartGame();
    }
}

});


gameLoop();
