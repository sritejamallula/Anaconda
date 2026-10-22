// 3D Procedural Rigged Green Anaconda with Spine IK and Swallowing Bulge Deformation
class AnacondaSnake {
  constructor(scene) {
    this.scene = scene;
    this.numSegments = 32;
    this.segmentDistance = 0.85;
    this.baseRadius = 0.55;
    this.segments = [];
    this.segmentMeshes = [];
    this.digestingPrey = []; // { size, progress, speed }
    
    // Physics and Locomotion
    this.position = new THREE.Vector3(0, 0.4, 0);
    this.velocity = new THREE.Vector3();
    this.heading = 0; // Yaw angle in radians
    this.pitch = 0;   // Vertical pitch
    this.speed = 0;
    this.baseSpeed = 7.5;
    this.boostMultiplier = 1.7;
    this.turnSpeed = 2.8;
    this.wavePhase = 0;
    
    // State
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.hunger = 80; // 0-100
    this.growthLevel = 1;
    this.score = 0;
    this.isStriking = false;
    this.strikeTimer = 0;
    this.strikeDuration = 0.35;
    this.tongueFlickTimer = 0;
    this.isUnderwater = false;

    // Materials & Textures
    this.scaleTexture = this.generateScaleTexture();
    this.bellyTexture = this.generateBellyTexture();
    
    this.initBody();
  }

  generateScaleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base olive green background
    ctx.fillStyle = '#2f4a21';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle scale diamond pattern
    ctx.fillStyle = '#395928';
    for (let y = 0; y < 512; y += 16) {
      for (let x = 0; x < 512; x += 16) {
        ctx.beginPath();
        const ox = (y % 32 === 0) ? 8 : 0;
        ctx.arc(x + ox, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Iconic Anaconda Dark Oval Rosettes (Spots)
    ctx.fillStyle = '#0f180a';
    for (let i = 0; i < 48; i++) {
      const rx = (i * 97) % 512;
      const ry = (i * 131) % 512;
      const w = 18 + (i % 5) * 4;
      const h = 26 + (i % 7) * 4;
      ctx.beginPath();
      ctx.ellipse(rx, ry, w, h, (i * 0.4), 0, Math.PI * 2);
      ctx.fill();

      // Subtle yellow-orange rim
      ctx.strokeStyle = '#6e8038';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  generateBellyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b5b875';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#9e9f60';
    for (let y = 0; y < 256; y += 24) {
      ctx.fillRect(0, y, 256, 4);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  initBody() {
    this.bodyGroup = new THREE.Group();
    this.scene.add(this.bodyGroup);

    // Common Scale Material with PBR sheen
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.scaleTexture,
      roughness: 0.35,
      metalness: 0.15,
      color: 0x486b36
    });

    // 1. Create Head
    this.createHead();

    // 2. Create Segments
    for (let i = 0; i < this.numSegments; i++) {
      const t = i / (this.numSegments - 1);
      // Taper profile: wide in front-midbody, tapering down to a slender tail tip
      let taper = 1.0;
      if (i < 3) {
        taper = 0.8 + (i / 3) * 0.2; // Neck taper
      } else {
        taper = Math.sin((1 - t) * Math.PI * 0.5) * 0.95 + 0.05; // Tail taper
      }

      const radius = this.baseRadius * taper;
      const length = this.segmentDistance;

      // Elongated segment sphere/cylinder
      const geom = new THREE.SphereGeometry(radius, 14, 12);
      geom.scale(1.0, 0.8, 1.25); // Slightly flattened serpentine cross-section

      const mesh = new THREE.Mesh(geom, this.bodyMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const pos = new THREE.Vector3(0, 0.4, i * this.segmentDistance);
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

  createHead() {
    this.headGroup = new THREE.Group();
    this.bodyGroup.add(this.headGroup);

    // Cranium
    const craniumGeom = new THREE.BoxGeometry(0.75, 0.45, 1.15, 4, 3, 4);
    const craniumMat = new THREE.MeshStandardMaterial({
      map: this.scaleTexture,
      roughness: 0.4,
      metalness: 0.1,
      color: 0x3d5c2e
    });
    this.craniumMesh = new THREE.Mesh(craniumGeom, craniumMat);
    this.craniumMesh.position.set(0, 0.1, -0.4);
    this.craniumMesh.castShadow = true;
    this.headGroup.add(this.craniumMesh);

    // Snout taper
    const snoutGeom = new THREE.ConeGeometry(0.38, 0.6, 6);
    snoutGeom.rotateX(-Math.PI * 0.5);
    snoutGeom.scale(1, 0.6, 1);
    const snoutMesh = new THREE.Mesh(snoutGeom, craniumMat);
    snoutMesh.position.set(0, 0.05, -1.1);
    this.headGroup.add(snoutMesh);

    // Amber Eyes with vertical slit pupils
    const eyeGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0x442200
    });
    
    this.leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.leftEye.position.set(0.38, 0.18, -0.5);
    this.leftEye.scale.set(0.7, 1.2, 1);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    this.rightEye.position.set(-0.38, 0.18, -0.5);
    this.rightEye.scale.set(0.7, 1.2, 1);
    this.headGroup.add(this.rightEye);

    // Pupils
    const pupilGeom = new THREE.BoxGeometry(0.02, 0.14, 0.04);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
    leftPupil.position.set(0.44, 0.18, -0.5);
    this.headGroup.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
    rightPupil.position.set(-0.44, 0.18, -0.5);
    this.headGroup.add(rightPupil);

    // Lower Jaw (Hinged for strike/bite)
    const jawGeom = new THREE.BoxGeometry(0.68, 0.18, 1.1);
    const jawMat = new THREE.MeshStandardMaterial({
      map: this.bellyTexture,
      roughness: 0.5,
      color: 0x859654
    });
    this.lowerJaw = new THREE.Mesh(jawGeom, jawMat);
    this.lowerJaw.position.set(0, -0.15, -0.4);
    this.headGroup.add(this.lowerJaw);

    // Recurved Fangs inside mouth
    const fangGeom = new THREE.ConeGeometry(0.04, 0.22, 6);
    fangGeom.rotateX(0.3);
    const fangMat = new THREE.MeshStandardMaterial({ color: 0xffffee, roughness: 0.1 });
    
    const leftFang = new THREE.Mesh(fangGeom, fangMat);
    leftFang.position.set(0.25, -0.02, -0.85);
    this.headGroup.add(leftFang);

    const rightFang = new THREE.Mesh(fangGeom, fangMat);
    rightFang.position.set(-0.25, -0.02, -0.85);
    this.headGroup.add(rightFang);

    // Bifurcated (Forked) Tongue
    this.tongueGroup = new THREE.Group();
    const tongueStemGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.45);
    tongueStemGeom.rotateX(-Math.PI * 0.5);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0x880022 });
    const stem = new THREE.Mesh(tongueStemGeom, tongueMat);
    this.tongueGroup.add(stem);

    const forkLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.005, 0.2), tongueMat);
    forkLeft.rotation.set(0, 0.35, -Math.PI * 0.5);
    forkLeft.position.set(0.05, 0, -0.3);
    this.tongueGroup.add(forkLeft);

