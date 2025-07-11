const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: 200, y: 450, size: 30, speed: 5 };
let obstacles = [];
let bullets = [];
let coins = [];

let gameOver = false;
let timeSurvived = 0;
let meteorsDestroyed = 0;
let health = 3;
let gems = parseInt(localStorage.getItem('gems')) || 0;
let gemDrops = []; // массив падающих алмазов
let oreHue = 0;


let bestResult = localStorage.getItem('bestResult') || 0;
let bestDestroyed = localStorage.getItem('bestDestroyed') || 0;
let wallet = parseInt(localStorage.getItem('wallet')) || 0;

let timerInterval;

function spawnObstacle() {
    const size = 20 + Math.random() * 40;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 3;

    const hasOre = Math.random() < 0.2; // 20% шанс быть с рудой (т.е. реже обычных)

    obstacles.push({ x, y, size, speed, hasOre });
}


function spawnCoin() {
    const size = 20;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 2; // чуть быстрее
    coins.push({ x, y, size, speed });
}

function update() {
    if (gameOver) return;

    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.size) {
        player.x += player.speed;
    }

    oreHue += 1;
if (oreHue > 360) oreHue = 0;


    // Двигаем метеоры
    for (let obs of obstacles) {
        obs.y += obs.speed;

        if (
    obs.x < player.x + player.size &&
    obs.x + obs.size > player.x &&
    obs.y < player.y + player.size &&
    obs.y + obs.size > player.y
) {
    obstacles.splice(obstacles.indexOf(obs), 1); // убираем метеор
    health--; // отнимаем жизнь

    if (health <= 0) {
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
}

    }

    // Двигаем алмазы
for (let gem of gemDrops) {
    gem.y += gem.speed;
}

// Проверка сбора алмазов
for (let gem of gemDrops) {
    if (
        gem.x < player.x + player.size &&
        gem.x + gem.size > player.x &&
        gem.y < player.y + player.size &&
        gem.y + gem.size > player.y
    ) {
        gemDrops.splice(gemDrops.indexOf(gem), 1);
        gems++;
        localStorage.setItem('gems', gems);
    }
}

// Удаляем алмазы, улетевшие за экран
gemDrops = gemDrops.filter(gem => gem.y < canvas.height);


    // Двигаем пули
    for (let bullet of bullets) {
        bullet.y -= bullet.speed;
    }
    bullets = bullets.filter(bullet => bullet.y + bullet.size > 0);

    // Проверка попадания пуль в метеоры
    for (let bullet of bullets) {
    for (let obs of obstacles) {
        if (
            bullet.x < obs.x + obs.size &&
            bullet.x + bullet.size > obs.x &&
            bullet.y < obs.y + obs.size &&
            bullet.y + bullet.size > obs.y
        ) {
            if (obs.hasOre) {
                // Спавним алмаз
                gemDrops.push({
                    x: obs.x + obs.size/2 - 10, 
                    y: obs.y, 
                    size: 20, 
                    speed: obs.speed 
                });
            }
            obstacles.splice(obstacles.indexOf(obs), 1);
            bullets.splice(bullets.indexOf(bullet), 1);
            meteorsDestroyed++;
            break;
        }
    }
}


    // Двигаем монеты
    for (let coin of coins) {
        coin.y += coin.speed;
    }

    // Проверка сбора монет
    for (let coin of coins) {
        if (
            coin.x < player.x + player.size &&
            coin.x + coin.size > player.x &&
            coin.y < player.y + player.size &&
            coin.y + coin.size > player.y
        ) {
            coins.splice(coins.indexOf(coin), 1);
            let income = Math.floor(1 + Math.random() * 5); // число от 1 до 5
            wallet += income;
            localStorage.setItem('wallet', wallet);
        }
    }

    // Удаляем всё, что вышло за экран
    obstacles = obstacles.filter(obs => obs.y < canvas.height);
    coins = coins.filter(coin => coin.y < canvas.height);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Obstacles
    ctx.fillStyle = '#f00';
    for (let obs of obstacles) {
    if (obs.hasOre) {
        ctx.fillStyle = `hsl(${oreHue}, 100%, 50%)`;
    } else {
        ctx.fillStyle = '#f00';
    }
    ctx.fillRect(obs.x, obs.y, obs.size, obs.size);
}



    // Bullets
    ctx.fillStyle = '#ff0';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    }

    // Coins
    ctx.fillStyle = 'gold';
    for (let coin of coins) {
        ctx.beginPath();
        ctx.arc(coin.x + coin.size/2, coin.y + coin.size/2, coin.size/2, 0, Math.PI * 2);
        ctx.fill();
    }

    // HUD
    // Сердечки
    ctx.fillText(`💎: ${gems}`, 10, 110);

ctx.font = '24px sans-serif';
ctx.textAlign = 'right'; // выравнивание справа
ctx.fillStyle = '#ff4d4d'; // чуть ярче для эмодзи

for (let i = 0; i < health; i++) {
    ctx.fillText('❤️', canvas.width - 10 - i * 30, 30);
}
ctx.textAlign = 'left'; // возвращаем в дефолт, чтобы другие надписи рисовались как раньше

    ctx.fillStyle = 'cyan';
for (let gem of gemDrops) {
    ctx.beginPath();
    ctx.moveTo(gem.x + gem.size/2, gem.y); // верх
    ctx.lineTo(gem.x + gem.size, gem.y + gem.size/2); // право
    ctx.lineTo(gem.x + gem.size/2, gem.y + gem.size); // низ
    ctx.lineTo(gem.x, gem.y + gem.size/2); // лево
    ctx.closePath();
    ctx.fill();
}


    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${timeSurvived}s`, 10, 20);
    ctx.fillText(`Destroyed: ${meteorsDestroyed}`, 10, 50);
    ctx.fillText(`$: ${wallet}`, 10, 80);

    if (gameOver) {
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
    coins = [];
    gameOver = false;
    timeSurvived = 0;
    meteorsDestroyed = 0;
    health = 3;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameOver) timeSurvived++;
    }, 1000);

    gameLoop();
}

// Таймер
timerInterval = setInterval(() => {
    if (!gameOver) timeSurvived++;
}, 1000);

// Игровой цикл
function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

// Управление
let keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') {
        if (!gameOver) {
            bullets.push({ x: player.x + player.size/2 - 2, y: player.y, size: 5, speed: 7 });
        } else {
            restartGame();
        }
    }
});
document.addEventListener('keyup', e => {
    keys[e.key] = false;
});

// Спавним метеоры и монеты
setInterval(() => { if (!gameOver) spawnObstacle(); }, 1000);
setInterval(() => { if (!gameOver) spawnCoin(); }, 2000); // чаще, раз в 2 сек

// Старт
gameLoop();
