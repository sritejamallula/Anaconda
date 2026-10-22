// Photorealistic Amazon Fauna & Insects Ecosystem with Photographic PBR Textures
class FaunaManager {
  constructor(scene, world, gameAssets) {
    this.scene = scene;
    this.world = world;
    this.assets = gameAssets;
    this.entities = [];
    this.boss = null;
    this.currentLevel = 1;
    this.spawnForLevel(1);
  }

  clear() {
    for (const ent of this.entities) {
      if (ent.mesh) this.scene.remove(ent.mesh);
    }
    this.entities = [];
    if (this.boss && this.boss.mesh) {
      this.scene.remove(this.boss.mesh);
      this.boss = null;
    }
  }

  spawnForLevel(levelNumber) {
    this.clear();
    this.currentLevel = levelNumber;

    if (levelNumber === 1) {
      // Level 1: "The Shallows - Nursery Island" (Juvenile Anaconda Ecosystem)
      for (let i = 0; i < 12; i++) {
        this.entities.push(new DragonflyEntity(this.scene, this.world, this.assets));
      }
      for (let i = 0; i < 8; i++) {
        this.entities.push(new BeetleEntity(this.scene, this.world, this.assets));
      }
      for (let i = 0; i < 10; i++) {
        this.entities.push(new FrogEntity(this.scene, this.world, this.assets, 0.45));
      }
    } else if (levelNumber === 2) {
      // Level 2: "The Great Tapajós Crossing" (Sub-Adult & Adult Apex Predators)
      for (let i = 0; i < 8; i++) {
        this.entities.push(new CapybaraEntity(this.scene, this.world, this.assets));
      }
      for (let i = 0; i < 6; i++) {
        this.entities.push(new CaimanEntity(this.scene, this.world, this.assets));
      }
      for (let i = 0; i < 12; i++) {
        this.entities.push(new FrogEntity(this.scene, this.world, this.assets, 0.85));
      }
      for (let i = 0; i < 10; i++) {
        this.entities.push(new RatEntity(this.scene, this.world, this.assets));
      }
    } else {
      // Level 3: "Flooded Blackwater Forest" (Titan Black Caiman Boss Arena)
      this.boss = new BlackCaimanBoss(this.scene, this.world, this.assets);
      for (let i = 0; i < 6; i++) {
        this.entities.push(new CapybaraEntity(this.scene, this.world, this.assets));
      }
      for (let i = 0; i < 4; i++) {
        this.entities.push(new CaimanEntity(this.scene, this.world, this.assets));
      }
    }
  }

  update(delta, snake, audio, onPreyEaten, onEvolutionTriggered, onBossDefeat) {
    const snakePos = snake.getHeadPosition();
    const isStriking = snake.isStriking;

    // 1. Update Prey Entities
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.isAlive) {
        ent.respawnTimer -= delta;
        if (ent.respawnTimer <= 0) {
          ent.respawn();
        }
        continue;
      }

      ent.update(delta, snakePos);

      // Check Predation by Snake
      const dist = ent.position.distanceTo(snakePos);
      const catchRadius = (isStriking ? 3.2 : 1.6) + ent.radius;

      if (dist < catchRadius) {
        ent.die();
        snake.startCinematicConstriction(ent);
        const evolved = snake.swallowPrey(ent.sizeMultiplier, ent.nutrition);

        audio.playStrike();
        audio.playCatch();
        setTimeout(() => audio.playGulp(), 400);

        if (onPreyEaten) onPreyEaten(ent);
        if (evolved && onEvolutionTriggered) onEvolutionTriggered(snake.growthStage);
      }
    }

    // 2. Update Boss (Level 3)
    if (this.boss && this.boss.isAlive) {
      this.boss.update(delta, snakePos, snake, audio, onBossDefeat);
    }
  }
}

// ----------------- Base Fauna Entity -----------------
class BaseEntity {
  constructor(scene, world, assets, type) {
    this.scene = scene;
    this.world = world;
    this.assets = assets;
    this.type = type;
    this.isAlive = true;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.heading = Math.random() * Math.PI * 2;
    this.state = 'WANDER';
    this.stateTimer = Math.random() * 3;
    this.respawnTimer = 0;
    this.mesh = null;
    this.speed = 2.0;
    this.fleeSpeed = 5.2;
    this.radius = 0.5;
    this.sizeMultiplier = 1.0;
    this.nutrition = 20;
  }

  getPosition() {
    return this.position;
  }

  die() {
    this.isAlive = false;
    this.respawnTimer = 16.0;
    if (this.mesh) this.mesh.visible = false;
  }

  respawn() {
    this.isAlive = true;
    this.randomizePosition();
    if (this.mesh) this.mesh.visible = true;
  }

