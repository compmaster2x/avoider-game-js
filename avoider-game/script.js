const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: 200, y: 450, size: 30, speed: 5 };
let obstacles = [];
let bullets = [];
let coins = [];
let gemDrops = [];
let powerUps = [];
let shieldEndTime = 0;
const meteorImgs = [
    new Image(),
    new Image(),
    new Image()
];
const enemyImgs = [
    new Image(),
    new Image(),
    new Image()
];
enemyImgs[0].src = 'img/enemy1.png';
enemyImgs[1].src = 'img/enemy2.png';
enemyImgs[2].src = 'img/enemy3.png';
meteorImgs[0].src = 'img/meteor1.png';
meteorImgs[1].src = 'img/meteor2.png';
meteorImgs[2].src = 'img/meteor3.png';
// Фоновая музыка
const bgMusic = new Audio('sounds/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // громкость от 0 до 1

// Звуки
const shootSound = new Audio('sounds/shoot.mp3');
const explosionSound = new Audio('sounds/explosion.wav');



let gameOver = false;
let timeSurvived = 0;
let meteorsDestroyed = 0;
let health = 3;
let gems = parseInt(localStorage.getItem('gems')) || 0;
let oreHue = 0;
let shieldActive = false;
let shieldTimer = null;
let doubleGunActive = false;
let doubleGunEndTime = 0;
let doubleGunTimer = null;
let lastShotTime = 0;
let shotDelay = 200; // задержка между выстрелами в миллисекундах (200мс = 0.2 секунды)
const playerImg = new Image();
playerImg.src = 'img/player.png';
let paused = false;
let pausedShieldRemaining = null;
let pausedGunRemaining = null;
let pauseStartTime = null;
let lastObstacleSpawn = Date.now();
let lastCoinSpawn = Date.now();
let lastPowerUpSpawn = Date.now();
let nextPowerUpDelay = 10000 + Math.random() * 5000;
let bestResult = localStorage.getItem('bestResult') || 0;
let bestDestroyed = localStorage.getItem('bestDestroyed') || 0;
let wallet = parseInt(localStorage.getItem('wallet')) || 0;
let timerInterval;
let musicStarted = false;
let enemies = [];
let enemyBullets = [];

// Функции спавна
function spawnObstacle() {
    const size = 20 + Math.random() * 40;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 3;
    const hasOre = Math.random() < 0.05;
    const imgIndex = Math.floor(Math.random() * meteorImgs.length);
    const img = meteorImgs[imgIndex];
    obstacles.push({ x, y, size, speed, hasOre, img });
}


function spawnPowerUp() {
    const size = 20;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2;
    const types = ['heart', 'shield', 'gun']; // добавляем 'gun'

    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({ x, y, size, speed, type });
}

function spawnCoin() {
    const size = 20;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speed = 2 + Math.random() * 2;
    coins.push({ x, y, size, speed });
}

function spawnEnemy() {
    const size = 40;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    const speedX = 1 + Math.random() * 1.5;
    const direction = Math.random() < 0.5 ? 1 : -1;
    const img = enemyImgs[Math.floor(Math.random() * enemyImgs.length)];
    enemies.push({
        x,
        y,
        size,
        speedX,
        direction,
        img,
        lastShotTime: Date.now(),
        arrived: false,
        health: 3,
        isHit: false,            // новый флаг
    lastHitTime: 0
    });
}



// Игровое обновление
function update() {
    if (gameOver || paused) return;


    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.size) player.x += player.speed;

    oreHue = (oreHue + 1) % 360;

    let now = Date.now();

if (now - lastObstacleSpawn > 1000) { // 1 секунда
    spawnObstacle();
    lastObstacleSpawn = now;
}

if (now - lastCoinSpawn > 2000) { // 2 секунды
    spawnCoin();
    lastCoinSpawn = now;
}

    let now1 = Date.now();

if (now1 - lastPowerUpSpawn > nextPowerUpDelay) {
    spawnPowerUp();
    lastPowerUpSpawn = now1;
    nextPowerUpDelay = 10000 + Math.random() * 5000;
}

    // Движение усилений
    powerUps.forEach(pu => pu.y += pu.speed);

    // Сбор усилений
    powerUps = powerUps.filter(pu => {
        if (
            pu.x < player.x + player.size &&
            pu.x + pu.size > player.x &&
            pu.y < player.y + player.size &&
            pu.y + pu.size > player.y
        ) {
            if (pu.type === 'heart' && health < 3) health++;
            if (pu.type === 'shield') {
                shieldActive = true;
shieldEndTime = Date.now() + 15000;
if (shieldTimer) clearTimeout(shieldTimer);
shieldTimer = setTimeout(() => { shieldActive = false; }, 15000);

            } else if (pu.type === 'gun') {
    doubleGunActive = true;
    doubleGunEndTime = Date.now() + 15000;
    if (doubleGunTimer) clearTimeout(doubleGunTimer);
    doubleGunTimer = setTimeout(() => { doubleGunActive = false; }, 15000);
}
            return false; // удалить из массива
        }
        return pu.y < canvas.height;
    });

    // Движение метеоров
    obstacles.forEach(obs => obs.y += obs.speed);

    // Проверка столкновения с метеорами
    obstacles = obstacles.filter(obs => {
        if (
            obs.x < player.x + player.size &&
            obs.x + obs.size > player.x &&
            obs.y < player.y + player.size &&
            obs.y + obs.size > player.y
        ) {
            if (!shieldActive) {
                health--;
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
            return false;
        }
        return obs.y < canvas.height;
    });

    // Движение алмазов
    gemDrops.forEach(gem => gem.y += gem.speed);
    gemDrops = gemDrops.filter(gem => {
        if (
            gem.x < player.x + player.size &&
            gem.x + gem.size > player.x &&
            gem.y < player.y + player.size &&
            gem.y + gem.size > player.y
        ) {
            gems++;
            localStorage.setItem('gems', gems);
            return false;
        }
        return gem.y < canvas.height;
    });

    // Движение врагов
enemies.forEach(enemy => {
    if (!enemy.arrived) {
        // пока не достиг нужной высоты – опускаем вниз
        enemy.y += 1; // скорость появления, можешь поменять
        if (enemy.y >= 20) {
            enemy.arrived = true; // достиг нужной высоты
        }
    } else {
        // движение влево-вправо
        enemy.x += enemy.speedX * enemy.direction;

        // смена направления у краёв
        if (enemy.x <= 0 || enemy.x + enemy.size >= canvas.width) {
            enemy.direction *= -1;
        }

        // стрельба раз в 3 секунды
        if (Date.now() - enemy.lastShotTime > 3000) {
            enemy.lastShotTime = Date.now();
            enemyBullets.push({
                x: enemy.x + enemy.size/2 - 2,
                y: enemy.y + enemy.size,
                size: 5,
                speed: 4
            });
        }
    }
});

    
    enemyBullets.forEach(bullet => bullet.y += bullet.speed);
    enemyBullets = enemyBullets.filter(bullet => bullet.y < canvas.height);

    enemyBullets = enemyBullets.filter(bullet => {
    if (
        bullet.x < player.x + player.size &&
        bullet.x + bullet.size > player.x &&
        bullet.y < player.y + player.size &&
        bullet.y + bullet.size > player.y
    ) {
        if (!shieldActive) {
            health--;
            if (health <= 0) gameOver = true;
        }
        return false;
    }
    return true;
});


    // Движение пуль
    bullets.forEach(bullet => bullet.y -= bullet.speed);
    bullets = bullets.filter(bullet => bullet.y + bullet.size > 0);

    // Проверка попадания пуль в метеоры
    bullets = bullets.filter(bullet => {
        for (let obs of obstacles) {
            if (
                bullet.x < obs.x + obs.size &&
                bullet.x + bullet.size > obs.x &&
                bullet.y < obs.y + obs.size &&
                bullet.y + bullet.size > obs.y
            ) {
                if (obs.hasOre) {
                    gemDrops.push({ x: obs.x + obs.size/2 - 10, y: obs.y, size: 20, speed: obs.speed });
                }
                obstacles.splice(obstacles.indexOf(obs), 1);
                meteorsDestroyed++;
                explosionSound.currentTime = 0;
                explosionSound.play();
                return false;
            }
        }
        return true;
    });

    bullets = bullets.filter(bullet => {
    let hit = false;

    // Проверяем столкновение с метеорами (у тебя уже есть)
    for (let obs of obstacles) {
        if (
            bullet.x < obs.x + obs.size &&
            bullet.x + bullet.size > obs.x &&
            bullet.y < obs.y + obs.size &&
            bullet.y + bullet.size > obs.y
        ) {
            if (obs.hasOre) {
                gemDrops.push({ x: obs.x + obs.size/2 - 10, y: obs.y, size: 20, speed: obs.speed });
            }
            obstacles.splice(obstacles.indexOf(obs), 1);
            meteorsDestroyed++;
            hit = true;
            break;
        }
    }

    // Проверяем столкновение с врагами
    for (let enemy of enemies) {
        if (
            bullet.x < enemy.x + enemy.size &&
            bullet.x + bullet.size > enemy.x &&
            bullet.y < enemy.y + enemy.size &&
            bullet.y + bullet.size > enemy.y
        ) {
            enemy.health--;
            if (enemy.health <= 0) {
                enemies.splice(enemies.indexOf(enemy), 1);
            }

            enemy.isHit = true;
enemy.lastHitTime = Date.now();

            hit = true;
            break;
        }
    }

    return !hit; // если пуля попала, удаляем её
});


    // Движение монет
    coins.forEach(coin => coin.y += coin.speed);
    coins = coins.filter(coin => {
        if (
            coin.x < player.x + player.size &&
            coin.x + coin.size > player.x &&
            coin.y < player.y + player.size &&
            coin.y + coin.size > player.y
        ) {
            wallet += Math.floor(1 + Math.random() * 5);
            localStorage.setItem('wallet', wallet);
            return false;
        }
        return coin.y < canvas.height;
    });
}

// Отрисовка
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Игрок
    ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);

    if (shieldActive) {
    let remaining = (shieldEndTime - Date.now()) / 1000;
    let alpha = 0.3;

    if (remaining <= 5) {
        // Мигаем: синус даёт значение от 0 до 1
        alpha = 0.3 + 0.2 * Math.abs(Math.sin(Date.now() / 200)); 
    }

    ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size, 0, Math.PI * 2);
    ctx.fill();
}

