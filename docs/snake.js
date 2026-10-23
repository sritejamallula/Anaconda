// Photorealistic 3D Green Anaconda with Continuous Spline-Lofted Skin, PBR Wet Clearcoat, and Anatomical Bulge
class AnacondaSnake {
  constructor(scene, gameAssets) {
    this.scene = scene;
    this.assets = gameAssets;

    // Growth Stages: 1 = Juvenile (1.8m), 2 = Sub-Adult (4.8m), 3 = Adult (9.5m), 4 = Apex Titan (14m+)
    this.growthStage = 1;
    this.preyEaten = 0;
    this.preyEatenInCurrentLevel = 0;

    // Continuous Spine & Mesh Parameters
    this.numSpinePoints = 28;
    this.spineDistance = 0.52;
    this.baseRadius = 0.22; // Juvenile start (1.8m)
    this.spinePoints = [];
    this.digestingPrey = [];

    // Continuous Lofted Mesh Settings
    this.numRings = 48; // 48 continuous rings along the snake body
    this.radialSegments = 16; // 16 radial vertices per ring

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

    this.initSpine();
    this.initBody();
  }

  initSpine() {
    this.spinePoints = [];
    for (let i = 0; i < this.numSpinePoints; i++) {
      this.spinePoints.push(new THREE.Vector3(0, 0.25, i * this.spineDistance));
    }
  }