  randomizePosition() {
    const maxR = (this.world.currentLevel === 1) ? 24 : (this.world.worldSize * 0.42);
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * maxR;
    this.position.x = Math.cos(angle) * dist;
    this.position.z = Math.sin(angle) * dist;
    this.position.y = this.world.getHeightAt(this.position.x, this.position.z);
    if (this.mesh) this.mesh.position.copy(this.position);
  }

  updateMovement(delta, snakePos, fleeDistance = 14) {
    const distToSnake = this.position.distanceTo(snakePos);

    if (distToSnake < fleeDistance) {
      this.state = 'FLEE';
      const away = new THREE.Vector3().subVectors(this.position, snakePos);
      this.heading = Math.atan2(away.x, away.z);
    } else {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.state = Math.random() > 0.35 ? 'WANDER' : 'IDLE';
        this.stateTimer = 2 + Math.random() * 3.5;
        if (this.state === 'WANDER') {
          this.heading += (Math.random() - 0.5) * 1.6;
        }
      }
    }

    const currentSpeed = (this.state === 'FLEE') ? this.fleeSpeed : (this.state === 'WANDER' ? this.speed : 0);
    this.position.x += Math.sin(this.heading) * currentSpeed * delta;
    this.position.z += Math.cos(this.heading) * currentSpeed * delta;

    const maxBound = (this.world.currentLevel === 1) ? 26 : (this.world.worldSize * 0.45);
    this.position.x = Math.max(-maxBound, Math.min(maxBound, this.position.x));
    this.position.z = Math.max(-maxBound, Math.min(maxBound, this.position.z));

    const groundY = this.world.getHeightAt(this.position.x, this.position.z);
    this.position.y = Math.max(groundY, this.world.waterLevel - 0.08) + this.radius * 0.4;

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.heading + Math.PI;
    }
  }
}

// ----------------- 3D Amazon Emerald Dragonfly (Insect) -----------------
class DragonflyEntity extends BaseEntity {
  constructor(scene, world, assets) {
    super(scene, world, assets, 'insect');
    this.speed = 3.8;
    this.fleeSpeed = 8.5;
    this.radius = 0.28;
    this.sizeMultiplier = 0.45;
    this.nutrition = 10;
    this.flightHoverOffset = 0.8 + Math.random() * 1.2;
    this.wingBeat = 0;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e676,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 0.8
    });
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0ffff,
      transparent: true,
      opacity: 0.65,
      roughness: 0.08,
      metalness: 0.4,
      transmission: 0.85,
      side: THREE.DoubleSide
    });

    const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.7, 8), bodyMat);
    abdomen.rotation.x = Math.PI * 0.5;
    abdomen.position.set(0, 0, 0.25);
    this.mesh.add(abdomen);

    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), bodyMat);
    thorax.position.set(0, 0, -0.15);
    this.mesh.add(thorax);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a0933, roughness: 0.1 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeMat);
    eyeL.position.set(0.055, 0.03, -0.2);
    this.mesh.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeMat);
    eyeR.position.set(-0.055, 0.03, -0.2);
    this.mesh.add(eyeR);

    this.wings = [];
    for (let w = 0; w < 4; w++) {
      const wingGeom = new THREE.PlaneGeometry(0.42, 0.12);
      const wing = new THREE.Mesh(wingGeom, wingMat);
      const isRight = (w % 2 === 0);
      const isFront = (w < 2);
      wing.position.set(isRight ? 0.24 : -0.24, 0.05, isFront ? -0.18 : -0.06);
      this.mesh.add(wing);
      this.wings.push(wing);
    }

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 10);
    this.wingBeat += delta * 65;
    for (let i = 0; i < this.wings.length; i++) {
      const isRight = (i % 2 === 0);
      this.wings[i].rotation.z = Math.sin(this.wingBeat) * 0.45 * (isRight ? 1 : -1);
    }
    const groundY = this.world.getHeightAt(this.position.x, this.position.z);
    this.position.y = Math.max(groundY, this.world.waterLevel) + this.flightHoverOffset + Math.sin(Date.now() * 0.006) * 0.2;
    if (this.mesh) this.mesh.position.y = this.position.y;
  }
}

// ----------------- 3D Amazon Jewel Beetle (Insect) -----------------
class BeetleEntity extends BaseEntity {
  constructor(scene, world, assets) {
    super(scene, world, assets, 'insect');
    this.speed = 1.6;
    this.fleeSpeed = 4.0;
    this.radius = 0.25;
    this.sizeMultiplier = 0.5;
    this.nutrition = 12;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x99dd11,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 0.95
    });

    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), shellMat);
    shell.scale.set(0.85, 0.5, 1.25);
    shell.position.y = 0.1;
    this.mesh.add(shell);

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 8);
  }
}

