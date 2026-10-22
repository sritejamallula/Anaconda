// Core 3D Game Engine Loop and Controller for Anaconda Amazon Survival
class AnacondaGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('game-canvas');
    this.clock = new THREE.Clock();
    this.isPaused = false;
    this.isGameOver = false;
    this.isThermalActive = false;
    this.cameraMode = 0; // 0: Chase, 1: Isometric, 2: 1st-Person Predator
    
    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false
    };

    // Subsystems
    this.initThree();
    this.audio = new AudioManager();
    this.world = new AmazonWorld(this.scene);
    this.snake = new AnacondaSnake(this.scene);
    this.fauna = new FaunaManager(this.scene, this.world);
    this.radar = new RadarHUD('radar-canvas');

    this.initInputs();
    this.initUI();
    this.initMobileControls();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c2115);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 15, 20);

    // 3. Renderer
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
    this.renderer.toneMappingExposure = 1.1;
  }

  initInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (this.isGameOver) return;
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

    // Mouse Steering
    window.addEventListener('mousemove', (e) => {
      if (this.isPaused || this.isGameOver) return;
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
      if (e.button === 0 && !this.isGameOver) {
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
        this.snake.triggerStrike();
        this.audio.playStrike();
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
    // Buttons
    const btnThermal = document.getElementById('btn-thermal');
    if (btnThermal) {
      btnThermal.addEventListener('click', () => this.toggleThermal());
    }

    const btnCam = document.getElementById('btn-camera');
    if (btnCam) {
      btnCam.addEventListener('click', () => this.cycleCamera());
    }

    const btnMute = document.getElementById('btn-audio');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const m = this.audio.toggleMute();
        btnMute.classList.toggle('active', !m);
        this.showToast(m ? "Muted" : "Audio On");
      });
    }

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        document.getElementById('start-modal').style.display = 'none';
        this.audio.init();
        this.input.forward = true; // start swimming
        this.showToast("Stalk the Amazon river. Hunt prey to grow!");
      });
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
    toast.className = `toast-msg ${type === 'boss' ? 'toast-boss' : (type === 'digestion' ? 'toast-digestion' : '')}`;
    toast.textContent = msg;
    panel.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 3500);
  }

  updateHUD() {
    // Health bar
    const healthFill = document.getElementById('health-fill');
    if (healthFill) healthFill.style.width = `${Math.max(0, this.snake.health)}%`;

    // Stamina bar
    const staminaFill = document.getElementById('stamina-fill');
    if (staminaFill) staminaFill.style.width = `${Math.max(0, this.snake.stamina)}%`;

    // Hunger bar
    const hungerFill = document.getElementById('hunger-fill');
    if (hungerFill) hungerFill.style.width = `${Math.max(0, this.snake.hunger)}%`;

    // Stats
    const scoreVal = document.getElementById('score-val');
    if (scoreVal) scoreVal.textContent = this.snake.score;

    const lengthVal = document.getElementById('length-val');
    if (lengthVal) lengthVal.textContent = `${(6.5 + this.snake.growthLevel * 1.8).toFixed(1)}m`;

    const apexVal = document.getElementById('apex-val');
    if (apexVal) apexVal.textContent = `Rank ${Math.floor(this.snake.growthLevel)}`;

    // Boss Bar
    const bossPanel = document.getElementById('boss-bar-panel');
    const bossFill = document.getElementById('boss-health-fill');
    if (this.fauna.boss && this.fauna.boss.isAlive) {
      const distToBoss = this.snake.getHeadPosition().distanceTo(this.fauna.boss.getPosition());
      if (distToBoss < 45) {
        bossPanel.style.display = 'block';
        const pct = (this.fauna.boss.health / this.fauna.boss.maxHealth) * 100;
        bossFill.style.width = `${pct}%`;
      } else {
        bossPanel.style.display = 'none';
      }
    } else {
      if (bossPanel) bossPanel.style.display = 'none';
    }

    // Crosshair ready state
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.classList.toggle('strike-ready', this.snake.stamina > 25);
  }

  updateCamera(delta) {
    const headPos = this.snake.getHeadPosition();
    const heading = this.snake.getHeadingAngle();

    if (this.cameraMode === 0) {
      // 3rd-Person Chase Cam
      const camOffset = new THREE.Vector3(
        Math.sin(heading) * 12,
        6.5,
        Math.cos(heading) * 12
      );
      const targetCamPos = headPos.clone().add(camOffset);
      this.camera.position.lerp(targetCamPos, 5 * delta);
      this.camera.lookAt(headPos.x, headPos.y + 0.8, headPos.z);
    } else if (this.cameraMode === 1) {
      // Tactical Isometric Cam
      const targetCamPos = new THREE.Vector3(headPos.x + 25, headPos.y + 35, headPos.z + 25);
      this.camera.position.lerp(targetCamPos, 4 * delta);
      this.camera.lookAt(headPos);
    } else if (this.cameraMode === 2) {
      // 1st-Person Predator Cam
      const eyeOffset = new THREE.Vector3(
        -Math.sin(heading) * 0.4,
        0.5,
        -Math.cos(heading) * 0.4
      );
      this.camera.position.copy(headPos).add(eyeOffset);
      const lookTarget = headPos.clone().add(new THREE.Vector3(
        -Math.sin(heading) * 10,
        0.2,
        -Math.cos(heading) * 10
      ));
      this.camera.lookAt(lookTarget);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.radar.resize();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isPaused || this.isGameOver) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Update Subsystems
    this.snake.update(delta, this.input, this.world);
    this.world.update(delta);
    this.fauna.update(
      delta,
      this.snake,
      this.audio,
      (killedPrey) => {
        this.showToast(`Swallowed ${killedPrey.type.toUpperCase()}! Digesting... (+${killedPrey.nutrition * 10} pts)`, "digestion");
      },
      () => {
        this.showToast("VICTORY! Prehistoric Black Caiman Defeated! You are the Apex Ruler!", "boss");
      }
    );

    // Audio locomotion
    if (Math.abs(this.snake.speed) > 1.0) {
      if (this.snake.isUnderwater) {
        if (Math.random() < 0.08) this.audio.playSwim();
      } else {
        if (Math.random() < 0.06) this.audio.playSlither();
      }
    }

    // Check Player Death
    if (this.snake.health <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      this.audio.playHurt();
      this.showToast("Game Over: Your Anaconda has starved or succumbed to wounds.", "boss");
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
