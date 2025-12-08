/**
 * Flappy Bird Game Logic (Plain JavaScript)
 */

import { SoundManager } from './SoundManager';

export class FlappyBirdGame {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
    
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
    // Set canvas size - larger and more prominent
    const maxWidth = 700;
    const maxHeight = 550;
    
    // Calculate size based on viewport with larger dimensions
    const viewportWidth = Math.min(window.innerWidth - 60, maxWidth);
    const viewportHeight = Math.min(window.innerHeight * 0.65, maxHeight);
    
    // Use aspect ratio of 1.27:1 (width:height)
    this.canvas.width = Math.min(viewportWidth, viewportHeight * 1.27);
    this.canvas.height = this.canvas.width / 1.27;
    
    this.createBirdSprite();
    this.reset();
    this.setupControls();
    
    // Play start sound
    this.soundManager.playStart();
  }

  createBirdSprite() {
    // Create a simple pixel art bird sprite
    const size = 30;
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = size;
    spriteCanvas.height = size;
    const ctx = spriteCanvas.getContext('2d');

    // Bird pixel art (yellow bird with orange beak and black eye)
    const pixels = [
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '00000000YYYYYY0000000000000000',
      '000000YYYYYYYYYYYY0000000000',
      '0000YYYYYYYYYYYYYYY000000000',
      '000YYYYYBYYYYYYYYYYY00000000',
      '00YYYYYYYYYYYYYYYYYY00000000',
      '0YYYYYYYYYYYYYYYYYYYOOO00000',
      '0YYYYYYYYYYYYYYYYYYYOOO00000',
      'YYYYYYYYYYYYYYYYYYYYYY000000',
      'YYYYYYYYYYYYYYYYYYYYYY000000',
      'YYYYYYYYYYYYYYYYYYYYYY000000',
      '0YYYYYYYYYYYYYYYYYYYYYY00000',
      '0YYYYYYYYYYYYYYYYYYYYYY00000',
      '00YYYYYYYYYYYYYYYYYYY000000',
      '000YYYYYYYYYYYYYYYYYY000000',
      '0000YYYYYYYYYYYYYY0000000000',
      '00000YYYYYYYYYYYY00000000000',
      '000000YYYYYYYYYY000000000000',
      '00000000YYYYYY00000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000',
      '000000000000000000000000000000'
    ];

    const pixelSize = 1;
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const char = pixels[y][x];
        if (char === 'Y') {
          ctx.fillStyle = '#FFD700'; // Gold yellow
        } else if (char === 'B') {
          ctx.fillStyle = '#000'; // Black eye
        } else if (char === 'O') {
          ctx.fillStyle = '#FF8C00'; // Orange beak
        } else {
          continue;
        }
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    this.birdSprite = spriteCanvas;
  }
  
  setupControls() {
    // Store bound handlers for proper cleanup
    this.keydownHandler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleJump();
      }
    };
    
    // Add event listeners
    document.addEventListener('keydown', this.keydownHandler);
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
    // Only restart if game is actually over
    if (this.gameOver) {
      this.reset();
      this.start();
      // Play start sound on restart
      this.soundManager.playStart();
    }
  }
  
  reset() {
    // Defensive: only reset if game is not actively running
    if (!this.isRunning || this.gameOver) {
      this.gameOver = false;
      this.score = 0;
      this.frameCount = 0;
      this.bird.y = 200;
      this.bird.velocity = 0;
      this.pipes = [];
    }
  }
  
  update() {
    if (!this.isRunning || this.gameOver) return;
    
    // Update bird physics
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;
    
    // Track bird position every 30 frames (~0.5 seconds at 60fps)
    if (this.frameCount % 30 === 0) {
      this.onEvent('position', 'player_position', {
        x: Math.round(this.bird.x),
        y: Math.round(this.bird.y),
        level: '1'  // Set level for heatmap tracking
      });
    }
    
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
        // Play crash sound
        this.soundManager.playCrash();
        this.endGame();
        return;
      }
      
      // Update score
      if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.bird.x) {
        this.pipes[i].scored = true;
        this.score++;
        
        // Play score sound
        this.soundManager.playScore();
        
        this.onEvent('score', 'score_update', {
          score: this.score,
          pipe_passed: i
        });
      }
    }
    
    // Check boundaries
    if (this.bird.y + this.bird.height > this.canvas.height || this.bird.y < 0) {
      // Play crash sound for boundary collision
      this.soundManager.playCrash();
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
    
    // Draw bird sprite
    if (this.birdSprite) {
      this.ctx.drawImage(this.birdSprite, this.bird.x, this.bird.y, this.bird.width, this.bird.height);
    } else {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);
    }
    
    // Draw instructions
    if (!this.isRunning && !this.gameOver) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press SPACE or Click to Start', 200, 300);
    }
    
    // Game over state is handled by React overlay - no canvas drawing needed
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
    this.gameOver = true;
    
    // Remove event listeners using stored handlers
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleJump);
    }
  }
}