// ----------------- Photorealistic Amazon Tree Frog -----------------
class FrogEntity extends BaseEntity {
  constructor(scene, world, assets, scale = 0.65) {
    super(scene, world, assets, 'frog');
    this.scale = scale;
    this.speed = 2.0;
    this.fleeSpeed = 6.0;
    this.radius = 0.38 * scale;
    this.sizeMultiplier = 0.7 * scale;
    this.nutrition = Math.round(18 * scale);
    this.hopPhase = 0;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const frogTex = (this.assets && this.assets.textures.frog) ? this.assets.textures.frog : null;

    // Ultra-Glossy Wet Amphibian Clearcoat Material
    const skinMat = new THREE.MeshPhysicalMaterial({
      map: frogTex,
      color: frogTex ? 0xffffff : 0x44cc28,
      roughness: 0.15,
      clearcoat: 1.0, // High-sheen liquid reflection
      clearcoatRoughness: 0.05,
      reflectivity: 0.9
    });
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffaa00,
      roughness: 0.05,
      clearcoat: 1.0
    });

    // Sculpted organic torso
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38 * this.scale, 16, 16), skinMat);
    body.scale.set(0.95, 0.6, 1.35);
    body.position.y = 0.22 * this.scale;
    body.castShadow = true;
    this.mesh.add(body);

    // Bulging Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12 * this.scale, 12, 12), eyeMat);
    eyeL.position.set(0.24 * this.scale, 0.4 * this.scale, -0.25 * this.scale);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12 * this.scale, 12, 12), eyeMat);
    eyeR.position.set(-0.24 * this.scale, 0.4 * this.scale, -0.25 * this.scale);
    this.mesh.add(eyeR);

    // Curved Hind Legs
    for (let side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12 * this.scale, 0.15 * this.scale, 0.48 * this.scale), skinMat);
      leg.position.set(side * 0.34 * this.scale, 0.15 * this.scale, 0.28 * this.scale);
      leg.rotation.y = side * 0.45;
      this.mesh.add(leg);
    }

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 12);
    if (this.state === 'FLEE' || this.state === 'WANDER') {
      this.hopPhase += delta * 14;
      this.position.y += Math.abs(Math.sin(this.hopPhase)) * 0.35 * this.scale;
      if (this.mesh) this.mesh.position.y = this.position.y;
    }
  }
}

// ----------------- Photorealistic Forest Spiny Rat -----------------
class RatEntity extends BaseEntity {
  constructor(scene, world, assets) {
    super(scene, world, assets, 'rat');
    this.speed = 2.8;
    this.fleeSpeed = 6.8;
    this.radius = 0.55;
    this.sizeMultiplier = 0.85;
    this.nutrition = 22;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const ratTex = (this.assets && this.assets.textures.rat) ? this.assets.textures.rat : null;

    const furMat = new THREE.MeshPhysicalMaterial({
      map: ratTex,
      color: ratTex ? 0xffffff : 0x5a422e,
      roughness: 0.85,
      clearcoat: 0.15
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 14), furMat);
    body.scale.set(0.72, 0.62, 1.48);
    body.position.y = 0.26;
    body.castShadow = true;
    this.mesh.add(body);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.015, 0.95, 6), furMat);
    tail.rotation.x = Math.PI * 0.4;
    tail.position.set(0, 0.2, 0.9);
    this.mesh.add(tail);

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 15);
  }
}

// ----------------- Photorealistic Capybara -----------------
class CapybaraEntity extends BaseEntity {
  constructor(scene, world, assets) {
    super(scene, world, assets, 'capybara');
    this.speed = 2.2;
    this.fleeSpeed = 5.6;
    this.radius = 1.25;
    this.sizeMultiplier = 1.6;
    this.nutrition = 55;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const capyTex = (this.assets && this.assets.textures.capybara) ? this.assets.textures.capybara : null;

    const peltMat = new THREE.MeshPhysicalMaterial({
      map: capyTex,
      color: capyTex ? 0xffffff : 0x6e4321,
      roughness: 0.88,
      clearcoat: 0.2
    });

    // Sculpted organic curved mammalian body
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 16), peltMat);
    body.scale.set(0.85, 0.85, 1.55);
    body.position.y = 0.72;
    body.castShadow = true;
    this.mesh.add(body);

    // Characteristic blunt square snout
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.78, 1.05, 4, 4, 4), peltMat);
    head.position.set(0, 1.0, -1.35);
    head.castShadow = true;
    this.mesh.add(head);

    // Sturdy swimming legs
    for (let lx of [-0.48, 0.48]) {
      for (let lz of [-0.75, 0.75]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.7, 8), peltMat);
        leg.position.set(lx, 0.25, lz);
        this.mesh.add(leg);
      }
    }

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 20);
  }
}

