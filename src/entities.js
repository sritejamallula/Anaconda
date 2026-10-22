// Amazon Rainforest Prey & Predator Fauna Ecosystem
class FaunaManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.entities = [];
    this.boss = null;
    this.spawnPrey();
    this.spawnBoss();
  }

  spawnPrey() {
    // Spawn 15 Frogs
    for (let i = 0; i < 15; i++) {
      this.entities.push(new FrogEntity(this.scene, this.world));
    }
    // Spawn 12 Forest Rats
    for (let i = 0; i < 12; i++) {
      this.entities.push(new RatEntity(this.scene, this.world));
    }
    // Spawn 8 Capybaras
    for (let i = 0; i < 8; i++) {
      this.entities.push(new CapybaraEntity(this.scene, this.world));
    }
    // Spawn 5 Spectacled Caimans
    for (let i = 0; i < 5; i++) {
      this.entities.push(new CaimanEntity(this.scene, this.world));
    }
  }

  spawnBoss() {
    this.boss = new BlackCaimanBoss(this.scene, this.world);
  }

  update(delta, snake, audio, onKill, onBossDefeat) {
    const snakePos = snake.getHeadPosition();
    const isStriking = snake.isStriking;

    // 1. Update Prey Entities
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.isAlive) {
        // Respawn timer
        ent.respawnTimer -= delta;
        if (ent.respawnTimer <= 0) {
          ent.respawn();
        }
        continue;
      }

      ent.update(delta, snakePos);

      // Check Predation by Snake
      const dist = ent.position.distanceTo(snakePos);
      const catchRadius = (isStriking ? 2.8 : 1.4) + ent.radius;

      if (dist < catchRadius) {
        // Success Catch & Swallow!
        ent.die();
        snake.swallowPrey(ent.sizeMultiplier, ent.nutrition);
        audio.playCatch();
        audio.playGulp();
        if (onKill) onKill(ent);
      }
    }

    // 2. Update Boss
    if (this.boss && this.boss.isAlive) {
      this.boss.update(delta, snakePos, snake, audio, onBossDefeat);
    }
  }
}

// ----------------- Base Fauna Entity -----------------
class BaseEntity {
  constructor(scene, world, type) {
    this.scene = scene;
    this.world = world;
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
    this.fleeSpeed = 5.0;
    this.radius = 0.5;
    this.sizeMultiplier = 1.0;
    this.nutrition = 20;
  }

  getPosition() {
    return this.position;
  }

  die() {
    this.isAlive = false;
    this.respawnTimer = 18.0; // Respawns after 18s
    if (this.mesh) this.mesh.visible = false;
  }

  respawn() {
    this.isAlive = true;
    this.randomizePosition();
    if (this.mesh) this.mesh.visible = true;
  }

  randomizePosition() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 85;
    this.position.x = Math.cos(angle) * dist;
    this.position.z = Math.sin(angle) * dist;
    this.position.y = this.world.getHeightAt(this.position.x, this.position.z);
    if (this.mesh) this.mesh.position.copy(this.position);
  }

  updateMovement(delta, snakePos, fleeDistance = 14) {
    const distToSnake = this.position.distanceTo(snakePos);

    // AI State Machine
    if (distToSnake < fleeDistance) {
      this.state = 'FLEE';
      // Angle directly away from snake
      const away = new THREE.Vector3().subVectors(this.position, snakePos);
      this.heading = Math.atan2(away.x, away.z);
    } else {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.state = Math.random() > 0.35 ? 'WANDER' : 'IDLE';
        this.stateTimer = 2 + Math.random() * 4;
        if (this.state === 'WANDER') {
          this.heading += (Math.random() - 0.5) * 1.5;
        }
      }
    }

    if (this.state === 'FLEE') {
      const move = this.fleeSpeed * delta;
      this.position.x += Math.sin(this.heading) * move;
      this.position.z += Math.cos(this.heading) * move;
    } else if (this.state === 'WANDER') {
      const move = this.speed * delta;
      this.position.x += Math.sin(this.heading) * move;
      this.position.z += Math.cos(this.heading) * move;
    }

    // Keep within world bounds
    const maxBound = 105;
    this.position.x = Math.max(-maxBound, Math.min(maxBound, this.position.x));
    this.position.z = Math.max(-maxBound, Math.min(maxBound, this.position.z));

    const groundY = this.world.getHeightAt(this.position.x, this.position.z);
    this.position.y = Math.max(groundY, this.world.waterLevel - 0.1) + this.radius * 0.4;

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.heading + Math.PI;
    }
  }
}

