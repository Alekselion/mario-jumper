const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const floor = canvas.height - 115; // земля находится выше края canvas

// параметры объектов
const commonSize = 60; // размер игрока и врагов
let enemies = []; // массив врагов

// анимация ходьбы персонажа и врагов
const playerImagesPath = 'imgs/mario-move' // папка с фреймами персонажа
const enemyImagesPath = 'imgs/enemy-move' // папка с фреймами врага
let moveImg = '/run1.png';

// обновление анимации ходьбы каждые 150 мс
setInterval(runAnimation, 150)
function runAnimation() {
    if (moveImg === '/run1.png') {
        moveImg = '/run2.png'
    } else {
        moveImg = '/run1.png'
    }
}

// флаги игры
let isStarted = false; // игра не запущена, отображается инструкция
let isPaused = false; // игра на паузе

// счетчики комбинаций
let currentCombo = 0;
let maxCombo = 0;

// изображение с инструкцией
const startBackground = new Image();
startBackground.src = 'imgs/back-start.png'

// музыка в игре
const audioJump = new Audio('audio/jump.mp3');
const audioKill = new Audio('audio/kill.mp3');
const audioPause = new Audio('audio/pause.mp3');
const audioGameOver = new Audio('audio/gameover.mp3');
const audioMain = new Audio('audio/main.mp3');
audioMain.loop = true;

// флаги нажатия клавиш движения
let clickLeft = false;
let clickRight = false;
let clickUp = false;

// функция завершения игры
function gameOver() {
    isStarted = false;
    audioMain.pause();
    audioGameOver.play();
    alert(`Game Over!`);
    currentCombo = 0;
    maxCombo = 0;
    document.location.reload();
}

// обработчик событий нажатия кнопок
document.addEventListener('keydown', (e) => {
    // space (начать игру)
    if (e.code === 'Space' && !isStarted) {
        isStarted = true;

    // esc (выйти из игры)
    } else if (e.code === 'Escape' && isStarted) {
        if (confirm("Exit?")) gameOver();

    // p (пауза)
    } else if (e.code === 'KeyP' && isStarted) {
        isPaused = !isPaused;
        audioMain.pause();
        audioPause.play();
    }

    // left (бег влево)
    if (e.code === 'ArrowLeft') {
        clickLeft = true;

    // right (бег вправо)
    } else if (e.code === 'ArrowRight') {
        clickRight = true;

    // up (прыжок)
    } else if (e.code === 'ArrowUp') {
        clickUp = true;
    }
});

// обработчик событий отжатия кнопок
document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') {
        clickLeft = false;
    } else if (e.code === 'ArrowRight') {
        clickRight = false;
    } else if (e.code === 'ArrowUp') {
        clickUp = false;
    }
});

class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    // отрисовка границ объектов
    draw() {
        // ctx.fillStyle = this.color;
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        // ctx.strokeStyle = "white";
        // ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Platform extends GameObject {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
    }
}

class Player extends GameObject {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
        this.speed = 5;
        this.gravity = 0;
        this.inAir = true;

        this.durationRight = true; // направление движения для отрисовки
        this.img = new Image();
        this.img.src = playerImagesPath + '/jump.png';
    }

    draw() {
        if (this.durationRight) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.img, 0, 0, -this.width, this.height);
            ctx.restore();
        }
    }

    stopJumping() {
        this.gravity = 0;
        this.inAir = false;
        currentCombo = 0;
        this.img.src = playerImagesPath + moveImg;
    }

    update(platforms) {
        // движение влево до границы экрана
        if (clickLeft && this.x > 0) {
            this.x -= this.speed;
            this.durationRight = false;
            if (this.inAir) {
                this.img.src = playerImagesPath + '/jump.png';
            } else {
                this.img.src = playerImagesPath + moveImg;
            }
        }

        // движение вправо до границы экрана
        if (clickRight && this.x + this.width < canvas.width) {
            this.x += this.speed;
            this.durationRight = true;
            if (this.inAir) {
                this.img.src = playerImagesPath + '/jump.png';
            } else {
                this.img.src = playerImagesPath + moveImg;
            }
        }

        // прыжок
        if (clickUp && !this.inAir) {
            this.gravity = -14; // сила прыжка
            this.img.src = playerImagesPath + '/jump.png';
            audioJump.play();
        }

        // гравитация (вечное падение)
        this.gravity += 0.6;
        this.y += this.gravity;

        // проверка приземления
        if (this.y + this.height >= floor) {
            this.y = floor - this.height;
            this.stopJumping();
        } else {
            this.inAir = true;
        }

        // проверка приземления на какую-либо платформу
        for (let platform of platforms) {
            if (
                this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y + this.height - this.gravity <= platform.y
            ) {
                this.y = platform.y - this.height;
                this.stopJumping();
            }
        }

        // персонаж стоит на месте
        if (!clickLeft && !clickRight && !this.inAir) {
            this.img.src = playerImagesPath + '/stand.png';
        }
    }
}