// ----------------- Photorealistic Spectacled Caiman -----------------
class CaimanEntity extends BaseEntity {
  constructor(scene, world, assets) {
    super(scene, world, assets, 'caiman');
    this.speed = 3.0;
    this.fleeSpeed = 6.4;
    this.radius = 1.4;
    this.sizeMultiplier = 1.9;
    this.nutrition = 75;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const caimanTex = (this.assets && this.assets.textures.caiman) ? this.assets.textures.caiman : null;

    const hideMat = new THREE.MeshPhysicalMaterial({
      map: caimanTex,
      color: caimanTex ? 0xffffff : 0x354026,
      roughness: 0.55,
      metalness: 0.15,
      clearcoat: 0.45 // Wet armor scales
    });

    // Sculpted organic caiman body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.52, 2.6, 6, 4, 8), hideMat);
    body.position.y = 0.26;
    body.castShadow = true;
    this.mesh.add(body);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.35, 1.6, 4, 3, 6), hideMat);
    snout.position.set(0, 0.2, -1.8);
    this.mesh.add(snout);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.48, 2.5, 8), hideMat);
    tail.rotation.x = Math.PI * 0.5;
    tail.position.set(0, 0.26, 2.3);
    this.mesh.add(tail);

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 16);
  }
}

// ----------------- Prehistoric Titan Black Caiman Boss -----------------
class BlackCaimanBoss {
  constructor(scene, world, assets) {
    this.scene = scene;
    this.world = world;
    this.assets = assets;
    this.isAlive = true;
    this.maxHealth = 500;
    this.health = 500;
    this.position = new THREE.Vector3(20, 0, -40);
    this.heading = 0;
    this.speed = 3.8;
    this.chargeSpeed = 10.2;
    this.state = 'PATROL';
    this.attackCooldown = 0;
    this.initMesh();
  }

  getPosition() {
    return this.position;
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const bossTex = (this.assets && this.assets.textures.caimanBoss) ? this.assets.textures.caimanBoss : null;

    const blackMat = new THREE.MeshPhysicalMaterial({
      map: bossTex,
      color: bossTex ? 0xffffff : 0x141613,
      roughness: 0.65,
      metalness: 0.2,
      clearcoat: 0.55
    });
    const amberEye = new THREE.MeshPhysicalMaterial({
      color: 0xff2200,
      emissive: 0x880000,
      roughness: 0.05,
      clearcoat: 1.0
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 6.0, 6, 4, 10), blackMat);
    body.position.y = 0.65;
    body.castShadow = true;
    this.mesh.add(body);

    for (let r = -2; r <= 2; r++) {
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.85, 6), blackMat);
      ridge.position.set(0, 1.5, r * 1.1);
      this.mesh.add(ridge);
    }

    const head = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 3.4, 6, 4, 6), blackMat);
    head.position.set(0, 0.75, -4.2);
    head.castShadow = true;
    this.mesh.add(head);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), amberEye);
    eyeL.position.set(1.0, 1.25, -3.6);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), amberEye);
    eyeR.position.set(-1.0, 1.25, -3.6);
    this.mesh.add(eyeR);

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    if (this.mesh) this.mesh.visible = false;
  }

  update(delta, snakePos, snake, audio, onBossDefeat) {
    if (!this.isAlive) return;

    this.attackCooldown -= delta;
    const distToSnake = this.position.distanceTo(snakePos);

    if (distToSnake < 32) {
      this.state = 'HUNT';
      const toSnake = new THREE.Vector3().subVectors(snakePos, this.position);
      this.heading = Math.atan2(toSnake.x, toSnake.z);

      if (distToSnake < 7.0 && this.attackCooldown <= 0) {
        this.attackCooldown = 2.2;
        audio.playBossRoar();
        audio.playHurt();
        snake.takeDamage(32);
      }
    } else {
      this.state = 'PATROL';
      this.heading += delta * 0.28;
    }

    const currentSpeed = (this.state === 'HUNT') ? this.chargeSpeed : this.speed;
    this.position.x += Math.sin(this.heading) * currentSpeed * delta;
    this.position.z += Math.cos(this.heading) * currentSpeed * delta;

    const groundY = this.world.getHeightAt(this.position.x, this.position.z);
    this.position.y = Math.max(groundY, this.world.waterLevel - 0.25);

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.heading + Math.PI;
    }

    if (snake.isStriking && distToSnake < 5.5 && this.attackCooldown < 1.6) {
      this.takeDamage(45);
      audio.playCatch();
      if (!this.isAlive) {
        snake.swallowPrey(3.0, 120);
        if (onBossDefeat) onBossDefeat();
      }
    }
  }
}

window.FaunaManager = FaunaManager;