// ----------------- Amazon River Tree Frog -----------------
class FrogEntity extends BaseEntity {
  constructor(scene, world) {
    super(scene, world, 'frog');
    this.speed = 1.8;
    this.fleeSpeed = 5.5;
    this.radius = 0.35;
    this.sizeMultiplier = 0.6;
    this.nutrition = 12;
    this.hopPhase = 0;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    // Vibrant Amazon tree frog green
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x44cc22, roughness: 0.3 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.1 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bodyMat);
    body.scale.set(0.9, 0.6, 1.2);
    this.mesh.add(body);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
    eyeL.position.set(0.18, 0.15, -0.2);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
    eyeR.position.set(-0.18, 0.15, -0.2);
    this.mesh.add(eyeR);

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 12);
    // Hopping animation
    if (this.state === 'FLEE' || this.state === 'WANDER') {
      this.hopPhase += delta * 12;
      this.position.y += Math.abs(Math.sin(this.hopPhase)) * 0.28;
      if (this.mesh) this.mesh.position.y = this.position.y;
    }
  }
}

// ----------------- Forest Spiny Rat -----------------
class RatEntity extends BaseEntity {
  constructor(scene, world) {
    super(scene, world, 'rat');
    this.speed = 2.4;
    this.fleeSpeed = 6.2;
    this.radius = 0.45;
    this.sizeMultiplier = 0.75;
    this.nutrition = 16;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x5a422e, roughness: 0.8 });
    const earMat = new THREE.MeshStandardMaterial({ color: 0xaa7766, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), furMat);
    body.scale.set(0.7, 0.6, 1.4);
    this.mesh.add(body);

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.7, 5), furMat);
    tail.rotation.x = Math.PI * 0.4;
    tail.position.set(0, 0.05, 0.8);
    this.mesh.add(tail);

    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), earMat);
    earL.position.set(0.18, 0.22, -0.25);
    this.mesh.add(earL);

    const earR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), earMat);
    earR.position.set(-0.18, 0.22, -0.25);
    this.mesh.add(earR);

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 14);
  }
}

// ----------------- Capybara -----------------
class CapybaraEntity extends BaseEntity {
  constructor(scene, world) {
    super(scene, world, 'capybara');
    this.speed = 2.0;
    this.fleeSpeed = 5.2;
    this.radius = 1.1;
    this.sizeMultiplier = 1.5;
    this.nutrition = 45;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x734a26, roughness: 0.85 });
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.9 });

    // Barrel-shaped robust torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 2.0), coatMat);
    body.position.y = 0.55;
    this.mesh.add(body);

    // Characteristic blunt square snout
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.7, 0.9), snoutMat);
    head.position.set(0, 0.85, -1.2);
    this.mesh.add(head);

    // Sturdy legs
    for (let lx of [-0.45, 0.45]) {
      for (let lz of [-0.65, 0.65]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.6, 6), coatMat);
        leg.position.set(lx, 0.15, lz);
        this.mesh.add(leg);
      }
    }

    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 18);
  }
}

