/// GAME.JS
/// Daniel Orlovsky
/// Brick Breaker Clone with high score leaderboard.


'use strict';


// Clamps a number between a min and a max
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

// Colors each row of bricks will be
var rowColors = [
    'green',
    'red',
    'orange',
    'blue',
    'steelblue',
];


// Our reference to the canvas element
var canvas = document.getElementById('breakoutCanvas');

// The context to which we will draw
var ctx = canvas.getContext("2d");


/// INITIAL BALL VALUES
var ballX = paddleX + (paddleWidth / 2); //canvas.width / 2;
var ballY = paddleY - ballRadius; //canvas.height / 2;
var ballMoving = false;
var ballRadius = 9;
var ballTrail = [];
var ballTrailMax = 20;

// Initial velocity for the direction of the ball.
var dx = 1.5;
var dy = -4;

/// PADDLE VALUES
var paddleHeight = 10;
var paddleWidth = 100;
var paddleX = (canvas.width - paddleWidth) / 2;
var paddleY = canvas.height - (canvas.height / 10);
var paddleCurve = 1.5;


/// DIRECTIONAL INPUT FLAGS
var rightPressed = false;
var leftPressed = false;


/// INITAL LEVEL VALUES FOR BRICKS
var brickRowCount = 5;
var brickColumnCount = 8;
var brickWidth = 75;
var brickHeight = 20;
var brickPadding = 10;
var brickOffsetTop = 30;
var brickOffsetLeft = (canvas.width - ((brickWidth + brickPadding) * brickColumnCount)) / 2;
var bricks = [];


/// STAR FILED VALUES
var frontStarField = [];
var rearStarField = [];
const maxStars = 250;

/// TIMER REFERENCES
var gamingLoop;
var timerLoop;

/// SOUNDS
var paddleHit = '../sounds/paddleHit.wav';
var brickSmash = '../sounds/brickSmash.wav';


/// INITIAL GAME VALUES
var playerScore = 0;
var finalScore = 0;
var timer = 60;

var modalUp = false;


/// DEPRECATED
function showLoadingScreen() {
    var body = document.body;
    var html = document.documentElement;
    // Since our screens are continually changing the height of the DOM, we find the absolute highest height at the moment.
    var height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    $("#loading-screen").css({
        "height": height,
        "display": "block"
    });
};
        
// Hides the loading screen
function hideLoadingScreen() {
    $("#loading-screen").css("display", "none");
};


/// RESETS THE BRICK LAYOUT
function resetBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (var r = 0; r < brickRowCount; r++) {
            var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
            var rowColor = rowColors[r];
            bricks[c][r] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: rowColor
            };
        }
    }
}

/// ADDS OUR APPROPRIATE EVENT LISTENERS
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.getElementById("savePlayer").addEventListener("click", savePlayer, false);
document.getElementById("modalClose").addEventListener("click", modalClose, false);


/// SAVES THE PLAYERS SCORE THE THE DATABASE
function savePlayer() {
    modalUp = false;
    var playerName = document.getElementById("playerName").value.trim();
    if (playerName === '') playerName = "AAA";
    var jsonData = JSON.stringify({ playerName: playerName, playerScore: finalScore });
    showLoadingScreen();
    $.ajax({
        url: '/Home/SaveHighScore',
        data: jsonData,
        method: 'POST',
        contentType: 'application/json',
        success: function (data) {
            hideLoadingScreen();
            $("#showHighScores").html(data);
        },
        error: function () {
            hideLoadingScreen();
            alert("Error in AJAX call");
        }
    })
}

function modalClose() {
    modalUp = false;
}

/// 
$('#saveScore').on('hidden.bs.modal', function () {
    modalClose();
})


function keyDownHandler(e) {
    /// DO NOTHING IF WE ARE NOT IN THE GAME
    if (modalUp) return;

    // CHECKS FOR 'D' or RIGHT ARROW
    if (e.keyCode === 39 || e.keyCode === 68) {
        rightPressed = true;
    /// CHECKS FOR 'A' or LEFT ARROW
    } else if (e.keyCode === 37 || e.keyCode === 65) {
        leftPressed = true;
    }
    // IF THE BALL IS NOT MOVING, WE CHECK IF THE SPACEBAR IS PRESSED.  THIS SETS BALLMOVING TO TRUE AND STARTS THE TIMER
    if (!ballMoving) {
        if (e.keyCode === 32) {
            e.preventDefault();
            document.getElementById("gameover").style.display = "none";
            document.getElementById("bonusDisplay").style.display = "none";
            timerLoop = setInterval(countDown, 1000);
            ballMoving = true;
        }
    }
}