class Enemy extends GameObject {
    constructor(x, y, width, height, color, speed) {
        super(x, y, width, height, color);
        this.speed = speed;
        this.isDead = false;
        this.img = new Image();
        this.img.src = enemyImagesPath + moveImg;
    }

    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }


    update(player) {
        this.img.src = enemyImagesPath + moveImg; // анимация ходьбы врага
        this.x += this.speed;
        if (this.x + this.width > canvas.width || this.x < 0) {
            this.speed *= -1; // разворот
        }

        // проверка соприкосновения с игроком
        if (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y + player.height > this.y
          ) {
            // если игрок стоит на земле и его коснулся враг, конец игры
            if (player.y + player.height >= floor - player.height / 2) {
                gameOver();
            } else {
                currentCombo += 1;
                player.gravity = -11; // персонаж отскакивает
                audioKill.play();
                this.isDead = true;
            }
        }
    }
}

// создание платформ
const platforms = [
    new Platform(0, floor - 150, 300, 150, '#474747'), // крепость 1 этаж
    new Platform(0, floor - 300, 190, 150, '#474747'), // крепость 2 этаж
    new Platform(canvas.width - 100, floor - 280, 100, 155, '#474747'), // труба вертикальная
    new Platform(canvas.width - 250, floor - 125, 250, 125, '#474747'), // труба горизонтальная
];

// создание игрока
const player = new Player(canvas.width / 2 - 25, floor / 2, commonSize, commonSize, '#0b8600');

// функция создания врага
function spawnEnemy() {
    if (enemies.length >= 80) return; // максимальное кол-во врагов
    const x = Math.random() < 0.5 ? 0 : canvas.width - commonSize; // появление справа или слева
    const speed = x === 0 ? 3 : -3; // скорость врага
    const enemy = new Enemy(x, floor - commonSize, commonSize, commonSize, 'red', speed)
    enemies.push(enemy);
}

// каждые 150 мс появляется враг
setInterval(spawnEnemy, 450);

function runGame() {
    // игра на паузе
    if (isPaused) {
        ctx.fillStyle = 'white';
        ctx.font = '60px Arial';
        ctx.fillText('Paused', canvas.width / 2 - 90, canvas.height / 2);
    } else {
        audioMain.play(); // главная музыка игры
        player.update(platforms); // обновление персонажа
    }

    // platforms.forEach(platform => platform.draw()); // отрисовка границ платформ
    player.draw(); // отрисовка персонажа

    enemies.forEach(enemy => {
        // убираем убитых врагов из массива
        if (enemy.isDead) {
            enemies.splice(enemies.indexOf(enemy), 1);
            delete enemy;
        }
        if (!isPaused) enemy.update(player); // обновление, если игра не на паузе
        enemy.draw(); // отрисовка
    });

    // отображение combo
    ctx.font = '35px Arial';
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'black';
    ctx.fillText(`Combo: ${currentCombo}`, 10, 40);
    ctx.strokeText(`Combo: ${currentCombo}`, 10, 40);
    ctx.fillText(`Max combo: ${maxCombo}`, 10, 80);
    ctx.strokeText(`Max combo: ${maxCombo}`, 10, 80);

    // обновление max combo
    if (currentCombo > maxCombo) {
        maxCombo = currentCombo;
        // ctx.fillStyle = 'yellow';
        // ctx.font = '30px Arial';
        // ctx.fillText('New Max Combo!', canvas.width / 2 - 100, 50);
    }
}

// цикл игры
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, floor); // очищаем canvas

    if (isStarted) {
        runGame(); // запуск игры
    } else {
        ctx.drawImage(startBackground, 0, 0, canvas.width, canvas.height) // инструкция к игре
    }

    requestAnimationFrame(gameLoop);
}

// запуск игрового цикла
gameLoop();