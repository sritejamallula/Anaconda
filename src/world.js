// Realistic Multi-Level Amazon World Generator (Nursery Island -> Vast River Crossing -> Flooded Forest)
class AmazonWorld {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 1;
    this.waterLevel = 0.2;
    this.foliageGroup = null;
    this.terrainMesh = null;
    this.waterMesh = null;
    this.gatewayMesh = null;
    this.lilyPads = [];
    this.fallenLogs = [];
    this.waterSplashes = [];

    this.initAtmosphere();
    this.loadLevel(1);
  }

  loadLevel(levelNumber) {
    this.currentLevel = levelNumber;

    // Clean up previous level geometry
    if (this.terrainMesh) this.scene.remove(this.terrainMesh);
    if (this.waterMesh) this.scene.remove(this.waterMesh);
    if (this.foliageGroup) this.scene.remove(this.foliageGroup);
    if (this.gatewayMesh) this.scene.remove(this.gatewayMesh);

    for (const lp of this.lilyPads) this.scene.remove(lp);
    for (const log of this.fallenLogs) this.scene.remove(log);
    this.lilyPads = [];
    this.fallenLogs = [];

    // Map sizing based on Level
    if (this.currentLevel === 1) {
      // Level 1: "The Shallows" - Tiny enclosed nursery mudbank (65m x 65m)
      this.worldSize = 65;
    } else if (this.currentLevel === 2) {
      // Level 2: "The Great Tapajós Crossing" - Vast open river basin (260m x 260m)
      this.worldSize = 260;
    } else {
      // Level 3: "Flooded Blackwater Forest" - Deep Igapó swamp (220m x 220m)
      this.worldSize = 220;
    }

    this.initTerrain();
    this.initRealisticWater();
    this.initVegetation();

    if (this.currentLevel === 1) {
      this.initRiverGateway();
    }
  }

  getHeightAt(x, z) {
    const half = this.worldSize * 0.5;
    const distFromCenter = Math.hypot(x, z);

    if (this.currentLevel === 1) {
      // Level 1: Small enclosed nursery pool with perimeter mangrove barrier
      if (Math.abs(x) > half - 4 || Math.abs(z) > half - 4) {
        return 4.5; // Impassable muddy walls
      }
      // Shallow meandering creek running through center
      const creekCenter = Math.sin(z * 0.1) * 6;
      const distFromCreek = Math.abs(x - creekCenter);

      // Central nursery sandbank at (0, 0)
      if (distFromCenter < 9) {
        return 0.5 + Math.cos(distFromCenter / 9 * Math.PI * 0.5) * 0.45;
      }
      if (distFromCreek < 7) {
        return -0.25 - (1 - distFromCreek / 7) * 0.5; // Shallow swimming pool
      }
      return 0.45 + Math.sin(x * 0.3) * 0.15; // Muddy banks
    } else if (this.currentLevel === 2) {
      // Level 2: Vast open river basin
      if (Math.abs(x) > half - 10 || Math.abs(z) > half - 10) {
        return 7.0; // Jungle border cliffs
      }
      // Broad winding river corridor
      const riverCenter = Math.sin(z * 0.035) * 35 + Math.cos(z * 0.012) * 18;
      const distFromRiver = Math.abs(x - riverCenter);

      // Modular Island 1 (Marajó Outpost) at z = -30
      const islandDist = Math.hypot(x - riverCenter, z + 30);
      if (islandDist < 18) {
        return 0.85 + Math.cos(islandDist / 18 * Math.PI * 0.5) * 1.3;
      }

      // Modular Island 2 at z = 55
      const island2Dist = Math.hypot(x - (riverCenter + 8), z - 55);
      if (island2Dist < 15) {
        return 0.75 + Math.cos(island2Dist / 15 * Math.PI * 0.5) * 1.1;
      }

      if (distFromRiver < 24) {
        // Deep navigable river channel
        const bedDepth = (1 - (distFromRiver / 24)) * 2.8;
        return -0.4 - bedDepth;
      } else if (distFromRiver < 38) {
        // Sloping muddy shorelines
        const t = (distFromRiver - 24) / 14;
        return -0.4 + t * 2.0;
      } else {
        // High jungle floor
        return 1.6 + Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.8;
      }
    } else {
      // Level 3: Flooded Blackwater Forest
      if (Math.abs(x) > half - 8 || Math.abs(z) > half - 8) {
        return 6.0;
      }
      // Mostly submerged with root mounds
      const mound = Math.sin(x * 0.12) * Math.cos(z * 0.12);
      if (mound > 0.4) {
        return 0.45;
      }
      return -1.2; // Deep blackwater flooded forest
    }
  }

  initTerrain() {
    const segments = this.currentLevel === 1 ? 60 : 120;
    const geom = new THREE.PlaneGeometry(this.worldSize, this.worldSize, segments, segments);
    geom.rotateX(-Math.PI * 0.5);

    const pos = geom.attributes.position;
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeightAt(x, z);
      pos.setY(i, y);

      // Realistic Photorealistic Biome Elevation Coloring
      if (y < -0.3) {
        // Dark riverbed silt & submerged organic decay
        color.setRGB(0.09, 0.13, 0.08);
      } else if (y < 0.35) {
        // Wet river mud with glossy sheen
        color.setRGB(0.22, 0.16, 0.10);
      } else if (y < 1.2) {
        // Rich lush Amazon riverbank moss & grass
        color.setRGB(0.19, 0.35, 0.15);
      } else {
        // Deep tropical rain forest floor
        color.setRGB(0.14, 0.28, 0.11);
      }
      colors.push(color.r, color.g, color.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.08
    });

    this.terrainMesh = new THREE.Mesh(geom, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  initRealisticWater() {
    const waterGeom = new THREE.PlaneGeometry(this.worldSize, this.worldSize, 40, 40);
    waterGeom.rotateX(-Math.PI * 0.5);

    // Realistic Amazon River Murky Water with High Specular Highlights & Fresnel
    this.waterMat = new THREE.MeshStandardMaterial({
      color: this.currentLevel === 3 ? 0x09140f : 0x143022,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.86
    });

    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    this.waterMesh.position.y = this.waterLevel;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  initVegetation() {
    this.foliageGroup = new THREE.Group();
    this.scene.add(this.foliageGroup);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x362414, roughness: 0.92 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x1f541c, roughness: 0.38, side: THREE.DoubleSide });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x2e2318, roughness: 0.95 });
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x2b6e2d, roughness: 0.32, side: THREE.DoubleSide });

    if (this.currentLevel === 1) {
      // Level 1: Nursery Mangroves & Reeds surrounding the tiny pond
      const numTrees = 36;
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2;
        const dist = 24 + (Math.random() - 0.5) * 5;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = this.getHeightAt(x, z);

        const tree = this.createPalmTree(trunkMat, frondMat, 5 + Math.random() * 2.5);
        tree.position.set(x, y, z);
        this.foliageGroup.add(tree);
      }

      // Small logs in nursery
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 10, 7), logMat);
      log.rotation.z = Math.PI * 0.5;
      log.rotation.y = 0.5;
      log.position.set(4, 0.35, -2);
      this.scene.add(log);
      this.fallenLogs.push(log);

      // Reeds & small lily pads
      for (let i = 0; i < 14; i++) {
        const lily = this.createLilyPad(lilyMat, 0.6 + Math.random() * 0.5);
        lily.position.set((Math.random() - 0.5) * 22, this.waterLevel + 0.02, (Math.random() - 0.5) * 22);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }

    } else if (this.currentLevel === 2) {
      // Level 2: Vast Rainforest Palms, Giant Lily Pads & Traversal Log Bridges
      for (let i = 0; i < 110; i++) {
        const x = (Math.random() - 0.5) * (this.worldSize - 35);
        const z = (Math.random() - 0.5) * (this.worldSize - 35);
        const y = this.getHeightAt(x, z);

        if (y > 0.5) {
          const tree = this.createPalmTree(trunkMat, frondMat, 9 + Math.random() * 5);
          tree.position.set(x, y, z);
          tree.rotation.y = Math.random() * Math.PI * 2;
          this.foliageGroup.add(tree);
        }
      }

      // Giant Victoria amazonica Lily Pads
      for (let i = 0; i < 50; i++) {
        const z = (Math.random() - 0.5) * (this.worldSize - 45);
        const riverCenter = Math.sin(z * 0.035) * 35 + Math.cos(z * 0.012) * 18;
        const x = riverCenter + (Math.random() - 0.5) * 22;
        const y = this.getHeightAt(x, z);

        if (y < this.waterLevel) {
          const lily = this.createLilyPad(lilyMat, 1.4 + Math.random() * 1.8);
          lily.position.set(x, this.waterLevel + 0.02, z);
          this.scene.add(lily);
          this.lilyPads.push(lily);
        }
      }

      // Big fallen logs bridging river banks
      const bridges = [
        { x: -8, z: -12, rotY: 0.35, length: 22 },
        { x: 16, z: 32, rotY: -0.4, length: 20 },
        { x: -22, z: -65, rotY: 0.55, length: 24 }
      ];
      for (const b of bridges) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, b.length, 8), logMat);
        log.rotation.z = Math.PI * 0.5;
        log.rotation.y = b.rotY;
        const gy = this.getHeightAt(b.x, b.z);
        log.position.set(b.x, Math.max(gy, this.waterLevel) + 0.35, b.z);
        this.scene.add(log);
        this.fallenLogs.push(log);
      }
    } else {
      // Level 3: Ancient Gnarled Cypress & Submerged Roots
      for (let i = 0; i < 65; i++) {
        const x = (Math.random() - 0.5) * (this.worldSize - 30);
        const z = (Math.random() - 0.5) * (this.worldSize - 30);
        const tree = this.createPalmTree(trunkMat, frondMat, 12 + Math.random() * 6);
        tree.position.set(x, -0.2, z);
        this.foliageGroup.add(tree);
      }
      for (let i = 0; i < 35; i++) {
        const lily = this.createLilyPad(lilyMat, 2.0 + Math.random() * 1.5);
        lily.position.set((Math.random() - 0.5) * 160, this.waterLevel + 0.02, (Math.random() - 0.5) * 160);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }
    }
  }

  initRiverGateway() {
    // Ancient flooded river portal that unlocks when 5 prey are eaten
    this.gatewayGroup = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.8 });
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });

    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 8), pillarMat);
    pL.position.set(-6, 3, 27);
    this.gatewayGroup.add(pL);

    const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 8), pillarMat);
    pR.position.set(6, 3, 27);
    this.gatewayGroup.add(pR);

    this.barrierMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), barrierMat);
    this.barrierMesh.position.set(0, 2.5, 27);
    this.gatewayGroup.add(this.barrierMesh);

    this.scene.add(this.gatewayGroup);
  }

  unlockGateway() {
    if (this.barrierMesh) {
      this.barrierMesh.material.color.setHex(0x55ffaa);
      this.barrierMesh.material.opacity = 0.15;
    }
  }

  createPalmTree(trunkMat, frondMat, height = 9) {
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, height, 7), trunkMat);
    trunk.position.y = height * 0.5;
    trunk.castShadow = true;
    palm.add(trunk);

    const crown = new THREE.Group();
    crown.position.y = height;
    const numFronds = 8;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2;
      const frondGeom = new THREE.ConeGeometry(0.85, height * 0.5, 4);
      frondGeom.scale(1, 0.14, 1);
      frondGeom.rotateX(Math.PI * 0.38);
      const frond = new THREE.Mesh(frondGeom, frondMat);
      frond.rotation.y = angle;
      crown.add(frond);
    }
    palm.add(crown);
    return palm;
  }

  createLilyPad(lilyMat, radius = 1.2) {
    const geom = new THREE.CylinderGeometry(radius, radius, 0.04, 16);
    const mesh = new THREE.Mesh(geom, lilyMat);
    return mesh;
  }

  initAtmosphere() {
    const amb = new THREE.AmbientLight(0x2d4838, 1.45);
    this.scene.add(amb);

    this.sunLight = new THREE.DirectionalLight(0xfff6d8, 1.9);
    this.sunLight.position.set(35, 65, 25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 180;
    const d = 45;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    this.scene.fog = new THREE.FogExp2(0x0c2115, 0.011);
  }

  update(delta) {
    if (this.waterMesh) {
      this.waterMesh.rotation.y = Math.sin(Date.now() * 0.00025) * 0.015;
    }
    for (let i = 0; i < this.lilyPads.length; i++) {
      const lily = this.lilyPads[i];
      lily.position.y = this.waterLevel + 0.02 + Math.sin(Date.now() * 0.0018 + i) * 0.012;
    }
    if (this.barrierMesh) {
      this.barrierMesh.rotation.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
  }
}

window.AmazonWorld = AmazonWorld;