    const forkRight = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.005, 0.2), tongueMat);
    forkRight.rotation.set(0, -0.35, -Math.PI * 0.5);
    forkRight.position.set(-0.05, 0, -0.3);
    this.tongueGroup.add(forkRight);

    this.tongueGroup.position.set(0, -0.08, -0.9);
    this.tongueGroup.scale.set(0, 0, 0); // hidden initially
    this.headGroup.add(this.tongueGroup);
  }

  triggerStrike() {
    if (this.isStriking || this.stamina < 15) return;
    this.isStriking = true;
    this.strikeTimer = this.strikeDuration;
    this.stamina = Math.max(0, this.stamina - 18);
  }

  swallowPrey(size = 1.0, nutritionalValue = 20) {
    this.digestingPrey.push({
      size: Math.min(2.2, Math.max(0.6, size)),
      progress: 0,
      speed: 0.12 // segments per second
    });
    this.hunger = Math.min(100, this.hunger + nutritionalValue);
    this.score += Math.round(nutritionalValue * 10);
    this.grow(0.04 * size);
  }

  grow(amount) {
    this.baseRadius += amount * 0.08;
    this.growthLevel += amount * 0.1;
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].baseRadius = this.baseRadius * this.segments[i].taper;
    }
  }

  hasDigestingPrey() {
    return this.digestingPrey.length > 0;
  }

  update(delta, input, world) {
    // 1. Steering & Rotation
    if (input.left) {
      this.heading += this.turnSpeed * delta;
    }
    if (input.right) {
      this.heading -= this.turnSpeed * delta;
    }

    // 2. Speed and Stamina Management
    let targetSpeed = 0;
    if (input.forward) {
      targetSpeed = this.baseSpeed;
      if (input.boost && this.stamina > 0) {
        targetSpeed *= this.boostMultiplier;
        this.stamina = Math.max(0, this.stamina - 24 * delta);
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina + 10 * delta);
      }
    } else if (input.backward) {
      targetSpeed = -this.baseSpeed * 0.45;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 15 * delta);
    }

    // Weight of digestion causes slight sluggishness
    if (this.digestingPrey.length > 0) {
      targetSpeed *= 0.82;
    }

    // Strike acceleration burst
    if (this.isStriking) {
      this.strikeTimer -= delta;
      targetSpeed = this.baseSpeed * 2.8;
      this.lowerJaw.rotation.x = 0.65; // Open wide for strike
      if (this.strikeTimer <= 0) {
        this.isStriking = false;
        this.lowerJaw.rotation.x = 0;
      }
    } else {
      this.lowerJaw.rotation.x = Math.max(0, this.lowerJaw.rotation.x - delta * 3);
    }

    // Smooth speed transition
    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, 6 * delta);

    // 3. Move Head Position
    const moveDist = this.speed * delta;
    const forwardVec = new THREE.Vector3(
      -Math.sin(this.heading),
      0,
      -Math.cos(this.heading)
    );

    this.position.addScaledVector(forwardVec, moveDist);

    // Terrain Elevation / Water swimming check
    const terrainHeight = world ? world.getHeightAt(this.position.x, this.position.z) : 0;
    const waterLevel = 0.2;
    if (terrainHeight < waterLevel) {
      this.isUnderwater = true;
      // Semi-submerged swimming
      this.position.y = THREE.MathUtils.lerp(this.position.y, waterLevel - 0.05, 4 * delta);
    } else {
      this.isUnderwater = false;
      this.position.y = THREE.MathUtils.lerp(this.position.y, terrainHeight + this.baseRadius * 0.4, 8 * delta);
    }

    // Undulation wave phase
    if (Math.abs(this.speed) > 0.1) {
      this.wavePhase += this.speed * delta * 4.5;
    }

    // 4. Update Head Mesh Transform
    this.headGroup.position.copy(this.position);
    this.headGroup.rotation.y = this.heading;

    // Forked Tongue Flicking logic
    this.tongueFlickTimer += delta;
    if (this.tongueFlickTimer > 3.2) {
      const flickTime = this.tongueFlickTimer - 3.2;
      if (flickTime < 0.6) {
        const scale = Math.sin(flickTime / 0.6 * Math.PI);
        this.tongueGroup.scale.set(scale, scale, scale);
      } else {
        this.tongueGroup.scale.set(0, 0, 0);
        this.tongueFlickTimer = 0;
      }
    }

    // 5. Update Digestion Bulges along segments
    for (let p = this.digestingPrey.length - 1; p >= 0; p--) {
      const prey = this.digestingPrey[p];
      prey.progress += prey.speed * delta * (Math.abs(this.speed) > 0.5 ? 1.4 : 0.6);
      if (prey.progress >= this.numSegments) {
        this.digestingPrey.splice(p, 1);
      }
    }

    // 6. Inverse Kinematics (Spine follow) & Bulge Deformation
    let prevPos = this.position.clone();
    for (let i = 0; i < this.numSegments; i++) {
      const seg = this.segments[i];
      const mesh = this.segmentMeshes[i];

      // Lateral serpentine wave displacement
      const waveOffset = Math.sin(this.wavePhase - i * 0.38) * 0.22 * Math.min(1.0, Math.abs(this.speed) / 4.0);
      const rightVec = new THREE.Vector3(-forwardVec.z, 0, forwardVec.x);

      // Distance constraint to previous segment
      const dir = new THREE.Vector3().subVectors(seg.position, prevPos);
      const dist = dir.length();
      if (dist > 0.001) {
        dir.normalize();
        seg.position.copy(prevPos).addScaledVector(dir, this.segmentDistance);
      }

      // Add undulating lateral sway
      seg.position.addScaledVector(rightVec, waveOffset * delta * 5.0);

      // Terrain hugging
      const segGroundY = world ? world.getHeightAt(seg.position.x, seg.position.z) : 0;
      const targetY = Math.max(segGroundY, waterLevel - 0.1) + seg.baseRadius * 0.35;
      seg.position.y = THREE.MathUtils.lerp(seg.position.y, targetY, 10 * delta);

      // Orientation tangent to next point
      mesh.position.copy(seg.position);
      mesh.lookAt(prevPos);

      // Calculate Swallowing Bulge Expansion for segment i
      let bulgeScale = 1.0;
      for (const prey of this.digestingPrey) {
        const distFromBulge = Math.abs(prey.progress - i);
        if (distFromBulge < 3.5) {
          // Gaussian bell curve deformation
          const bell = Math.exp(-(distFromBulge * distFromBulge) / 2.5);
          bulgeScale += prey.size * bell * 1.35;
        }
      }

      // Apply dynamic scale deformation
      mesh.scale.set(bulgeScale, bulgeScale * 0.85, bulgeScale * 1.15);

      prevPos = seg.position.clone();
    }

    // Hunger drain
    this.hunger = Math.max(0, this.hunger - delta * 0.25);
    if (this.hunger <= 0) {
      this.health = Math.max(0, this.health - delta * 1.8);
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
