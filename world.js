// Photorealistic Multi-Level Amazon World Generator with Photographic PBR Textures & Water
class AmazonWorld {
  constructor(scene, gameAssets, renderer) {
    this.scene = scene;
    this.assets = gameAssets;
    this.renderer = renderer;
    this.currentLevel = 1;
    this.waterLevel = 0.2;
    this.foliageGroup = null;
    this.terrainMesh = null;
    this.waterMesh = null;
    this.gatewayGroup = null;
    this.lilyPads = [];
    this.fallenLogs = [];
    this.riverRocks = [];

    this.initAtmosphere();
    this.loadLevel(1);
  }

  loadLevel(levelNumber) {
    this.currentLevel = levelNumber;

    if (this.terrainMesh) this.scene.remove(this.terrainMesh);
    if (this.waterMesh) this.scene.remove(this.waterMesh);
    if (this.foliageGroup) this.scene.remove(this.foliageGroup);
    if (this.gatewayGroup) this.scene.remove(this.gatewayGroup);

    for (const lp of this.lilyPads) this.scene.remove(lp);
    for (const log of this.fallenLogs) this.scene.remove(log);
    for (const rock of this.riverRocks) this.scene.remove(rock);
    this.lilyPads = [];
    this.fallenLogs = [];
    this.riverRocks = [];

    if (this.currentLevel === 1) {
      this.worldSize = 65; // Small nursery pond
    } else if (this.currentLevel === 2) {
      this.worldSize = 260; // Vast Tapajós river basin
    } else {
      this.worldSize = 220; // Flooded blackwater forest
    }

    this.initTerrain();
    this.initPhotorealisticWater();
    this.initVegetation();

    if (this.currentLevel === 1) {
      this.initRiverGateway();
    }
  }

  getHeightAt(x, z) {
    const half = this.worldSize * 0.5;
    const distFromCenter = Math.hypot(x, z);

    if (this.currentLevel === 1) {
      if (Math.abs(x) > half - 4 || Math.abs(z) > half - 4) {
        return 4.5;
      }
      const creekCenter = Math.sin(z * 0.1) * 6;
      const distFromCreek = Math.abs(x - creekCenter);

      if (distFromCenter < 9) {
        return 0.5 + Math.cos(distFromCenter / 9 * Math.PI * 0.5) * 0.45;
      }
      if (distFromCreek < 7) {
        return -0.25 - (1 - distFromCreek / 7) * 0.5;
      }
      return 0.45 + Math.sin(x * 0.3) * 0.15;
    } else if (this.currentLevel === 2) {
      if (Math.abs(x) > half - 10 || Math.abs(z) > half - 10) {
        return 7.0;
      }
      const riverCenter = Math.sin(z * 0.035) * 35 + Math.cos(z * 0.012) * 18;
      const distFromRiver = Math.abs(x - riverCenter);

      const islandDist = Math.hypot(x - riverCenter, z + 30);
      if (islandDist < 18) {
        return 0.85 + Math.cos(islandDist / 18 * Math.PI * 0.5) * 1.3;
      }

      const island2Dist = Math.hypot(x - (riverCenter + 8), z - 55);
      if (island2Dist < 15) {
        return 0.75 + Math.cos(island2Dist / 15 * Math.PI * 0.5) * 1.1;
      }

      if (distFromRiver < 24) {
        const bedDepth = (1 - (distFromRiver / 24)) * 2.8;
        return -0.4 - bedDepth;
      } else if (distFromRiver < 38) {
        const t = (distFromRiver - 24) / 14;
        return -0.4 + t * 2.0;
      } else {
        return 1.6 + Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.8;
      }
    } else {
      if (Math.abs(x) > half - 8 || Math.abs(z) > half - 8) {
        return 6.0;
      }
      const mound = Math.sin(x * 0.12) * Math.cos(z * 0.12);
      if (mound > 0.4) {
        return 0.45;
      }
      return -1.2;
    }
  }

