// Photorealistic 3D Green Anaconda with Continuous Tubular Skin, PBR Wet Clearcoat, and Anatomical Swallowing Bulge
class AnacondaSnake {
  constructor(scene, gameAssets) {
    this.scene = scene;
    this.assets = gameAssets;
    
    // Growth Stages: 1 = Juvenile, 2 = Sub-Adult, 3 = Adult, 4 = Apex Titan
    this.growthStage = 1;
    this.preyEaten = 0;
    this.preyEatenInCurrentLevel = 0;

    // Body Dimensions (Scales with stage)
    this.numSegments = 28;
    this.segmentDistance = 0.5;
    this.baseRadius = 0.18; // Slender juvenile start (1.8m)
    this.segments = [];
    this.segmentMeshes = [];
    this.digestingPrey = [];

    // Locomotion & Physics
    this.position = new THREE.Vector3(0, 0.25, 0);
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.baseSpeed = 6.8;
    this.boostMultiplier = 1.7;
    this.turnSpeed = 3.2;
    this.wavePhase = 0;
    this.isUnderwater = false;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.hunger = 85;
    this.score = 0;

    // Strike & Cinematic Constriction State
    this.isStriking = false;
    this.strikeTimer = 0;
    this.strikeDuration = 0.32;
    this.isConstricting = false;
    this.constrictionTimer = 0;
    this.constrictionDuration = 1.4;
    this.constrictionTarget = null;
    this.tongueFlickTimer = 0;

    this.initBody();
  }