let activePowerUps = [];

if (shieldActive) {
    let remaining = Math.max(0, ((shieldEndTime - Date.now()) / 1000).toFixed(1));
    activePowerUps.push({ icon: '🛡️', time: remaining, color: '#0ff' });
}

if (doubleGunActive) {
    let remaining = Math.max(0, ((doubleGunEndTime - Date.now()) / 1000).toFixed(1));
    activePowerUps.push({ icon: '🔫', time: remaining, color: '#ff0' });
}

// Рисуем их динамически
ctx.font = '20px sans-serif';
activePowerUps.forEach((pu, index) => {
    ctx.fillStyle = pu.color;
    let y = 60 + index * 30; // первый на y=40, второй на y=70 и т.д.
    ctx.fillText(`${pu.icon}: ${pu.time}s`, canvas.width - 100, y);
});

// Враги
enemies.forEach(enemy => {
    if (enemy.isHit && Date.now() - enemy.lastHitTime < 100) {
        // рисуем с красным оттенком
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    } else {
        // обычный рисунок
        ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.size, enemy.size);
    }
});


// Вражеские пули
ctx.fillStyle = 'red';
enemyBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size));




    // Метеоры
   obstacles.forEach(obs => {
    ctx.drawImage(obs.img, obs.x, obs.y, obs.size, obs.size);

    if (obs.hasOre) {
        // Цветное свечение вокруг
        ctx.fillStyle = `hsla(${oreHue}, 100%, 50%, 0.3)`;
        ctx.beginPath();
        ctx.arc(
            obs.x + obs.size/2,
            obs.y + obs.size/2,
            obs.size/1.5, // радиус чуть больше
            0, Math.PI * 2
        );
        ctx.fill();
    }
});

    // Усиления
    ctx.font = '20px sans-serif';
    powerUps.forEach(pu => {
        if (pu.type === 'heart') ctx.fillText('❤️', pu.x, pu.y + pu.size);
        else if (pu.type === 'shield') ctx.fillText('🛡️', pu.x, pu.y + pu.size);
        else if (pu.type === 'gun') {
    ctx.fillText('🔫', pu.x, pu.y + pu.size);
}

        

    });

    // Пули
    ctx.fillStyle = '#ff0';
    bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size));

    // Монеты
    ctx.fillStyle = 'gold';
    coins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x + coin.size/2, coin.y + coin.size/2, coin.size/2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Алмазы
    ctx.fillStyle = 'cyan';
    gemDrops.forEach(gem => {
        ctx.beginPath();
        ctx.moveTo(gem.x + gem.size/2, gem.y);
        ctx.lineTo(gem.x + gem.size, gem.y + gem.size/2);
        ctx.lineTo(gem.x + gem.size/2, gem.y + gem.size);
        ctx.lineTo(gem.x, gem.y + gem.size/2);
        ctx.closePath();
        ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${timeSurvived}s`, 10, 20);
    ctx.fillText(`Destroyed: ${meteorsDestroyed}`, 10, 50);
    ctx.fillText(`$: ${wallet}`, 10, 80);
    ctx.fillText(`💎: ${gems}`, 10, 110);

    ctx.font = '24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4dffedff';
    for (let i = 0; i < health; i++) {
        ctx.fillText('❤️', canvas.width - 10 - i * 30, 30);
    }
    ctx.textAlign = 'left';

    if (gameOver) {
        ctx.font = '40px sans-serif';
        ctx.fillText('Game Over', 100, 250);
        ctx.font = '20px sans-serif';
        ctx.fillText(`Your time: ${timeSurvived}s`, 120, 300);
        if (timeSurvived >= bestResult) ctx.fillText(`Best result!`, 140, 330);
        else ctx.fillText(`Best: ${bestResult}s`, 140, 330);
        ctx.fillText(`Destroyed: ${meteorsDestroyed}`, 120, 360);
        if (meteorsDestroyed >= bestDestroyed) ctx.fillText(`Record destroyed!`, 130, 390);
        else ctx.fillText(`Best destroyed: ${bestDestroyed}`, 130, 390);
    }

    if (paused && !gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; // полупрозрачный фон
    ctx.fillRect(0, canvas.height/2 - 50, canvas.width, 100);

    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Пауза', canvas.width/2, canvas.height/2 + 10);
    ctx.textAlign = 'left';
}

}

// Перезапуск
function restartGame() {
    player = { x: 200, y: 450, size: 30, speed: 5 };
    obstacles = [];
    bullets = [];
    coins = [];
    gemDrops = [];
    powerUps = [];
    timeSurvived = 0;
    meteorsDestroyed = 0;
    health = 3;
    gameOver = false;
    bgMusic.currentTime = 0;
bgMusic.play();
musicStarted = true;


    clearInterval(timerInterval);
    timerInterval = setInterval(() => { if (!gameOver) timeSurvived++; }, 1000);

    gameLoop();
}

// Игровой цикл
function gameLoop() {
    update();
    draw();
    if (!gameOver && !paused) requestAnimationFrame(gameLoop);

}

// Управление
let keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!musicStarted) {
    bgMusic.play();
    musicStarted = true;
}
    if (e.key === 'p' || e.key === 'P') {
    if (!gameOver) {
        paused = !paused;
        if (paused) {
            // Входим в паузу
            pauseStartTime = Date.now();
            if (shieldActive) pausedShieldRemaining = shieldEndTime - Date.now();
            if (doubleGunActive) pausedGunRemaining = doubleGunEndTime - Date.now();

            // Очищаем старые таймеры
            if (shieldTimer) clearTimeout(shieldTimer);
            if (doubleGunTimer) clearTimeout(doubleGunTimer);

        } else {
            // Выходим из паузы
            const pauseDuration = Date.now() - pauseStartTime;

            if (shieldActive && pausedShieldRemaining > 0) {
                shieldEndTime = Date.now() + pausedShieldRemaining;
                shieldTimer = setTimeout(() => { shieldActive = false; }, pausedShieldRemaining);
            }

            if (doubleGunActive && pausedGunRemaining > 0) {
                doubleGunEndTime = Date.now() + pausedGunRemaining;
                doubleGunTimer = setTimeout(() => { doubleGunActive = false; }, pausedGunRemaining);
            }

            gameLoop(); // продолжаем цикл
        }
    }
}


    if (e.key === ' ') {
        if (!gameOver) {
            let now = Date.now();
            if (now - lastShotTime >= shotDelay) {
                lastShotTime = now;

                if (doubleGunActive) {
                    bullets.push(
                        { x: player.x + 5, y: player.y, size: 5, speed: 7 },
                        { x: player.x + player.size - 10, y: player.y, size: 5, speed: 7 }
                    );
                } else {
                    bullets.push({ x: player.x + player.size/2 - 2, y: player.y, size: 5, speed: 7 });
                }
                shootSound.currentTime = 0;
                shootSound.play();

            }
        } else {
            restartGame();
        }

        if (!musicStarted) {
    bgMusic.play();
    musicStarted = true;
}

    }
});

document.addEventListener('keyup', e => { keys[e.key] = false; });

// Таймер
timerInterval = setInterval(() => { if (!gameOver) timeSurvived++; }, 1000);
setInterval(() => { if (!gameOver) spawnEnemy(); }, 8000);


// Старт
gameLoop();