// CHECKS TO FLAG IF THE PADDLE SHOULD NO LONGER BE MOVING
function keyUpHandler(e) {
    if (modalUp) return;
    if (e.keyCode === 39 || e.keyCode === 68) {
        rightPressed = false;
    } else if (e.keyCode === 37 || e.keyCode === 65) {
        leftPressed = false;
    }

}

// TO PLAY A SOUND, WE CREATE AN AUDIO ELEMENT AND SUBSCRIBE TO THE ended EVENT, AND DESTROY THE ELEMENT AT THAT TIME
function playSound(soundPath) {
    // creates an audio element (need jquery)
    var audioElement = document.createElement("audio"); //$('<audio></audio>').src = audioFile;
    // connects the element to the source
    audioElement.src = soundPath;
    // creates an event listener that will remove the element when finished
    audioElement.addEventListener("ended", function () {
        audioElement.remove();
    }, false);
    // plays the audio
    audioElement.play();
}

/// DRAWS OUR LEVEL.  A BRICK STATUS OF 1 MEANS IT SHOULD BE DISPLAYED AND CAN BE HIT
function drawBricks() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var currBrick = bricks[c][r];
            if (currBrick.status === 1) {
                ctx.beginPath();
                ctx.rect(currBrick.x, currBrick.y, brickWidth, brickHeight);
                ctx.fillStyle = currBrick.color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

/// CHECKS IF THERE IS ONE BRICK ON THE SCREEN WITH A STATUS OF 1 - IF SO, THE GAME IS STILL IN SESSION
function checkWin() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) return false;
        }
    }
    return true;
}

/// CHECKS FOR A COLLISSION WITH ANY BRICKS ON THE SCREEN
function collisionDetection() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var b = bricks[c][r];
            if (bricks[c][r].status === 1) {
                if (ballX + ballRadius > b.x && ballX - ballRadius < b.x + brickWidth && 
                    ballY + ballRadius > b.y && ballY - ballRadius < b.y + brickHeight) {
                    dy *= -1;
                    bricks[c][r].status = 0;
                    playerScore += 10;
                    playSound(brickSmash);
                }
            }
        }
    }
    if (ballX + ballRadius > canvas.width || ballX - ballRadius <= 0) {
        dx = -dx;
        playSound(paddleHit);
    }
    if (ballY - ballRadius <= 0) {
        dy = -dy;
        playSound(paddleHit);
    }
    if (ballX + ballRadius >= paddleX && ballX - ballRadius <= paddleX + paddleWidth) {
        if ((ballY + ballRadius >= paddleY && ballY + ballRadius <= paddleY + paddleHeight) ||
            (ballY - ballRadius >= paddleY && ballY - ballRadius <= paddleY + paddleHeight)) {
            playSound(paddleHit);
            // Reverse the ball position
            dy *= -1;
            // Position the ball above the paddle so it doesn't hit it again.
            ballY = paddleY - ballRadius;
            // Check if we should bend the ball
            if (dx < 0) {
                if (rightPressed) {
                    dx -= paddleCurve;
                } else if (leftPressed) {
                    dx += paddleCurve;
                }
            } else if (dx > 0) {
                if (rightPressed) {
                    dx -= paddleCurve;
                } else if (leftPressed) {
                    dx += paddleCurve;
                }
            }
            // Speed the ball up.
            dx = dx < 0 ? dx - 0.25 : dx + 0.25;
            dy = dy < 0 ? dy - 0.25 : dy + 0.25;
        }
    }
}

/// SIMPLY DRAWS A PIXEL FOR THE STAR FIELD
function drawPixel(x, y, color, size=1) {
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

/// DRAWS A LARGER CIRCLE FOR THE BALL TRACER
function drawTracerTrail(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

/// DRAWS THE TRAIL THAT FOLLOWS THE BALL
function drawBallTrail() {
    // COLORS INCREMENTALLY GET LIGHTER
    var colors = [
        '#7D6608',
        '#B7950B',
        '#F1C40F',
        '#F7DC6F',
        '#FCF3CF',
    ];
    for (var i = 0; i < ballTrail.length; i++) {
        drawTracerTrail(ballTrail[i].x, ballTrail[i].y, colors[i / 4]);
    }
}

/// DRAWS OUR BALL
function drawBall() {
    drawBallTrail();
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
    
}

/// UPDATES TIMER and SCORE
function updateHUD() {
    document.getElementById("bonusTimer").innerHTML = timer;
    document.getElementById("score").innerHTML = playerScore;
}

/// DRAWS OUR PADDLE
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
}

/// HANDLES MOVING THE PADDLE BASED ON INPUT
function handleInput() {
    if (rightPressed) {
        paddleX += 8;
    } else if (leftPressed) {
        paddleX -= 8;
    }
    paddleX = clamp(paddleX, 0, canvas.width - paddleWidth);
}

// THESE VALUES ARE FOR THE requestAnimationFrame feature of the HTML5 canvas
// Allows for smoother and more consistent gameplay.
let maxFPS = 60;
let lastFrameTimeMs = 0;
let timeStep = 1000 / 60;

// Draws everything on the screen
function drawAssets() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfrontStarField();
    drawBall();
    drawBricks();
    drawPaddle();
}

