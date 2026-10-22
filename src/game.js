// Core 3D Game Engine Loop with Photorealistic Assets, Cinematic Constriction Camera, and Level Progression
class AnacondaGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('game-canvas');
    this.clock = new THREE.Clock();
    this.isPaused = false;
    this.isGameOver = false;
    this.isThermalActive = false;
    this.cameraMode = 0;
    this.currentLevel = 1;
    this.cinematicCamAngle = 0;

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false
    };

    // 1. Initialize Renderer & Scene
    this.initThree();

    // 2. Preload Photorealistic Production Texture Pipeline
    this.assets = new GameAssets();
    this.assets.loadAll(
      (progress) => {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.textContent = `LOADING HD ASSETS (${Math.round(progress * 100)}%)...`;
      },
      () => {
        this.onAssetsReady();
      }
    );
  }

  onAssetsReady() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.textContent = "ENTER THE AMAZON";
      startBtn.disabled = false;
    }

    // Subsystems initialized with photographic PBR assets
    this.audio = new AudioManager();
    this.world = new AmazonWorld(this.scene, this.assets);
    this.snake = new AnacondaSnake(this.scene, this.assets);
    this.fauna = new FaunaManager(this.scene, this.world, this.assets);
    this.radar = new RadarHUD('radar-canvas');

    this.initInputs();
    this.initUI();
    this.initMobileControls();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1c12);

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 10, 15);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.isGameOver || !this.snake) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'Space':
          this.snake.triggerStrike();
          this.audio.playStrike();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.boost = true;
          break;
        case 'KeyT':
          this.toggleThermal();
          break;
        case 'KeyC':
          this.cycleCamera();
          break;
        case 'KeyM':
          const muted = this.audio.toggleMute();
          this.showToast(muted ? "Audio Muted" : "Audio Active");
          break;
        case 'KeyP':
          this.togglePause();
          break;
        case 'Digit1':
          this.switchLevel(1);
          break;
        case 'Digit2':
          this.switchLevel(2);
          break;
        case 'Digit3':
          this.switchLevel(3);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.boost = false;
          break;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPaused || this.isGameOver || !this.snake || this.snake.isConstricting) return;
      const midX = window.innerWidth / 2;
      const diffX = (e.clientX - midX) / midX;
      if (Math.abs(diffX) > 0.15) {
        this.input.left = diffX < 0;
        this.input.right = diffX > 0;
      } else {
        this.input.left = false;
        this.input.right = false;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.isGameOver && this.snake) {
        this.snake.triggerStrike();
        this.audio.playStrike();
      }
    });
  }

  initMobileControls() {
    const joyBase = document.getElementById('joystick-base');
    const joyThumb = document.getElementById('joystick-thumb');
    const btnStrike = document.getElementById('btn-mobile-strike');
    const btnThermal = document.getElementById('btn-mobile-thermal');

    if (!joyBase || !joyThumb) return;

    let touchId = null;
    let baseCenter = { x: 0, y: 0 };

    joyBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joyBase.getBoundingClientRect();
      baseCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, { passive: false });

    joyBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let t of e.changedTouches) {
        if (t.identifier === touchId) {
          const dx = t.clientX - baseCenter.x;
          const dy = t.clientY - baseCenter.y;
          const dist = Math.hypot(dx, dy);
          const maxR = 40;
          const clampedDist = Math.min(dist, maxR);
          const angle = Math.atan2(dy, dx);

          joyThumb.style.transform = `translate(${Math.cos(angle) * clampedDist}px, ${Math.sin(angle) * clampedDist}px)`;

          this.input.forward = dy < -10;
          this.input.backward = dy > 15;
          this.input.left = dx < -10;
          this.input.right = dx > 10;
          this.input.boost = dist > 32;
        }
      }
    }, { passive: false });

    const resetJoy = () => {
      touchId = null;
      joyThumb.style.transform = 'translate(0px, 0px)';
      this.input.forward = false;
      this.input.backward = false;
      this.input.left = false;
      this.input.right = false;
      this.input.boost = false;
    };

    joyBase.addEventListener('touchend', resetJoy);
    joyBase.addEventListener('touchcancel', resetJoy);

    if (btnStrike) {
      btnStrike.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.snake) {
          this.snake.triggerStrike();
          this.audio.playStrike();
        }
      });
    }

    if (btnThermal) {
      btnThermal.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.toggleThermal();
      });
    }
  }

  initUI() {
    const btnThermal = document.getElementById('btn-thermal');
    if (btnThermal) {
      btnThermal.addEventListener('click', () => this.toggleThermal());
    }

    const btnCam = document.getElementById('btn-camera');
    if (btnCam) {
      btnCam.addEventListener('click', () => this.cycleCamera());
    }

    const btnLevel = document.getElementById('btn-next-level');
    if (btnLevel) {
      btnLevel.addEventListener('click', () => {
        const next = (this.currentLevel % 3) + 1;
        this.switchLevel(next);
      });
    }

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        document.getElementById('start-modal').style.display = 'none';
        this.audio.init();
        this.input.forward = true;
        this.showToast("You are a juvenile Anaconda. Hunt 5 insects/frogs to grow and unlock Level 2!");
      });
    }
  }

  switchLevel(lvl) {
    if (!this.world || !this.fauna || !this.snake) return;
    this.currentLevel = lvl;
    this.world.loadLevel(lvl);
    this.fauna.spawnForLevel(lvl);

    this.snake.position.set(0, 0.4, 0);
    this.snake.heading = 0;
    this.snake.preyEatenInCurrentLevel = 0;

    const names = [
      "Level 1: The Shallows (Nursery Mudbank)",
      "Level 2: The Great Tapajós Crossing",
      "Level 3: Flooded Blackwater Forest (Boss Arena)"
    ];
    this.showToast(`ENTERING: ${names[lvl - 1]}`, "evolution");

    const lvlNameEl = document.getElementById('level-name-val');
    if (lvlNameEl) lvlNameEl.textContent = names[lvl - 1];

    const btnLevel = document.getElementById('btn-next-level');
    if (btnLevel) {
      btnLevel.style.display = (lvl < 3) ? 'inline-block' : 'none';
    }
  }

  triggerEvolutionBanner(stage) {
    const titles = [
      "Juvenile Predator",
      "Sub-Adult Evolution: Girth & Length Expanded! Level 2 Unlocked!",
      "Full Adult Anaconda: Apex Hunting Unlocked!",
      "Apex Titan Anaconda: Ancient River Monarch!"
    ];

    const overlay = document.getElementById('evolution-banner');
    if (overlay) {
      overlay.querySelector('.evolution-title').textContent = titles[stage - 1];
      overlay.style.display = 'flex';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 4500);
    }

    this.audio.playThermal(true);
    this.showToast(titles[stage - 1], "evolution");

    if (this.currentLevel === 1) {
      this.world.unlockGateway();
      this.showToast("The flooded river gateway is now open! Proceed forward to enter Level 2!");
    }
  }

  toggleThermal() {
    this.isThermalActive = !this.isThermalActive;
    const overlay = document.getElementById('thermal-overlay');
    if (overlay) overlay.classList.toggle('active', this.isThermalActive);
    
    const btn = document.getElementById('btn-thermal');
    if (btn) btn.classList.toggle('active', this.isThermalActive);

    this.audio.playThermal(this.isThermalActive);
    this.showToast(this.isThermalActive ? "Thermal Pit Vision: ACTIVE" : "Optical Vision Restored");
  }

  cycleCamera() {
    this.cameraMode = (this.cameraMode + 1) % 3;
    const names = ["Chase Cam", "Tactical Isometric", "Predator 1st-Person"];
    this.showToast(`Camera: ${names[this.cameraMode]}`);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.showToast(this.isPaused ? "Game Paused (P)" : "Resumed");
  }

  showToast(msg, type = "normal") {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type === 'boss' ? 'toast-boss' : (type === 'digestion' ? 'toast-digestion' : (type === 'evolution' ? 'toast-evolution' : ''))}`;
    toast.textContent = msg;
    panel.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  }

  updateHUD() {
    if (!this.snake) return;
    const healthFill = document.getElementById('health-fill');
    if (healthFill) healthFill.style.width = `${Math.max(0, this.snake.health)}%`;

    const staminaFill = document.getElementById('stamina-fill');
    if (staminaFill) staminaFill.style.width = `${Math.max(0, this.snake.stamina)}%`;

    const hungerFill = document.getElementById('hunger-fill');
    if (hungerFill) hungerFill.style.width = `${Math.max(0, this.snake.hunger)}%`;

    const scoreVal = document.getElementById('score-val');
    if (scoreVal) scoreVal.textContent = this.snake.score;

      const count = this.snake.numSpinePoints || this.snake.numSegments || 28;
      const dist = this.snake.spineDistance || this.snake.segmentDistance || 0.5;
      const lengthMeters = (count * dist).toFixed(1);
      lengthVal.textContent = `${lengthMeters}m`;

    const stageNames = ["Juvenile", "Sub-Adult", "Adult Predator", "Apex Titan"];
    const apexVal = document.getElementById('apex-val');
    if (apexVal) apexVal.textContent = stageNames[this.snake.growthStage - 1];

    const preyCountVal = document.getElementById('prey-count-val');
    if (preyCountVal) preyCountVal.textContent = `${this.snake.preyEaten} (Goal: 5 to evolve)`;

    const bossPanel = document.getElementById('boss-bar-panel');
    const bossFill = document.getElementById('boss-health-fill');
    if (this.fauna && this.fauna.boss && this.fauna.boss.isAlive) {
      const distToBoss = this.snake.getHeadPosition().distanceTo(this.fauna.boss.getPosition());
      if (distToBoss < 50) {
        bossPanel.style.display = 'block';
        const pct = (this.fauna.boss.health / this.fauna.boss.maxHealth) * 100;
        bossFill.style.width = `${pct}%`;
      } else {
        bossPanel.style.display = 'none';
      }
    } else {
      if (bossPanel) bossPanel.style.display = 'none';
    }

    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.classList.toggle('strike-ready', this.snake.stamina > 20);
  }

  updateCamera(delta) {
    if (!this.snake) return;
    const headPos = this.snake.getHeadPosition();
    const heading = this.snake.getHeadingAngle();

    if (this.snake.isConstricting) {
      this.cinematicCamAngle += delta * 1.8;
      const zoomDist = Math.max(3.5, this.snake.baseRadius * 6.5);
      const camPos = new THREE.Vector3(
        headPos.x + Math.sin(this.cinematicCamAngle) * zoomDist,
        headPos.y + 1.8 + Math.sin(this.cinematicCamAngle * 0.5) * 0.6,
        headPos.z + Math.cos(this.cinematicCamAngle) * zoomDist
      );
      this.camera.position.lerp(camPos, 8 * delta);
      this.camera.lookAt(headPos.x, headPos.y + 0.3, headPos.z);
      return;
    }

    const scaleFactor = Math.max(1.0, this.snake.baseRadius / 0.35);

    if (this.cameraMode === 0) {
      const camOffset = new THREE.Vector3(
        Math.sin(heading) * (8 * scaleFactor),
        4.5 * scaleFactor,
        Math.cos(heading) * (8 * scaleFactor)
      );
      const targetCamPos = headPos.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, 5.5 * delta);
      this.camera.lookAt(headPos.x, headPos.y + 0.6 * scaleFactor, headPos.z);
    } else if (this.cameraMode === 1) {
      const dist = 22 * scaleFactor;
      const targetCamPos = new THREE.Vector3(headPos.x + dist, headPos.y + dist * 1.2, headPos.z + dist);
      this.camera.position.lerp(targetCamPos, 4 * delta);
      this.camera.lookAt(headPos);
    } else if (this.cameraMode === 2) {
      const eyeOffset = new THREE.Vector3(
        -Math.sin(heading) * (0.35 * scaleFactor),
        0.35 * scaleFactor,
        -Math.cos(heading) * (0.35 * scaleFactor)
      );
      this.camera.position.copy(headPos).add(eyeOffset);
      const lookTarget = headPos.clone().add(new THREE.Vector3(
        -Math.sin(heading) * 12,
        0.1,
        -Math.cos(heading) * 12
      ));
      this.camera.lookAt(lookTarget);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.radar) this.radar.resize();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.snake || this.isPaused || this.isGameOver) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.currentLevel === 1 && this.snake.preyEaten >= 5) {
      const headPos = this.snake.getHeadPosition();
      if (headPos.z > 24 && Math.abs(headPos.x) < 7) {
        this.switchLevel(2);
      }
    }

    this.snake.update(delta, this.input, this.world);
    this.world.update(delta);
    this.fauna.update(
      delta,
      this.snake,
      this.audio,
      (killedPrey) => {
        this.showToast(`Swallowed ${killedPrey.type.toUpperCase()}! Digesting... (+${killedPrey.nutrition * 15} pts)`, "digestion");
      },
      (newStage) => {
        this.triggerEvolutionBanner(newStage);
      },
      () => {
        this.showToast("VICTORY! Prehistoric Black Caiman Defeated! You are the Apex Titan Ruler of the Amazon!", "boss");
      }
    );

    if (Math.abs(this.snake.speed) > 1.0) {
      if (this.snake.isUnderwater) {
        if (Math.random() < 0.08) this.audio.playSwim();
      } else {
        if (Math.random() < 0.06) this.audio.playSlither();
      }
    }

    if (this.snake.health <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.audio.playHurt();
      this.showToast("Game Over: Your Anaconda has starved or succumbed to injuries.", "boss");
    }

    this.updateCamera(delta);
    this.updateHUD();
    this.radar.render(this.snake, this.fauna.entities, this.fauna.boss);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new AnacondaGame();
});
