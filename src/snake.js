// Realistic 3D Green Anaconda with Anatomical Skin, Growth Evolution, and 3D Constriction Sequence
class AnacondaSnake {
  constructor(scene) {
    this.scene = scene;
    
    // Growth Stages: 1 = Juvenile, 2 = Sub-Adult, 3 = Adult, 4 = Apex Titan
    this.growthStage = 1;
    this.preyEaten = 0;
    this.preyEatenInCurrentLevel = 0;
    this.requiredPreyToEvolve = 5;

    // Body Dimensions (Scales dynamically with growth stages)
    this.numSegments = 24; // Starts juvenile (24 segments, 1.8m)
    this.segmentDistance = 0.55;
    this.baseRadius = 0.18; // Slender juvenile start
    this.segments = [];
    this.segmentMeshes = [];
    this.digestingPrey = [];

    // Physics & Locomotion
    this.position = new THREE.Vector3(0, 0.25, 0);
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.baseSpeed = 6.8;
    this.boostMultiplier = 1.65;
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

    // Strike & Cinematic Constriction State Machine
    this.isStriking = false;
    this.strikeTimer = 0;
    this.strikeDuration = 0.32;
    this.isConstricting = false;
    this.constrictionTimer = 0;
    this.constrictionDuration = 1.4; // 1.4s 3D cinematic eating scene
    this.constrictionTarget = null;
    this.tongueFlickTimer = 0;

    // High-Fidelity Textures
    this.scaleTexture = this.generateRealisticScaleTexture();
    this.bellyTexture = this.generateRealisticBellyTexture();
    this.normalTexture = this.generateScaleNormalTexture();

    this.initBody();
  }

  generateRealisticScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich olive-green jungle background with subtle depth gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, '#2b441d');
    bgGrad.addColorStop(0.5, '#355423');
    bgGrad.addColorStop(1, '#253b19');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Overlapping Diamond Keratinized Scales
    const scaleWidth = 18;
    const scaleHeight = 26;
    for (let y = 0; y < 1024; y += scaleHeight * 0.5) {
      const rowOffset = (Math.floor(y / (scaleHeight * 0.5)) % 2 === 0) ? 0 : scaleWidth * 0.5;
      for (let x = -scaleWidth; x < 1024 + scaleWidth; x += scaleWidth) {
        ctx.save();
        ctx.translate(x + rowOffset, y);

        // Individual scale gradient for 3D curved convexity
        const sGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, scaleWidth * 0.7);
        sGrad.addColorStop(0, '#4a7032');
        sGrad.addColorStop(0.6, '#385726');
        sGrad.addColorStop(1, '#1e3015');
        ctx.fillStyle = sGrad;

        ctx.beginPath();
        ctx.moveTo(0, -scaleHeight * 0.5);
        ctx.lineTo(scaleWidth * 0.5, 0);
        ctx.lineTo(0, scaleHeight * 0.5);
        ctx.lineTo(-scaleWidth * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        // Delicate scale rim highlight
        ctx.strokeStyle = 'rgba(120, 165, 85, 0.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Iconic Anaconda Dark Dorsal Oval Ocelli (Spots) with orange-yellow halos
    for (let i = 0; i < 75; i++) {
      const rx = (i * 179 + 53) % 1024;
      const ry = (i * 241 + 89) % 1024;
      const w = 28 + (i % 6) * 6;
      const h = 42 + (i % 7) * 7;
      const angle = (i * 0.5);

      // Yellow-orange halo border
      ctx.strokeStyle = 'rgba(165, 150, 60, 0.55)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(rx, ry, w + 4, h + 4, angle, 0, Math.PI * 2);
      ctx.stroke();

      // Jet-black velvet core
      ctx.fillStyle = '#0a1007';
      ctx.beginPath();
      ctx.ellipse(rx, ry, w, h, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 4);
    return tex;
  }

  generateRealisticBellyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Creamy pale yellow underbelly plates (ventral scutes)
    ctx.fillStyle = '#c7c485';
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 32) {
      const grad = ctx.createLinearGradient(0, y, 0, y + 32);
      grad.addColorStop(0, '#dad698');
      grad.addColorStop(0.8, '#b5b272');
      grad.addColorStop(1, '#8f8c54');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, 512, 30);

      // Irregular dark markings on side scutes
      if ((y / 32) % 2 === 0) {
        ctx.fillStyle = '#323d20';
        ctx.fillRect(10, y + 6, 22, 18);
        ctx.fillRect(480, y + 6, 22, 18);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  generateScaleNormalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(128, 128, 255)'; // Neutral tangent normal
    ctx.fillRect(0, 0, 512, 512);

    // Bump hills
    for (let y = 0; y < 512; y += 16) {
      for (let x = 0; x < 512; x += 16) {
        ctx.fillStyle = 'rgb(145, 110, 240)';
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  initBody() {
    // If existing group exists, remove it
    if (this.bodyGroup) {
      this.scene.remove(this.bodyGroup);
    }

    this.bodyGroup = new THREE.Group();
    this.scene.add(this.bodyGroup);

    // PBR Photorealistic Serpent Skin Material
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.scaleTexture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.28, // Wet specular sheen
      metalness: 0.12,
      color: 0x557a40
    });

    this.bellyMaterial = new THREE.MeshStandardMaterial({
      map: this.bellyTexture,
      roughness: 0.45,
      color: 0xadab74
    });

    // 1. Create Sculpted Head
    this.createSculptedHead();

    // 2. Create Continuous Segment Meshes
    this.segments = [];
    this.segmentMeshes = [];

    for (let i = 0; i < this.numSegments; i++) {
      const t = i / (this.numSegments - 1);
      let taper = 1.0;
      if (i < 3) {
        taper = 0.75 + (i / 3) * 0.25; // Narrow neck
      } else {
        // Natural tapered snake tail curve
        taper = Math.sin((1 - t) * Math.PI * 0.5) * 0.94 + 0.06;
      }

      const radius = this.baseRadius * taper;

      // High-poly tubular skin segment with continuous overlap
      const geom = new THREE.CylinderGeometry(radius * 0.92, radius * 1.05, this.segmentDistance * 1.25, 16, 2, false);
      geom.rotateX(Math.PI * 0.5);
      geom.scale(1.0, 0.78, 1.0); // Natural dorsoventrally compressed snake cross-section

      const mesh = new THREE.Mesh(geom, this.bodyMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const pos = new THREE.Vector3(0, 0.2, i * this.segmentDistance);
      mesh.position.copy(pos);

      this.bodyGroup.add(mesh);
      this.segments.push({
        position: pos,
        targetPos: pos.clone(),
        radius: radius,
        baseRadius: radius,
        taper: taper,
        rotation: new THREE.Euler()
      });
      this.segmentMeshes.push(mesh);
    }
  }

  createSculptedHead() {
    this.headGroup = new THREE.Group();
    this.bodyGroup.add(this.headGroup);

    const headScale = this.baseRadius * 1.9;

    // Sculpted Broad Cranium
    const craniumGeom = new THREE.BoxGeometry(0.85 * headScale, 0.42 * headScale, 1.35 * headScale, 4, 3, 5);
    const craniumMat = new THREE.MeshStandardMaterial({
      map: this.scaleTexture,
      normalMap: this.normalTexture,
      roughness: 0.32,
      metalness: 0.1,
      color: 0x486b36
    });
    this.craniumMesh = new THREE.Mesh(craniumGeom, craniumMat);
    this.craniumMesh.position.set(0, 0.08 * headScale, -0.45 * headScale);
    this.craniumMesh.castShadow = true;
    this.headGroup.add(this.craniumMesh);

    // Tapered Snout
    const snoutGeom = new THREE.ConeGeometry(0.42 * headScale, 0.75 * headScale, 8);
    snoutGeom.rotateX(-Math.PI * 0.5);
    snoutGeom.scale(1, 0.52, 1);
    const snoutMesh = new THREE.Mesh(snoutGeom, craniumMat);
    snoutMesh.position.set(0, 0.02 * headScale, -1.25 * headScale);
    this.headGroup.add(snoutMesh);

    // Realistic Labial Pits (Heat-sensing holes along mouth line)
    for (let side of [-1, 1]) {
      for (let p = 0; p < 3; p++) {
        const pitGeom = new THREE.BoxGeometry(0.04 * headScale, 0.03 * headScale, 0.06 * headScale);
        const pitMat = new THREE.MeshBasicMaterial({ color: 0x11160e });
        const pit = new THREE.Mesh(pitGeom, pitMat);
        pit.position.set(side * 0.42 * headScale, 0.02 * headScale, (-0.85 - p * 0.14) * headScale);
        this.headGroup.add(pit);
      }
    }

    // Specular Wet Amber Eyes with Vertical Slit Pupils
    const eyeGeom = new THREE.SphereGeometry(0.14 * headScale, 14, 14);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      roughness: 0.05,
      metalness: 0.4,
      emissive: 0x552200
    });
    
    this.leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.leftEye.position.set(0.44 * headScale, 0.18 * headScale, -0.6 * headScale);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.rightEye.position.set(-0.44 * headScale, 0.18 * headScale, -0.6 * headScale);
    this.headGroup.add(this.rightEye);

    // Vertical slit pupils
    const pupilGeom = new THREE.BoxGeometry(0.02 * headScale, 0.18 * headScale, 0.05 * headScale);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pupilL = new THREE.Mesh(pupilGeom, pupilMat);
    pupilL.position.set(0.51 * headScale, 0.18 * headScale, -0.6 * headScale);
    this.headGroup.add(pupilL);
    const pupilR = new THREE.Mesh(pupilGeom, pupilMat);
    pupilR.position.set(-0.51 * headScale, 0.18 * headScale, -0.6 * headScale);
    this.headGroup.add(pupilR);

    // Articulated Lower Jaw (Capable of 140° opening during ingestion)
    this.lowerJawGroup = new THREE.Group();
    this.lowerJawGroup.position.set(0, -0.12 * headScale, -0.2 * headScale);
    this.headGroup.add(this.lowerJawGroup);

    const jawGeom = new THREE.BoxGeometry(0.76 * headScale, 0.16 * headScale, 1.25 * headScale);
    const jawMat = new THREE.MeshStandardMaterial({
      map: this.bellyTexture,
      roughness: 0.4,
      color: 0x8a995e
    });
    const jawMesh = new THREE.Mesh(jawGeom, jawMat);
    jawMesh.position.set(0, 0, -0.55 * headScale);
    this.lowerJawGroup.add(jawMesh);

    // Sharp Recurved Fangs
    const fangGeom = new THREE.ConeGeometry(0.045 * headScale, 0.28 * headScale, 6);
    fangGeom.rotateX(0.35);
    const fangMat = new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.1 });
    
    this.leftFang = new THREE.Mesh(fangGeom, fangMat);
    this.leftFang.position.set(0.3 * headScale, 0.02 * headScale, -1.0 * headScale);
    this.headGroup.add(this.leftFang);

    this.rightFang = new THREE.Mesh(fangGeom, fangMat);
    this.rightFang.position.set(-0.3 * headScale, 0.02 * headScale, -1.0 * headScale);
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

    this.tongueGroup.position.set(0, -0.06 * headScale, -1.05 * headScale);
    this.tongueGroup.scale.set(0, 0, 0);
    this.headGroup.add(this.tongueGroup);
  }

  triggerStrike() {
    if (this.isStriking || this.isConstricting || this.stamina < 15) return;
    this.isStriking = true;
    this.strikeTimer = this.strikeDuration;
    this.stamina = Math.max(0, this.stamina - 15);
  }

  // 3D Cinematic Constriction & Swallowing Sequence
  startCinematicConstriction(targetEntity) {
    this.isConstricting = true;
    this.constrictionTimer = this.constrictionDuration;
    this.constrictionTarget = targetEntity;
    this.lowerJawGroup.rotation.x = 0.95; // Open jaw wide
  }

  swallowPrey(size = 1.0, nutrition = 20) {
    this.preyEaten++;
    this.preyEatenInCurrentLevel++;
    this.hunger = Math.min(100, this.hunger + nutrition);
    this.score += Math.round(nutrition * 15);

    // Add traveling 3D digestive bulge
    this.digestingPrey.push({
      size: Math.min(2.4, Math.max(0.65, size)),
      progress: 0,
      speed: 0.16
    });

    // Check Evolution Trigger (5 prey eaten in Level 1)
    if (this.growthStage === 1 && this.preyEaten >= 5) {
      this.evolveToStage(2);
      return true; // evolution triggered!
    } else if (this.growthStage === 2 && this.preyEaten >= 12) {
      this.evolveToStage(3);
      return true;
    } else if (this.growthStage === 3 && this.preyEaten >= 20) {
      this.evolveToStage(4);
      return true;
    }

    // Natural minor growth with every meal
    this.growContinuous(0.018 * size);
    return false;
  }

  evolveToStage(newStage) {
    this.growthStage = newStage;
    if (newStage === 2) {
      // Sub-Adult: 4.8m length, broader girth
      this.numSegments = 30;
      this.segmentDistance = 0.72;
      this.baseRadius = 0.42;
      this.baseSpeed = 7.5;
    } else if (newStage === 3) {
      // Full Adult: 9.5m length, massive predator
      this.numSegments = 36;
      this.segmentDistance = 0.88;
      this.baseRadius = 0.72;
      this.baseSpeed = 8.2;
    } else if (newStage === 4) {
      // Apex Titan: 14.0m+ length
      this.numSegments = 42;
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

      // Clamp jaw opening and mouth swallowing
      this.lowerJawGroup.rotation.x = Math.sin(progress * Math.PI) * 1.1;

      // Wrap body coils tightly around target
      if (this.constrictionTarget && this.constrictionTarget.mesh) {
        const targetPos = this.constrictionTarget.position;
        // Head moves down over prey
        this.position.lerp(targetPos, 4 * delta);
      }

      if (this.constrictionTimer <= 0) {
        this.isConstricting = false;
        this.lowerJawGroup.rotation.x = 0;
        this.constrictionTarget = null;
      }
      return; // Lock normal movement during cinematic ingestion
    }

    // 2. Normal Locomotion & Steering
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

    // Digestion weight drag
    if (this.digestingPrey.length > 0) {
      targetSpeed *= 0.84;
    }

    // Strike Lunge Burst
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

    // 3. Move Head Vector
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
      // Semi-aquatic buoyancy
      this.position.y = THREE.MathUtils.lerp(this.position.y, waterLevel - 0.04, 4 * delta);
    } else {
      this.isUnderwater = false;
      this.position.y = THREE.MathUtils.lerp(this.position.y, terrainHeight + this.baseRadius * 0.45, 8 * delta);
    }

    // Undulation phase
    if (Math.abs(this.speed) > 0.1) {
      this.wavePhase += this.speed * delta * 4.8;
    }

    // 4. Update Head Mesh
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

    // 5. Update Digestion Bulges along segments
    for (let p = this.digestingPrey.length - 1; p >= 0; p--) {
      const prey = this.digestingPrey[p];
      prey.progress += prey.speed * delta * (Math.abs(this.speed) > 0.5 ? 1.3 : 0.65);
      if (prey.progress >= this.numSegments) {
        this.digestingPrey.splice(p, 1);
      }
    }

    // 6. Inverse Kinematics (Spine follow) with Lateral Wave
    let prevPos = this.position.clone();
    const rightVec = new THREE.Vector3(-forwardVec.z, 0, forwardVec.x);

    for (let i = 0; i < this.numSegments; i++) {
      const seg = this.segments[i];
      const mesh = this.segmentMeshes[i];

      // Lateral serpentine wave displacement
      const waveOffset = Math.sin(this.wavePhase - i * 0.4) * 0.24 * Math.min(1.0, Math.abs(this.speed) / 4.0);

      const dir = new THREE.Vector3().subVectors(seg.position, prevPos);
      const dist = dir.length();
      if (dist > 0.001) {
        dir.normalize();
        seg.position.copy(prevPos).addScaledVector(dir, this.segmentDistance);
      }

      seg.position.addScaledVector(rightVec, waveOffset * delta * 5.0);

      // Terrain Hugging
      const segGroundY = world ? world.getHeightAt(seg.position.x, seg.position.z) : 0;
      const targetY = Math.max(segGroundY, waterLevel - 0.1) + seg.baseRadius * 0.4;
      seg.position.y = THREE.MathUtils.lerp(seg.position.y, targetY, 10 * delta);

      mesh.position.copy(seg.position);
      mesh.lookAt(prevPos);

      // Anatomical Swallowing Bulge Scaling
      let bulgeScale = 1.0;
      for (const prey of this.digestingPrey) {
        const distFromBulge = Math.abs(prey.progress - i);
        if (distFromBulge < 3.2) {
          const bell = Math.exp(-(distFromBulge * distFromBulge) / 2.2);
          bulgeScale += prey.size * bell * 1.45;
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