  initBody() {
    if (this.bodyGroup) {
      this.scene.remove(this.bodyGroup);
    }

    this.bodyGroup = new THREE.Group();
    this.scene.add(this.bodyGroup);

    // Film-Grade PBR Photorealistic Serpent Skin Material (MeshPhysicalMaterial)
    const skinTex = (this.assets && this.assets.textures.snakeSkin) ? this.assets.textures.snakeSkin : this.generateFallbackScaleTexture();
    
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      map: skinTex,
      roughness: 0.18, // Smooth wet reptile sheen
      metalness: 0.08,
      clearcoat: 0.95, // High-gloss liquid water layer on scales
      clearcoatRoughness: 0.08,
      reflectivity: 0.85,
      color: 0x6e8f52
    });

    // 1. Create Sculpted Head
    this.createSculptedHead();

    // 2. Create Continuous Organic Tubular Body Segments
    this.segments = [];
    this.segmentMeshes = [];

    for (let i = 0; i < this.numSegments; i++) {
      const t = i / (this.numSegments - 1);
      let taper = 1.0;
      if (i < 3) {
        taper = 0.72 + (i / 3) * 0.28; // Neck narrowing behind jaw
      } else {
        // Natural muscular anaconda taper down to slender tail
        taper = Math.sin((1 - t) * Math.PI * 0.5) * 0.94 + 0.06;
      }

      const radius = this.baseRadius * taper;

      // High-density organic curved tube ring with seamless overlap
      const geom = new THREE.CylinderGeometry(radius * 0.94, radius * 1.08, this.segmentDistance * 1.35, 24, 2, false);
      geom.rotateX(Math.PI * 0.5);
      geom.scale(1.0, 0.76, 1.0); // Dorsoventrally compressed serpentine profile

      const mesh = new THREE.Mesh(geom, this.bodyMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const pos = new THREE.Vector3(0, 0.2, i * this.segmentDistance);
      mesh.position.copy(pos);

      this.bodyGroup.add(mesh);
      this.segments.push({
        position: pos,
        radius: radius,
        baseRadius: radius,
        taper: taper
      });
      this.segmentMeshes.push(mesh);
    }
  }

  generateFallbackScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2f4a21';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#11180a';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.ellipse((i * 73) % 512, (i * 109) % 512, 20, 32, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  }

  createSculptedHead() {
    this.headGroup = new THREE.Group();
    this.bodyGroup.add(this.headGroup);

    const headScale = this.baseRadius * 1.95;

    // Sculpted Cranium with Supraocular Brow Ridges
    const craniumGeom = new THREE.BoxGeometry(0.85 * headScale, 0.42 * headScale, 1.38 * headScale, 6, 4, 6);
    this.craniumMesh = new THREE.Mesh(craniumGeom, this.bodyMaterial);
    this.craniumMesh.position.set(0, 0.08 * headScale, -0.48 * headScale);
    this.craniumMesh.castShadow = true;
    this.headGroup.add(this.craniumMesh);

    // Sculpted Tapered Snout
    const snoutGeom = new THREE.ConeGeometry(0.42 * headScale, 0.8 * headScale, 10);
    snoutGeom.rotateX(-Math.PI * 0.5);
    snoutGeom.scale(1, 0.52, 1);
    const snoutMesh = new THREE.Mesh(snoutGeom, this.bodyMaterial);
    snoutMesh.position.set(0, 0.02 * headScale, -1.32 * headScale);
    this.headGroup.add(snoutMesh);

    // Heat-Sensing Labial Pits along mouth line
    for (let side of [-1, 1]) {
      for (let p = 0; p < 3; p++) {
        const pit = new THREE.Mesh(
          new THREE.BoxGeometry(0.04 * headScale, 0.03 * headScale, 0.06 * headScale),
          new THREE.MeshBasicMaterial({ color: 0x090f06 })
        );
        pit.position.set(side * 0.43 * headScale, 0.02 * headScale, (-0.9 - p * 0.15) * headScale);
        this.headGroup.add(pit);
      }
    }

    // Wet Cornea Amber Eyes with Vertical Slit Pupils
    const eyeGeom = new THREE.SphereGeometry(0.14 * headScale, 16, 16);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffaa00,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: 0x552200
    });
    
    this.leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.leftEye.position.set(0.44 * headScale, 0.18 * headScale, -0.62 * headScale);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.rightEye.position.set(-0.44 * headScale, 0.18 * headScale, -0.62 * headScale);
    this.headGroup.add(this.rightEye);

    const pupilGeom = new THREE.BoxGeometry(0.02 * headScale, 0.18 * headScale, 0.05 * headScale);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pL = new THREE.Mesh(pupilGeom, pupilMat);
    pL.position.set(0.51 * headScale, 0.18 * headScale, -0.62 * headScale);
    this.headGroup.add(pL);
    const pR = new THREE.Mesh(pupilGeom, pupilMat);
    pR.position.set(-0.51 * headScale, 0.18 * headScale, -0.62 * headScale);
    this.headGroup.add(pR);

    // Articulated Lower Jaw (140° opening capability)
    this.lowerJawGroup = new THREE.Group();
    this.lowerJawGroup.position.set(0, -0.12 * headScale, -0.22 * headScale);
    this.headGroup.add(this.lowerJawGroup);

    const jawGeom = new THREE.BoxGeometry(0.76 * headScale, 0.16 * headScale, 1.28 * headScale);
    const jawMesh = new THREE.Mesh(jawGeom, this.bodyMaterial);
    jawMesh.position.set(0, 0, -0.58 * headScale);
    this.lowerJawGroup.add(jawMesh);

    // Translucent Recurved Fangs
    const fangGeom = new THREE.ConeGeometry(0.045 * headScale, 0.3 * headScale, 8);
    fangGeom.rotateX(0.35);
    const fangMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      transmission: 0.3,
      ior: 1.5
    });
    
    this.leftFang = new THREE.Mesh(fangGeom, fangMat);
    this.leftFang.position.set(0.3 * headScale, 0.02 * headScale, -1.05 * headScale);
    this.headGroup.add(this.leftFang);

    this.rightFang = new THREE.Mesh(fangGeom, fangMat);
    this.rightFang.position.set(-0.3 * headScale, 0.02 * headScale, -1.05 * headScale);
    this.headGroup.add(this.rightFang);

    // Bifurcated Tongue
    this.tongueGroup = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025 * headScale, 0.025 * headScale, 0.5 * headScale),
      new THREE.MeshBasicMaterial({ color: 0x990022 })
    );
    stem.rotateX(-Math.PI * 0.5);
    this.tongueGroup.add(stem);

    const forkL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015 * headScale, 0.005 * headScale, 0.22 * headScale),
      new THREE.MeshBasicMaterial({ color: 0x990022 })
    );
    forkL.rotation.set(0, 0.35, -Math.PI * 0.5);
    forkL.position.set(0.06 * headScale, 0, -0.35 * headScale);
    this.tongueGroup.add(forkL);

    const forkR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015 * headScale, 0.005 * headScale, 0.22 * headScale),
      new THREE.MeshBasicMaterial({ color: 0x990022 })
    );
    forkR.rotation.set(0, -0.35, -Math.PI * 0.5);
    forkR.position.set(-0.06 * headScale, 0, -0.35 * headScale);
    this.tongueGroup.add(forkR);

    this.tongueGroup.position.set(0, -0.06 * headScale, -1.1 * headScale);
    this.tongueGroup.scale.set(0, 0, 0);
    this.headGroup.add(this.tongueGroup);
  }

  triggerStrike() {
    if (this.isStriking || this.isConstricting || this.stamina < 15) return;
    this.isStriking = true;
    this.strikeTimer = this.strikeDuration;
    this.stamina = Math.max(0, this.stamina - 15);
  }

  startCinematicConstriction(targetEntity) {
    this.isConstricting = true;
    this.constrictionTimer = this.constrictionDuration;
    this.constrictionTarget = targetEntity;
    this.lowerJawGroup.rotation.x = 0.95;
  }

  swallowPrey(size = 1.0, nutrition = 20) {
    this.preyEaten++;
    this.preyEatenInCurrentLevel++;
    this.hunger = Math.min(100, this.hunger + nutrition);
    this.score += Math.round(nutrition * 15);

    this.digestingPrey.push({
      size: Math.min(2.4, Math.max(0.65, size)),
      progress: 0,
      speed: 0.16
    });

    // Check Evolution Trigger (5 prey in Level 1)
    if (this.growthStage === 1 && this.preyEaten >= 5) {
      this.evolveToStage(2);
      return true;
    } else if (this.growthStage === 2 && this.preyEaten >= 12) {
      this.evolveToStage(3);
      return true;
    } else if (this.growthStage === 3 && this.preyEaten >= 20) {
      this.evolveToStage(4);
      return true;
    }

    this.growContinuous(0.018 * size);
    return false;
  }

  evolveToStage(newStage) {
    this.growthStage = newStage;
    if (newStage === 2) {
      this.numSegments = 32;
      this.segmentDistance = 0.72;
      this.baseRadius = 0.42;
      this.baseSpeed = 7.5;
    } else if (newStage === 3) {
      this.numSegments = 38;
      this.segmentDistance = 0.88;
      this.baseRadius = 0.72;
      this.baseSpeed = 8.2;
    } else if (newStage === 4) {
      this.numSegments = 44;
      this.segmentDistance = 1.05;
      this.baseRadius = 1.05;
      this.baseSpeed = 9.0;
    }
    this.initBody();
  }

  growContinuous(amount) {
    this.baseRadius += amount * 0.05;
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].baseRadius = this.baseRadius * this.segments[i].taper;
    }
  }

  update(delta, input, world) {
    // 1. Constriction Cinematic Freeze / Coil Wrap
    if (this.isConstricting) {
      this.constrictionTimer -= delta;
      const progress = 1 - (this.constrictionTimer / this.constrictionDuration);
      this.lowerJawGroup.rotation.x = Math.sin(progress * Math.PI) * 1.1;

      if (this.constrictionTarget && this.constrictionTarget.mesh) {
        this.position.lerp(this.constrictionTarget.position, 4 * delta);
      }

      if (this.constrictionTimer <= 0) {
        this.isConstricting = false;
        this.lowerJawGroup.rotation.x = 0;
        this.constrictionTarget = null;
      }
      return;
    }

    // 2. Locomotion & Steering
    if (input.left) {
      this.heading += this.turnSpeed * delta;
    }
    if (input.right) {
      this.heading -= this.turnSpeed * delta;
    }

    let targetSpeed = 0;
    if (input.forward) {
      targetSpeed = this.baseSpeed;
      if (input.boost && this.stamina > 0) {
        targetSpeed *= this.boostMultiplier;
        this.stamina = Math.max(0, this.stamina - 22 * delta);
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina + 12 * delta);
      }
    } else if (input.backward) {
      targetSpeed = -this.baseSpeed * 0.4;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 16 * delta);
    }

    if (this.digestingPrey.length > 0) {
      targetSpeed *= 0.84;
    }

    if (this.isStriking) {
      this.strikeTimer -= delta;
      targetSpeed = this.baseSpeed * 2.9;
      this.lowerJawGroup.rotation.x = 0.75;
      if (this.strikeTimer <= 0) {
        this.isStriking = false;
        this.lowerJawGroup.rotation.x = 0;
      }
    }

    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, 6.5 * delta);

    // Move Vector
    const moveDist = this.speed * delta;
    const forwardVec = new THREE.Vector3(
      -Math.sin(this.heading),
      0,
      -Math.cos(this.heading)
    );
    this.position.addScaledVector(forwardVec, moveDist);

    // Terrain Elevation & Water Level
    const terrainHeight = world ? world.getHeightAt(this.position.x, this.position.z) : 0;
    const waterLevel = world ? world.waterLevel : 0.2;

    if (terrainHeight < waterLevel) {
      this.isUnderwater = true;
      this.position.y = THREE.MathUtils.lerp(this.position.y, waterLevel - 0.04, 4 * delta);
    } else {
      this.isUnderwater = false;
      this.position.y = THREE.MathUtils.lerp(this.position.y, terrainHeight + this.baseRadius * 0.45, 8 * delta);
    }

    if (Math.abs(this.speed) > 0.1) {
      this.wavePhase += this.speed * delta * 4.8;
    }

    // Update Head
    this.headGroup.position.copy(this.position);
    this.headGroup.rotation.y = this.heading;

    // Tongue Flicking
    this.tongueFlickTimer += delta;
    if (this.tongueFlickTimer > 3.0) {
      const flickTime = this.tongueFlickTimer - 3.0;
      if (flickTime < 0.6) {
        const sc = Math.sin(flickTime / 0.6 * Math.PI);
        this.tongueGroup.scale.set(sc, sc, sc);
      } else {
        this.tongueGroup.scale.set(0, 0, 0);
        this.tongueFlickTimer = 0;
      }
    }

    // Update Digestion Bulges
    for (let p = this.digestingPrey.length - 1; p >= 0; p--) {
      const prey = this.digestingPrey[p];
      prey.progress += prey.speed * delta * (Math.abs(this.speed) > 0.5 ? 1.3 : 0.65);
      if (prey.progress >= this.numSegments) {
        this.digestingPrey.splice(p, 1);
      }
    }

    // Continuous Spine Follow & Anatomical Swallowing Bulge
    let prevPos = this.position.clone();
    const rightVec = new THREE.Vector3(-forwardVec.z, 0, forwardVec.x);

    for (let i = 0; i < this.numSegments; i++) {
      const seg = this.segments[i];
      const mesh = this.segmentMeshes[i];

      const waveOffset = Math.sin(this.wavePhase - i * 0.4) * 0.24 * Math.min(1.0, Math.abs(this.speed) / 4.0);
      const dir = new THREE.Vector3().subVectors(seg.position, prevPos);
      const dist = dir.length();
      if (dist > 0.001) {
        dir.normalize();
        seg.position.copy(prevPos).addScaledVector(dir, this.segmentDistance);
      }

      seg.position.addScaledVector(rightVec, waveOffset * delta * 5.0);

      const segGroundY = world ? world.getHeightAt(seg.position.x, seg.position.z) : 0;
      const targetY = Math.max(segGroundY, waterLevel - 0.1) + seg.baseRadius * 0.4;
      seg.position.y = THREE.MathUtils.lerp(seg.position.y, targetY, 10 * delta);

      mesh.position.copy(seg.position);
      mesh.lookAt(prevPos);

      // Swallowing Bulge Scaling
      let bulgeScale = 1.0;
      for (const prey of this.digestingPrey) {
        const distFromBulge = Math.abs(prey.progress - i);
        if (distFromBulge < 3.2) {
          const bell = Math.exp(-(distFromBulge * distFromBulge) / 2.2);
          bulgeScale += prey.size * bell * 1.5;
        }
      }

      mesh.scale.set(bulgeScale, bulgeScale * 0.85, bulgeScale * 1.15);

      prevPos = seg.position.clone();
    }

    // Hunger drain
    this.hunger = Math.max(0, this.hunger - delta * 0.22);
    if (this.hunger <= 0) {
      this.health = Math.max(0, this.health - delta * 2.0);
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  getHeadPosition() {
    return this.position;
  }

  getHeadingAngle() {
    return this.heading;
  }
}

window.AnacondaSnake = AnacondaSnake;
