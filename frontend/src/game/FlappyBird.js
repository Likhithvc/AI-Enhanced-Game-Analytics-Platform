/**
 * Flappy Bird Game Logic (Plain JavaScript)
 */

export class FlappyBirdGame {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});
    
    // Game state
    this.isRunning = false;
    this.gameOver = false;
    this.score = 0;
    this.highScore = 0;
    
    // Bird properties
    this.bird = {
      x: 100,
      y: 200,
      width: 30,
      height: 30,
      velocity: 0,
      gravity: 0.5,
      jump: -8
    };
    
    // Pipe properties
    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpeed = 3;
    this.frameCount = 0;
    
    // Bind methods
    this.handleJump = this.handleJump.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }
  
  init() {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.reset();
    this.setupControls();
  }
  
  setupControls() {
    // Space bar and click to jump
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleJump();
      }
    });
    
    this.canvas.addEventListener('click', this.handleJump);
  }
  
  handleJump() {
    if (!this.isRunning && !this.gameOver) {
      this.start();
    } else if (this.isRunning) {
      this.bird.velocity = this.bird.jump;
      this.onEvent('jump', 'player_jump', {
        bird_y: this.bird.y,
        bird_velocity: this.bird.velocity
      });
    } else if (this.gameOver) {
      this.restart();
    }
  }
  
  start() {
    this.isRunning = true;
    this.gameLoop();
  }
  
  restart() {
    this.reset();
    this.start();
  }
  
  reset() {
    this.gameOver = false;
    this.score = 0;
    this.frameCount = 0;
    this.bird.y = 200;
    this.bird.velocity = 0;
    this.pipes = [];
  }
  
  update() {
    if (!this.isRunning || this.gameOver) return;
    
    // Update bird physics
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;
    
    // Generate pipes
    this.frameCount++;
    if (this.frameCount % 90 === 0) {
      const minHeight = 50;
      const maxHeight = this.canvas.height - this.pipeGap - minHeight;
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      
      this.pipes.push({
        x: this.canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + this.pipeGap,
        scored: false
      });
    }
    
    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      this.pipes[i].x -= this.pipeSpeed;
      
      // Remove off-screen pipes
      if (this.pipes[i].x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1);
        continue;
      }
      
      // Check collision
      if (this.checkCollision(this.pipes[i])) {
        this.endGame();
        return;
      }
      
      // Update score
      if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.bird.x) {
        this.pipes[i].scored = true;
        this.score++;
        this.onEvent('score', 'score_update', {
          score: this.score,
          pipe_passed: i
        });
      }
    }
    
    // Check boundaries
    if (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0) {
      this.endGame();
    }
  }
  
  checkCollision(pipe) {
    const birdLeft = this.bird.x;
    const birdRight = this.bird.x + this.bird.width;
    const birdTop = this.bird.y;
    const birdBottom = this.bird.y + this.bird.height;
    
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + this.pipeWidth;
    
    // Check if bird is within pipe's x range
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      // Check if bird hit top or bottom pipe
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        return true;
      }
    }
    
    return false;
  }
  
  endGame() {
    this.gameOver = true;
    this.isRunning = false;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    
    this.onEvent('collision', 'game_over', {
      final_score: this.score,
      high_score: this.highScore,
      pipes_passed: this.score
    });
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw pipes
    this.ctx.fillStyle = '#228B22';
    this.pipes.forEach(pipe => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
    });
    
    // Draw bird
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
    
    // Draw score
    this.ctx.fillStyle = '#000';
    this.ctx.font = '32px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 40);
    
    // Draw instructions
    if (!this.isRunning && !this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press SPACE or Click to Start', 200, 300);
    }
    
    // Draw game over
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '48px Arial';
      this.ctx.fillText('Game Over!', 250, 250);
      
      this.ctx.font = '32px Arial';
      this.ctx.fillText(`Score: ${this.score}`, 300, 300);
      this.ctx.fillText(`High Score: ${this.highScore}`, 250, 350);
      
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Click to Restart', 280, 400);
    }
  }
  
  gameLoop() {
    this.update();
    this.draw();
    
    if (this.isRunning) {
      requestAnimationFrame(this.gameLoop);
    }
  }
  
  destroy() {
    this.isRunning = false;
    document.removeEventListener('keydown', this.handleJump);
    this.canvas.removeEventListener('click', this.handleJump);
  }
}