// ----------------- Spectacled Caiman -----------------
class CaimanEntity extends BaseEntity {
  constructor(scene, world) {
    super(scene, world, 'caiman');
    this.speed = 2.8;
    this.fleeSpeed = 6.0;
    this.radius = 1.3;
    this.sizeMultiplier = 1.8;
    this.nutrition = 65;
    this.initMesh();
    this.randomizePosition();
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const hideMat = new THREE.MeshStandardMaterial({ color: 0x3d472a, roughness: 0.7 });
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // Armored body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 2.4), hideMat);
    this.mesh.add(body);

    // Heavy long snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.3, 1.4), hideMat);
    snout.position.set(0, -0.05, -1.6);
    this.mesh.add(snout);

    // Muscular rudder tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 6), hideMat);
    tail.rotation.x = Math.PI * 0.5;
    tail.position.set(0, 0, 2.0);
    this.mesh.add(tail);

    this.scene.add(this.mesh);
  }

  update(delta, snakePos) {
    super.updateMovement(delta, snakePos, 15);
  }
}

// ----------------- Boss: Prehistoric Black Caiman -----------------
class BlackCaimanBoss {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.isAlive = true;
    this.maxHealth = 450;
    this.health = 450;
    this.position = new THREE.Vector3(15, 0, -35); // Roams deep Tapajós crossing
    this.heading = 0;
    this.speed = 3.6;
    this.chargeSpeed = 9.5;
    this.state = 'PATROL';
    this.attackCooldown = 0;
    this.initMesh();
  }

  getPosition() {
    return this.position;
  }

  initMesh() {
    this.mesh = new THREE.Group();
    const blackHideMat = new THREE.MeshStandardMaterial({
      color: 0x181a17,
      roughness: 0.85,
      metalness: 0.2
    });
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x2c2e26,
      roughness: 0.95
    });
    const amberEyeMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0x661100,
      roughness: 0.2
    });

    // Gigantic 12-meter apex boss scale
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 5.5), blackHideMat);
    body.position.y = 0.6;
    body.castShadow = true;
    this.mesh.add(body);

    // Armored dorsal osteoderm ridges
    for (let r = -2; r <= 2; r++) {
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), ridgeMat);
      ridge.position.set(0, 1.4, r * 1.0);
      this.mesh.add(ridge);
    }

    // Massive Crushing Skull & Jaw
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 3.2), blackHideMat);
    head.position.set(0, 0.65, -3.8);
    head.castShadow = true;
    this.mesh.add(head);

    // Glowing Menacing Amber/Red Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), amberEyeMat);
    eyeL.position.set(0.9, 1.1, -3.2);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), amberEyeMat);
    eyeR.position.set(-0.9, 1.1, -3.2);
    this.mesh.add(eyeR);

    // Heavy segmented scythe tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1.2, 5.0, 7), blackHideMat);
    tail.rotation.x = Math.PI * 0.5;
    tail.position.set(0, 0.6, 4.8);
    this.mesh.add(tail);

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

    // Boss Behavior State Machine
    if (distToSnake < 28) {
      this.state = 'HUNT';
      const toSnake = new THREE.Vector3().subVectors(snakePos, this.position);
      this.heading = Math.atan2(toSnake.x, toSnake.z);

      // Charge & Strike attack
      if (distToSnake < 6.5 && this.attackCooldown <= 0) {
        // Strike Anaconda!
        this.attackCooldown = 2.4;
        audio.playBossRoar();
        audio.playHurt();
        snake.takeDamage(28);
      }
    } else {
      this.state = 'PATROL';
      this.heading += delta * 0.25;
    }

    const currentSpeed = (this.state === 'HUNT') ? this.chargeSpeed : this.speed;
    this.position.x += Math.sin(this.heading) * currentSpeed * delta;
    this.position.z += Math.cos(this.heading) * currentSpeed * delta;

    // Hug river channel depth
    const groundY = this.world.getHeightAt(this.position.x, this.position.z);
    this.position.y = Math.max(groundY, this.world.waterLevel - 0.25);

    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.heading + Math.PI;
    }

    // Check if snake strikes boss
    if (snake.isStriking && distToSnake < 5.0 && this.attackCooldown < 1.8) {
      this.takeDamage(45);
      audio.playCatch();
      if (!this.isAlive) {
        snake.swallowPrey(2.5, 100);
        if (onBossDefeat) onBossDefeat();
      }
    }
  }
}

window.FaunaManager = FaunaManager;