  initBody() {
    if (this.bodyGroup) {
      this.scene.remove(this.bodyGroup);
    }

    this.bodyGroup = new THREE.Group();
    this.scene.add(this.bodyGroup);

    // 1. Film-Grade PBR Photorealistic Serpent Skin (MeshPhysicalMaterial)
    const skinTex = (this.assets && this.assets.textures.snakeSkin) ? this.assets.textures.snakeSkin : this.generateFallbackScaleTexture();
    
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      map: skinTex,
      roughness: 0.16, // Wet reptile skin
      metalness: 0.08,
      clearcoat: 0.95, // High-gloss liquid water layer on scales
      clearcoatRoughness: 0.06,
      reflectivity: 0.88,
      color: 0x82aa62
    });

    // 2. Build Continuous Lofted Buffer Geometry (Zero disjoint cylinders/spheres!)
    this.bodyGeometry = this.createLoftedSnakeGeometry(this.numRings, this.radialSegments);
    this.bodyMesh = new THREE.Mesh(this.bodyGeometry, this.bodyMaterial);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.bodyGroup.add(this.bodyMesh);

    // 3. Create Anatomically Sculpted Head
    this.createSculptedHead();
  }

  createLoftedSnakeGeometry(numRings, radialSegments) {
    const geom = new THREE.BufferGeometry();
    const numVertices = numRings * (radialSegments + 1);
    const numIndices = (numRings - 1) * radialSegments * 6;

    const positions = new Float32Array(numVertices * 3);
    const normals = new Float32Array(numVertices * 3);
    const uvs = new Float32Array(numVertices * 2);
    const indices = new Uint32Array(numIndices);

    // Build UVs and index buffer once
    let uvIdx = 0;
    for (let i = 0; i < numRings; i++) {
      const v = (i / (numRings - 1)) * 6.0; // Repeat scale pattern along body length
      for (let j = 0; j <= radialSegments; j++) {
        const u = j / radialSegments;
        uvs[uvIdx++] = u;
        uvs[uvIdx++] = v;
      }
    }

    let idx = 0;
    for (let i = 0; i < numRings - 1; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = (i + 1) * (radialSegments + 1) + j;
        const c = (i + 1) * (radialSegments + 1) + (j + 1);
        const d = i * (radialSegments + 1) + (j + 1);

        indices[idx++] = a;
        indices[idx++] = b;
        indices[idx++] = d;

        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }

    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return geom;
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

    // Sculpted Cranium with Organic Contours
    const craniumGeom = new THREE.SphereGeometry(0.55 * headScale, 18, 14);
    craniumGeom.scale(1.0, 0.55, 1.4);
    this.craniumMesh = new THREE.Mesh(craniumGeom, this.bodyMaterial);
    this.craniumMesh.position.set(0, 0.06 * headScale, -0.45 * headScale);
    this.craniumMesh.castShadow = true;
    this.headGroup.add(this.craniumMesh);

    // Tapered Snout
    const snoutGeom = new THREE.ConeGeometry(0.38 * headScale, 0.75 * headScale, 12);
    snoutGeom.rotateX(-Math.PI * 0.5);
    snoutGeom.scale(1, 0.5, 1);
    const snoutMesh = new THREE.Mesh(snoutGeom, this.bodyMaterial);
    snoutMesh.position.set(0, 0.02 * headScale, -1.15 * headScale);
    this.headGroup.add(snoutMesh);

    // Heat-Sensing Labial Pits
    for (let side of [-1, 1]) {
      for (let p = 0; p < 3; p++) {
        const pit = new THREE.Mesh(
          new THREE.SphereGeometry(0.025 * headScale, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0x090f06 })
        );
        pit.position.set(side * 0.38 * headScale, 0.01 * headScale, (-0.8 - p * 0.14) * headScale);
        this.headGroup.add(pit);
      }
    }

    // Wet Cornea Amber Eyes with Vertical Slit Pupils
    const eyeGeom = new THREE.SphereGeometry(0.12 * headScale, 16, 16);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffaa00,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: 0x552200
    });

    this.leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.leftEye.position.set(0.38 * headScale, 0.16 * headScale, -0.58 * headScale);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.rightEye.position.set(-0.38 * headScale, 0.16 * headScale, -0.58 * headScale);
    this.headGroup.add(this.rightEye);

    const pupilGeom = new THREE.BoxGeometry(0.018 * headScale, 0.16 * headScale, 0.04 * headScale);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pL = new THREE.Mesh(pupilGeom, pupilMat);
    pL.position.set(0.44 * headScale, 0.16 * headScale, -0.58 * headScale);
    this.headGroup.add(pL);
    const pR = new THREE.Mesh(pupilGeom, pupilMat);
    pR.position.set(-0.44 * headScale, 0.16 * headScale, -0.58 * headScale);
    this.headGroup.add(pR);

    // Articulated Lower Jaw (140° opening capability)
    this.lowerJawGroup = new THREE.Group();
    this.lowerJawGroup.position.set(0, -0.1 * headScale, -0.2 * headScale);
    this.headGroup.add(this.lowerJawGroup);

    const jawGeom = new THREE.SphereGeometry(0.45 * headScale, 14, 12);
    jawGeom.scale(0.85, 0.3, 1.4);
    const jawMesh = new THREE.Mesh(jawGeom, this.bodyMaterial);
    jawMesh.position.set(0, 0, -0.52 * headScale);
    this.lowerJawGroup.add(jawMesh);

    // Translucent Recurved Fangs
    const fangGeom = new THREE.ConeGeometry(0.04 * headScale, 0.28 * headScale, 8);
    fangGeom.rotateX(0.35);
    const fangMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      transmission: 0.4,
      ior: 1.5
    });

    this.leftFang = new THREE.Mesh(fangGeom, fangMat);
    this.leftFang.position.set(0.26 * headScale, 0.02 * headScale, -0.95 * headScale);
    this.headGroup.add(this.leftFang);

    this.rightFang = new THREE.Mesh(fangGeom, fangMat);
    this.rightFang.position.set(-0.26 * headScale, 0.02 * headScale, -0.95 * headScale);
    this.headGroup.add(this.rightFang);

    // Bifurcated Tongue
    this.tongueGroup = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02 * headScale, 0.02 * headScale, 0.45 * headScale),
      new THREE.MeshBasicMaterial({ color: 0x990022 })
    );
    stem.rotateX(-Math.PI * 0.5);
    this.tongueGroup.add(stem);

    const forkL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012 * headScale, 0.004 * headScale, 0.2 * headScale),
      new THREE.MeshBasicMaterial({ color: 0x990022 })
    );
    forkL.rotation.set(0, 0.35, -Math.PI * 0.5);
    forkL.position.set(0.05 * headScale, 0, -0.32 * headScale);
    this.tongueGroup.add(forkL);

    const forkR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012 * headScale, 0.004 * headScale, 0.2 * headScale),
      new THREE.MeshBasicMaterial({ color: 0x990022 })
    );
    forkR.rotation.set(0, -0.35, -Math.PI * 0.5);
    forkR.position.set(-0.05 * headScale, 0, -0.32 * headScale);
    this.tongueGroup.add(forkR);

    this.tongueGroup.position.set(0, -0.05 * headScale, -1.05 * headScale);
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
      speed: 0.15
    });

    // Evolution Progression (5 prey in Level 1)
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
      this.numSpinePoints = 34;
      this.spineDistance = 0.68;
      this.baseRadius = 0.42;
      this.baseSpeed = 7.5;
    } else if (newStage === 3) {
      this.numSpinePoints = 40;
      this.spineDistance = 0.85;
      this.baseRadius = 0.72;
      this.baseSpeed = 8.2;
    } else if (newStage === 4) {
      this.numSpinePoints = 46;
      this.spineDistance = 1.02;
      this.baseRadius = 1.05;
      this.baseSpeed = 9.0;
    }
    this.initSpine();
    this.initBody();
  }

  growContinuous(amount) {
    this.baseRadius += amount * 0.05;
  }

  getBulgeAt(t) {
    let bulge = 1.0;
    for (const prey of this.digestingPrey) {
      const distFromBulge = Math.abs(prey.progress - t);
      if (distFromBulge < 0.15) {
        const bell = Math.exp(-(distFromBulge * distFromBulge) / 0.005);
        bulge += prey.size * bell * 1.4;
      }
    }
    return bulge;
  }

  update(delta, input, world) {
    // 1. Constriction Freeze / Coil
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

    // Continuous natural forward slithering (Snake never freezes or stops unexpectedly)
    let targetSpeed = this.baseSpeed;
    if (input.boost && this.stamina > 0) {
      targetSpeed = this.baseSpeed * this.boostMultiplier;
      this.stamina = Math.max(0, this.stamina - 22 * delta);
    } else if (input.forward) {
      targetSpeed = this.baseSpeed * 1.35;
      this.stamina = Math.min(this.maxStamina, this.stamina + 8 * delta);
    } else if (input.backward) {
      targetSpeed = this.baseSpeed * 0.35; // Cautious stalking slow-down
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * delta);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 14 * delta);
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

    // Move Head Vector
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
      prey.progress += prey.speed * delta * (Math.abs(this.speed) > 0.5 ? 1.0 : 0.45);
      if (prey.progress >= 1.0) {
        this.digestingPrey.splice(p, 1);
      }
    }

    // 3. Update Continuous Spine Points with Inverse Kinematics
    this.spinePoints[0].copy(this.position);
    const rightVec = new THREE.Vector3(-forwardVec.z, 0, forwardVec.x);

    let prevPos = this.position.clone();
    for (let i = 1; i < this.numSpinePoints; i++) {
      const pt = this.spinePoints[i];
      const waveOffset = Math.sin(this.wavePhase - i * 0.42) * 0.26 * Math.min(1.0, Math.abs(this.speed) / 4.0);

      const dir = new THREE.Vector3().subVectors(pt, prevPos);
      const dist = dir.length();
      if (dist > 0.001) {
        dir.normalize();
        pt.copy(prevPos).addScaledVector(dir, this.spineDistance);
      }
      pt.addScaledVector(rightVec, waveOffset * delta * 5.0);

      const segGroundY = world ? world.getHeightAt(pt.x, pt.z) : 0;
      const targetY = Math.max(segGroundY, waterLevel - 0.1) + this.baseRadius * 0.4;
      pt.y = THREE.MathUtils.lerp(pt.y, targetY, 10 * delta);

      prevPos = pt.clone();
    }

    // 4. Update Continuous Lofted Tube Mesh Vertices in Real-Time!
    const curve = new THREE.CatmullRomCurve3(this.spinePoints);
    const posAttr = this.bodyGeometry.attributes.position;
    const positions = posAttr.array;
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < this.numRings; i++) {
      const t = i / (this.numRings - 1);
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      let normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Biological Taper Equation: neck -> thick midbody -> slender tail
      let taper = 1.0;
      if (t < 0.08) {
        taper = 0.72 + (t / 0.08) * 0.28;
      } else {
        taper = Math.sin((1 - t) * Math.PI * 0.5) * 0.94 + 0.06;
      }

      const bulge = this.getBulgeAt(t);
      const radius = this.baseRadius * taper * bulge;

      for (let j = 0; j <= this.radialSegments; j++) {
        const theta = (j / this.radialSegments) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        const vx = pt.x + (normal.x * cos + binormal.x * sin) * radius;
        const vy = pt.y + (normal.y * cos + binormal.y * sin) * radius * 0.78; // slightly flattened
        const vz = pt.z + (normal.z * cos + binormal.z * sin) * radius;

        const vIdx = (i * (this.radialSegments + 1) + j) * 3;
        positions[vIdx] = vx;
        positions[vIdx + 1] = vy;
        positions[vIdx + 2] = vz;
      }
    }

    posAttr.needsUpdate = true;
    this.bodyGeometry.computeVertexNormals();

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