  initTerrain() {
    const segments = this.currentLevel === 1 ? 72 : 140;
    const geom = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segments, segments);
    geom.rotateX(-Math.PI * 0.5);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getHeightAt(x, z));
    }
    geom.computeVertexNormals();

    let terrainTex = null;
    if (this.assets && this.assets.textures) {
      if (this.currentLevel === 1) terrainTex = this.assets.textures.terrainLevel1;
      else if (this.currentLevel === 2) terrainTex = this.assets.textures.terrainLevel2;
      else terrainTex = this.assets.textures.terrainLevel3;
    }

    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      color: 0x98af90,
      roughness: 0.85,
      metalness: 0.04
    });

    this.terrainMesh = new THREE.Mesh(geom, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  initPhotorealisticWater() {
    const segments = this.currentLevel === 1 ? 50 : 80;
    this.waterGeom = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segments, segments);
    this.waterGeom.rotateX(-Math.PI * 0.5);
    this.waterInitialPositions = new Float32Array(this.waterGeom.attributes.position.array);

    // Film-Grade Optical Water Shader (MeshPhysicalMaterial with Optical Depth)
    this.waterMat = new THREE.MeshPhysicalMaterial({
      color: this.currentLevel === 3 ? 0x07150e : 0x143c2a,
      roughness: 0.05,
      metalness: 0.08,
      transmission: 0.72,
      ior: 1.333,
      transparent: true,
      opacity: 0.88,
      reflectivity: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    this.waterMesh = new THREE.Mesh(this.waterGeom, this.waterMat);
    this.waterMesh.position.y = this.waterLevel;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  initVegetation() {
    this.foliageGroup = new THREE.Group();
    this.scene.add(this.foliageGroup);

    // Natural PBR Materials
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1a,
      roughness: 0.92,
      metalness: 0.04
    });
    const palmFrondMat = new THREE.MeshStandardMaterial({
      color: 0x276321,
      roughness: 0.42,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
    const canopyLeafMat = new THREE.MeshStandardMaterial({
      color: 0x1e501b,
      roughness: 0.38,
      metalness: 0.03,
      side: THREE.DoubleSide
    });
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x32782b,
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    const vineMat = new THREE.MeshStandardMaterial({
      color: 0x1d4718,
      roughness: 0.88
    });
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x2e2318,
      roughness: 0.95
    });
    const lilyMat = new THREE.MeshPhysicalMaterial({
      color: 0x226428,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide
    });
    const lilyRimMat = new THREE.MeshStandardMaterial({
      color: 0x5a1e28, // Distinctive reddish-maroon outer rim
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xfff0f5, // Amazon white/soft pink lotus petals
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x333d32,
      roughness: 0.35, // Wet riverbed sheen
      metalness: 0.08
    });

    if (this.currentLevel === 1) {
      // 1. Stately Emergent Rainforest Canopy Trees (Buttress roots & tiered crowns)
      const numCanopy = 18;
      for (let i = 0; i < numCanopy; i++) {
        const angle = (i / numCanopy) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const dist = 22 + (Math.random() - 0.5) * 8;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = this.getHeightAt(x, z);

        const tree = this.createCanopyTree(trunkMat, canopyLeafMat, vineMat, 7.5 + Math.random() * 3.5);
        tree.position.set(x, y, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        this.foliageGroup.add(tree);
      }

      // 2. Elegant Amazonian Moriche Palms (Arching pinnate fronds & drooping coconut clusters)
      const numPalms = 22;
      for (let i = 0; i < numPalms; i++) {
        const angle = (i / numPalms) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const dist = 16 + (Math.random() - 0.5) * 10;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = this.getHeightAt(x, z);

        if (y > 0.3) {
          const palm = this.createAmazonPalmTree(trunkMat, palmFrondMat, 5.5 + Math.random() * 3.0);
          palm.position.set(x, y, z);
          palm.rotation.y = Math.random() * Math.PI * 2;
          this.foliageGroup.add(palm);
        }
      }

      // 3. Dense Riverbank Sword Ferns (Clustered along damp muddy shorelines)
      for (let i = 0; i < 35; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = 9 + Math.random() * 14;
        const fx = Math.cos(ang) * r;
        const fz = Math.sin(ang) * r;
        const fy = this.getHeightAt(fx, fz);
        if (fy > 0.25 && fy < 1.4) {
          const fern = this.createAmazonFern(fernMat, 0.7 + Math.random() * 0.6);
          fern.position.set(fx, fy, fz);
          fern.rotation.y = Math.random() * Math.PI * 2;
          this.foliageGroup.add(fern);
        }
      }

      // 4. Smooth Riverbed Boulders along shorelines
      for (let i = 0; i < 24; i++) {
        const rock = this.createRiverRock(rockMat, 0.45 + Math.random() * 0.75);
        const ang = Math.random() * Math.PI * 2;
        const r = 7 + Math.random() * 16;
        const rx = Math.cos(ang) * r;
        const rz = Math.sin(ang) * r;
        const ry = this.getHeightAt(rx, rz);
        rock.position.set(rx, ry + 0.1, rz);
        this.scene.add(rock);
        this.riverRocks.push(rock);
      }

      // 5. Half-Submerged Mossy Driftwood Logs
      const logs = [
        { x: 4, z: -3, rotY: 0.52, len: 11 },
        { x: -5, z: 6, rotY: -0.65, len: 9 },
        { x: 7, z: 9, rotY: 1.15, len: 8 }
      ];
      for (const l of logs) {
        const log = this.createDriftwoodLog(logMat, l.len);
        log.rotation.y = l.rotY;
        const gy = this.getHeightAt(l.x, l.z);
        log.position.set(l.x, Math.max(gy, this.waterLevel) + 0.22, l.z);
        this.scene.add(log);
        this.fallenLogs.push(log);
      }

      // 6. Giant Victoria Amazonica Water Lilies with Lotus Blossoms
      for (let i = 0; i < 18; i++) {
        const lily = this.createVictoriaAmazonica(lilyMat, lilyRimMat, flowerMat, 0.85 + Math.random() * 0.65);
        lily.position.set((Math.random() - 0.5) * 26, this.waterLevel + 0.02, (Math.random() - 0.5) * 26);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }
    } else if (this.currentLevel === 2) {
      // Level 2: Vast Tapajós River Crossing with Dense Jungle Shorelines
      for (let i = 0; i < 110; i++) {
        const x = (Math.random() - 0.5) * (this.worldSize - 35);
        const z = (Math.random() - 0.5) * (this.worldSize - 35);
        const y = this.getHeightAt(x, z);

        if (y > 0.45) {
          const isPalm = Math.random() > 0.45;
          const tree = isPalm 
            ? this.createAmazonPalmTree(trunkMat, palmFrondMat, 6.5 + Math.random() * 4.5)
            : this.createCanopyTree(trunkMat, canopyLeafMat, vineMat, 9.5 + Math.random() * 6.5);
          tree.position.set(x, y, z);
          tree.rotation.y = Math.random() * Math.PI * 2;
          this.foliageGroup.add(tree);
        }
      }

      for (let i = 0; i < 60; i++) {
        const z = (Math.random() - 0.5) * (this.worldSize - 45);
        const riverCenter = Math.sin(z * 0.035) * 35 + Math.cos(z * 0.012) * 18;
        const x = riverCenter + (Math.random() - 0.5) * 28;
        const y = this.getHeightAt(x, z);

        if (y < this.waterLevel) {
          const lily = this.createVictoriaAmazonica(lilyMat, lilyRimMat, flowerMat, 1.3 + Math.random() * 1.5);
          lily.position.set(x, this.waterLevel + 0.02, z);
          this.scene.add(lily);
          this.lilyPads.push(lily);
        }
      }
    } else {
      // Level 3: Flooded Blackwater Forest
      for (let i = 0; i < 85; i++) {
        const x = (Math.random() - 0.5) * (this.worldSize - 30);
        const z = (Math.random() - 0.5) * (this.worldSize - 30);
        const tree = this.createCanopyTree(trunkMat, canopyLeafMat, vineMat, 12 + Math.random() * 6.5);
        tree.position.set(x, -0.2, z);
        this.foliageGroup.add(tree);
      }
      for (let i = 0; i < 45; i++) {
        const lily = this.createVictoriaAmazonica(lilyMat, lilyRimMat, flowerMat, 1.8 + Math.random() * 1.6);
        lily.position.set((Math.random() - 0.5) * 170, this.waterLevel + 0.02, (Math.random() - 0.5) * 170);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }
    }
  }

  // 1. Realistic Amazon Moriche Palm Tree (Mauritia flexuosa) with Arching Pinnate Fronds
  createAmazonPalmTree(trunkMat, frondMat, height = 6.5) {
    const palm = new THREE.Group();

    // Tapered, curved segmented trunk
    const trunkSegments = 5;
    const segHeight = height / trunkSegments;
    let currY = 0;
    let currX = 0;
    const lean = (Math.random() - 0.5) * 0.14;

    for (let s = 0; s < trunkSegments; s++) {
      const rBottom = 0.38 - s * 0.038;
      const rTop = 0.38 - (s + 1) * 0.038;
      const segGeom = new THREE.CylinderGeometry(rTop, rBottom, segHeight, 9);
      segGeom.translate(currX + lean * segHeight * 0.5, currY + segHeight * 0.5, 0);
      const segMesh = new THREE.Mesh(segGeom, trunkMat);
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      palm.add(segMesh);

      // Ring collar
      const ringGeom = new THREE.TorusGeometry(rBottom * 1.08, 0.022, 6, 12);
      ringGeom.rotateX(Math.PI * 0.5);
      const ringMesh = new THREE.Mesh(ringGeom, trunkMat);
      ringMesh.position.set(currX, currY, 0);
      palm.add(ringMesh);

      currY += segHeight;
      currX += lean * segHeight;
    }

    // Arching Pinnate Palm Fronds (14 drooping fan blades radiating from crown)
    const crown = new THREE.Group();
    crown.position.set(currX, currY, 0);

    const numFronds = 14;
    for (let f = 0; f < numFronds; f++) {
      const fAngle = (f / numFronds) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.rotation.y = fAngle;

      const frondLen = height * 0.52;
      // Curved spine
      const frondGeom = new THREE.PlaneGeometry(frondLen * 0.32, frondLen, 3, 5);
      frondGeom.translate(0, frondLen * 0.5, 0);
      frondGeom.rotateX(0.72 + (f % 2) * 0.15); // Arch down gracefully
      const frondMesh = new THREE.Mesh(frondGeom, frondMat);
      frondMesh.castShadow = true;
      frondGroup.add(frondMesh);

      crown.add(frondGroup);
    }

    // Palm Fruit Bunch
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0x4a2e12, roughness: 0.8 });
    for (let b = 0; b < 3; b++) {
      const bunch = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), fruitMat);
      const bAng = (b / 3) * Math.PI * 2;
      bunch.position.set(Math.cos(bAng) * 0.28, -0.25, Math.sin(bAng) * 0.28);
      crown.add(bunch);
    }

    palm.add(crown);
    return palm;
  }

  // 2. Giant Emergent Amazon Rainforest Canopy Tree (Ceiba / Kapok) with Buttress Roots & Tiered Foliage
  createCanopyTree(trunkMat, leafMat, vineMat, height = 9.5) {
    const tree = new THREE.Group();

    // A. Buttress Roots (4 sprawling root buttresses anchoring into soil)
    for (let r = 0; r < 4; r++) {
      const rootAngle = (r / 4) * Math.PI * 2 + 0.25;
      const rootGeom = new THREE.BoxGeometry(0.18, height * 0.35, height * 0.32);
      rootGeom.translate(0, height * 0.175, height * 0.16);
      const rootMesh = new THREE.Mesh(rootGeom, trunkMat);
      rootMesh.rotation.y = rootAngle;
      rootMesh.castShadow = true;
      rootMesh.receiveShadow = true;
      tree.add(rootMesh);
    }

    // B. Organic Buttressed Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.38, 0.95, height * 0.75, 10);
    trunkGeom.translate(0, height * 0.375, 0);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // C. Forked Main Branches
    const crown = new THREE.Group();
    crown.position.y = height * 0.72;

    const branches = [
      { ang: 0, pitch: 0.55, len: height * 0.38 },
      { ang: 2.1, pitch: 0.6, len: height * 0.42 },
      { ang: 4.2, pitch: 0.52, len: height * 0.36 }
    ];

    for (const b of branches) {
      const bGroup = new THREE.Group();
      bGroup.rotation.y = b.ang;

      const branchGeom = new THREE.CylinderGeometry(0.14, 0.26, b.len, 7);
      branchGeom.translate(0, b.len * 0.5, 0);
      branchGeom.rotateZ(b.pitch);
      const branchMesh = new THREE.Mesh(branchGeom, trunkMat);
      branchMesh.castShadow = true;
      bGroup.add(branchMesh);

      // Tiered Horizontal Canopy Umbrella Clusters (Layered tropical leaves)
      const canopyCluster = new THREE.Group();
      const endX = Math.sin(b.pitch) * b.len;
      const endY = Math.cos(b.pitch) * b.len;
      canopyCluster.position.set(-endX, endY, 0);

      const numLayers = 3;
      for (let l = 0; l < numLayers; l++) {
        const radius = height * (0.34 - l * 0.05);
        const discGeom = new THREE.CylinderGeometry(radius, radius * 1.25, 0.22, 10);
        discGeom.scale(1.15, 0.65, 1.15);
        const discMesh = new THREE.Mesh(discGeom, leafMat);
        discMesh.position.y = l * 0.55;
        discMesh.rotation.y = l * 0.45;
        discMesh.castShadow = true;
        canopyCluster.add(discMesh);
      }
      bGroup.add(canopyCluster);
      crown.add(bGroup);
    }

    tree.add(crown);

    // D. Hanging Amazonian Lianas / Vines
    if (height > 6) {
      const numVines = 4;
      for (let v = 0; v < numVines; v++) {
        const vAngle = (v / numVines) * Math.PI * 2;
        const vDist = height * 0.32;
        const vineLen = height * (0.45 + Math.random() * 0.35);
        const vineGeom = new THREE.CylinderGeometry(0.022, 0.015, vineLen, 6);
        vineGeom.translate(0, -vineLen * 0.5, 0);
        const vine = new THREE.Mesh(vineGeom, vineMat);
        vine.position.set(Math.cos(vAngle) * vDist, height * 0.85, Math.sin(vAngle) * vDist);
        tree.add(vine);
      }
    }

    return tree;
  }

  // 3. Dense Amazon Sword Fern (Nephrolepis)
  createAmazonFern(fernMat, scale = 1.0) {
    const fern = new THREE.Group();
    const numFronds = 8;
    for (let i = 0; i < numFronds; i++) {
      const ang = (i / numFronds) * Math.PI * 2;
      const frondGeom = new THREE.PlaneGeometry(0.35 * scale, 1.4 * scale, 2, 4);
      frondGeom.translate(0, 0.7 * scale, 0);
      frondGeom.rotateX(0.75); // Arch outward toward ground
      const frond = new THREE.Mesh(frondGeom, fernMat);
      frond.rotation.y = ang;
      frond.castShadow = true;
      fern.add(frond);
    }
    return fern;
  }

  // 4. Giant Victoria Amazonica Water Lily with Lotus Blossom
  createVictoriaAmazonica(lilyMat, rimMat, flowerMat, radius = 1.2) {
    const lily = new THREE.Group();

    // Circular Pad
    const padGeom = new THREE.CylinderGeometry(radius, radius, 0.04, 24);
    const pad = new THREE.Mesh(padGeom, lilyMat);
    lily.add(pad);

    // Vertical Red/Purple Rim with V-notch
    const rimGeom = new THREE.CylinderGeometry(radius, radius, 0.16, 24, 1, true, 0.15, Math.PI * 1.9);
    rimGeom.translate(0, 0.08, 0);
    const rim = new THREE.Mesh(rimGeom, rimMat);
    lily.add(rim);

    // Amazon Water Lily / Lotus Blossom in center (on 40% of pads)
    if (Math.random() > 0.6) {
      const flower = new THREE.Group();
      flower.position.y = 0.05;

      // Petals radiating out
      for (let p = 0; p < 8; p++) {
        const pAng = (p / 8) * Math.PI * 2;
        const petalGeom = new THREE.ConeGeometry(0.14 * radius, 0.35 * radius, 5);
        petalGeom.rotateZ(0.65);
        const petal = new THREE.Mesh(petalGeom, flowerMat);
        petal.rotation.y = pAng;
        flower.add(petal);
      }

      // Golden center stamen
      const stamenMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.1 * radius, 8, 8), stamenMat);
      stamen.position.y = 0.06;
      flower.add(stamen);

      lily.add(flower);
    }

    return lily;
  }

  // 5. Weathered Riverbed Driftwood Log
  createDriftwoodLog(logMat, length = 8) {
    const log = new THREE.Group();
    const bodyGeom = new THREE.CylinderGeometry(0.38, 0.52, length, 10);
    bodyGeom.rotateZ(Math.PI * 0.5);
    const body = new THREE.Mesh(bodyGeom, logMat);
    body.castShadow = true;
    body.receiveShadow = true;
    log.add(body);

    // Broken branch stubs
    for (let i = 0; i < 3; i++) {
      const stubGeom = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6);
      stubGeom.rotateX(0.7);
      const stub = new THREE.Mesh(stubGeom, logMat);
      stub.position.set((i - 1) * (length * 0.28), 0.25, 0);
      stub.rotation.y = i * 1.4;
      log.add(stub);
    }

    return log;
  }

  // 6. Smooth Riverbed Boulder with Wet Specular Sheen
  createRiverRock(rockMat, size = 0.6) {
    const rockGeom = new THREE.DodecahedronGeometry(size, 1);
    rockGeom.scale(1.2, 0.65, 1.0);
    const rock = new THREE.Mesh(rockGeom, rockMat);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  initRiverGateway() {
    this.gatewayGroup = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3d2919, roughness: 0.85 });
    const totemMat = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.7 });
    const barrierMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.35,
      transmission: 0.6,
      wireframe: true
    });

    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 8.5, 12), pillarMat);
    pL.position.set(-6, 3.2, 27);
    pL.castShadow = true;
    this.gatewayGroup.add(pL);

    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 8.5, 12), pillarMat);
    pR.position.set(6, 3.2, 27);
    pR.castShadow = true;
    this.gatewayGroup.add(pR);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 1.2), totemMat);
    lintel.position.set(0, 7.2, 27);
    lintel.castShadow = true;
    this.gatewayGroup.add(lintel);

    this.barrierMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.5), barrierMat);
    this.barrierMesh.position.set(0, 3.2, 27);
    this.gatewayGroup.add(this.barrierMesh);

    this.scene.add(this.gatewayGroup);
  }

  unlockGateway() {
    if (this.barrierMesh) {
      this.barrierMesh.material.color.setHex(0x55ffaa);
      this.barrierMesh.material.opacity = 0.12;
      this.barrierMesh.visible = false;
    }
  }

  initAtmosphere() {
    // 1. PBR Environment Lighting (Amazon Equirectangular Sky)
    if (this.assets && this.assets.createEquirectangularSky) {
      try {
        const { skyTex, envMap } = this.assets.createEquirectangularSky(this.renderer);
        if (skyTex) this.scene.background = skyTex;
        if (envMap) this.scene.environment = envMap;
      } catch (e) {
        console.warn('Sky/Environment generation fallback:', e);
        this.scene.background = new THREE.Color(0x0e2417);
      }
    }

    // 2. Directional Golden Amazon Sunlight
    const amb = new THREE.AmbientLight(0x284732, 1.35);
    this.scene.add(amb);

    this.sunLight = new THREE.DirectionalLight(0xfffae6, 2.4);
    this.sunLight.position.set(40, 75, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 200;
    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    // 3. Atmospheric Rainforest Haze & Humidity
    this.scene.fog = new THREE.FogExp2(0x0e2417, 0.009);

    // 4. Floating Rainforest Sun Motes & River Mist Particles
    this.initAtmosphericMist();
  }

  initAtmosphericMist() {
    const particleCount = 200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * (this.worldSize * 0.9);
      positions[i * 3 + 1] = 0.6 + Math.random() * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * (this.worldSize * 0.9);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfff6c8,
      size: 0.28,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.mistParticles = new THREE.Points(geom, mat);
    this.scene.add(this.mistParticles);
  }

  update(delta) {
    // 1. Animate Water Surface Ripples (Multi-Frequency Amazon Flow)
    if (this.waterGeom && this.waterInitialPositions) {
      const pos = this.waterGeom.attributes.position;
      const count = pos.count;
      const time = Date.now() * 0.0024;

      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const origY = this.waterInitialPositions[i * 3 + 1];
        const wave = Math.sin(u * 0.52 + time * 1.1) * 0.042
                   + Math.cos(v * 0.38 + time * 0.85) * 0.032
                   + Math.sin((u + v) * 0.65 + time * 1.3) * 0.018;
        pos.setY(i, origY + wave);
      }
      pos.needsUpdate = true;
      this.waterGeom.computeVertexNormals();
    }

    // 2. Animate Floating Victoria Amazonica Lilies
    for (let i = 0; i < this.lilyPads.length; i++) {
      const lily = this.lilyPads[i];
      lily.position.y = this.waterLevel + 0.02 + Math.sin(Date.now() * 0.0018 + i * 0.7) * 0.015;
      lily.rotation.y += delta * 0.01;
    }

    // 3. Animate Floating Sun Motes & River Mist Particles
    if (this.mistParticles) {
      const pos = this.mistParticles.geometry.attributes.position;
      const count = pos.count;
      const time = Date.now() * 0.0008;

      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) + Math.sin(time + i) * 0.004;
        if (y < 0.5) y = 6.5;
        if (y > 7.0) y = 0.6;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    if (this.barrierMesh && this.barrierMesh.visible) {
      this.barrierMesh.rotation.y = Math.sin(Date.now() * 0.0025) * 0.06;
    }
  }
}

window.AmazonWorld = AmazonWorld;