/// THE MAIN GAME LOOP
// WE:
// CHECK FOR INPUT
// UPDATE THE Heads Up Display
// Update the background
// See if we've won on the last time the loop iterated (HANDLE)
// Check for boundary collisions
// Draw Assets
function gameLoop(timestamp) {
    
    handleInput();
    updateHUD();
    updatefrontStarField();
    if (!checkWin()) {
        if (ballMoving) {
            collisionDetection();
            ballTrail.push({ x: ballX , y: ballY });
            if (ballTrail.length > ballTrailMax) {
                ballTrail.shift();
            }
            ballX += dx;
            ballY += dy;
        } else {
            ballX = paddleX + (paddleWidth / 2);
            ballY = paddleY - ballRadius;
        }

        if (ballY + ballRadius > canvas.height) {
            modalUp = true;
            rightPressed = false;
            leftPressed = false;
            finalScore = playerScore;
            document.getElementById('scoreDisplay').innerHTML = playerScore;
            $("#saveScore").modal();
            playerScore = 0;
            clearInterval(timerLoop);
            clearInterval(gamingLoop);
            resetGame();
            return;
        }
        requestAnimationFrame(drawAssets);
    } else {
        // game won!
        clearInterval(gamingLoop);
        //cancelAnimationFrame(gameLoop);
        if (timer > 0) {
            var bonus = timer * 2;
            var bonusDisplay = document.getElementById("bonusDisplay");
            bonusDisplay.style.display = "block";
            bonusDisplay.innerHTML = `Player Bonus: ${bonus}`;
            playerScore += bonus;
            updateHUD();
            clearInterval(timerLoop);
        }
        
        resetGame();
    }

}

/// Our bonus countdown timer
function countDown() {
    timer--;
    if (timer <= 0) {
        clearInterval(timerLoop);
    }
}

// Gets scores for the leaderboard
function getScores(callback) {
    $.ajax({
        url: 'Home/GetScores',
        method: "GET",
        success: function (data) {
            
        },
    })
}


/// Initializes the start fields with values
function initfrontStarField() {
    frontStarField = [];
    rearStarField = [];
    for (var i = 0; i < maxStars; i++) {
        var x = Math.floor(Math.random() * canvas.width);
        var y = Math.floor(Math.random() * canvas.height);
        frontStarField.push({ x: x, y: y });
    }
    for (var i = 0; i < maxStars; i++) {
        var x = Math.floor(Math.random() * canvas.width);
        var y = Math.floor(Math.random() * canvas.height);
        rearStarField.push({ x: x, y: y });
    }

}

// Updates the front and rear starfield (these stars travel faster) - need to change the name
function updatefrontStarField() {
    for (var i = 0; i < frontStarField.length; i++) {
        frontStarField[i].y += 2;
        rearStarField[i].y++;
        if (frontStarField[i].y >= canvas.height) {
            frontStarField[i].y = 0;
            frontStarField[i].x = Math.floor(Math.random() * canvas.width);
        }
        if (rearStarField[i].y >= canvas.height) {
            rearStarField[i].y = 0;
            rearStarField[i].x = Math.floor(Math.random() * canvas.width);
        }
    }
}


// Draws the star field
function drawfrontStarField() {
    for (var i = 0; i < frontStarField.length; i++) {
        drawPixel(frontStarField[i].x, frontStarField[i].y, "white");
        drawPixel(rearStarField[i].x, rearStarField[i].y, "gray");
    }
}

/// RESETS DEFAULT VALUES
function resetGame() {
    showLoadingScreen();
    ballMoving = false;
    dx = 1.5;
    dy = -2;
    timer = 60;
    ballTrail = [];
    ballX = paddleX + (paddleWidth / 2); //canvas.width / 2;
    ballY = paddleY - ballRadius; //canvas.height / 2; 
    resetBricks();
    initfrontStarField();
    hideLoadingScreen();
    requestAnimationFrame(drawAssets);
    gamingLoop = setInterval(gameLoop, 10);
    
}