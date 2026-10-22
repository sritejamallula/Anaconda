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

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.92 });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x22631d,
      roughness: 0.38,
      metalness: 0.05
    });
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x1d4718, roughness: 0.85 });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x302319, roughness: 0.94 });
    const lilyMat = new THREE.MeshPhysicalMaterial({
      color: 0x287730,
      roughness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x384236,
      roughness: 0.45,
      metalness: 0.1
    });

    if (this.currentLevel === 1) {
      const numTrees = 32;
      for (let i = 0; i < numTrees; i++) {
        const angle = (i / numTrees) * Math.PI * 2;
        const dist = 23 + (Math.random() - 0.5) * 6;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = this.getHeightAt(x, z);

        const tree = this.createRainforestTree(trunkMat, leafMat, vineMat, 6.5 + Math.random() * 3.0);
        tree.position.set(x, y, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        this.foliageGroup.add(tree);
      }

      // Riverbed Rocks along shorelines
      for (let i = 0; i < 22; i++) {
        const rock = this.createRiverRock(rockMat, 0.4 + Math.random() * 0.7);
        const ang = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 15;
        const rx = Math.cos(ang) * r;
        const rz = Math.sin(ang) * r;
        const ry = this.getHeightAt(rx, rz);
        rock.position.set(rx, ry + 0.1, rz);
        this.scene.add(rock);
        this.riverRocks.push(rock);
      }

      // Fallen mossy log
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 11, 10), logMat);
      log.rotation.z = Math.PI * 0.5;
      log.rotation.y = 0.52;
      log.position.set(4, 0.38, -2);
      log.castShadow = true;
      this.scene.add(log);
      this.fallenLogs.push(log);

      // Giant Victoria Amazonica Lily Pads
      for (let i = 0; i < 16; i++) {
        const lily = this.createVictoriaAmazonica(lilyMat, 0.75 + Math.random() * 0.6);
        lily.position.set((Math.random() - 0.5) * 24, this.waterLevel + 0.02, (Math.random() - 0.5) * 24);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }
    } else if (this.currentLevel === 2) {
      for (let i = 0; i < 120; i++) {
        const x = (Math.random() - 0.5) * (this.worldSize - 35);
        const z = (Math.random() - 0.5) * (this.worldSize - 35);
        const y = this.getHeightAt(x, z);

        if (y > 0.45) {
          const tree = this.createRainforestTree(trunkMat, leafMat, vineMat, 9.5 + Math.random() * 6.5);
          tree.position.set(x, y, z);
          tree.rotation.y = Math.random() * Math.PI * 2;
          this.foliageGroup.add(tree);
        }
      }

      for (let i = 0; i < 55; i++) {
        const z = (Math.random() - 0.5) * (this.worldSize - 45);
        const riverCenter = Math.sin(z * 0.035) * 35 + Math.cos(z * 0.012) * 18;
        const x = riverCenter + (Math.random() - 0.5) * 26;
        const y = this.getHeightAt(x, z);

        if (y < this.waterLevel) {
          const lily = this.createVictoriaAmazonica(lilyMat, 1.4 + Math.random() * 1.8);
          lily.position.set(x, this.waterLevel + 0.02, z);
          this.scene.add(lily);
          this.lilyPads.push(lily);
        }
      }

      const bridges = [
        { x: -8, z: -12, rotY: 0.35, length: 24 },
        { x: 16, z: 32, rotY: -0.4, length: 22 },
        { x: -22, z: -65, rotY: 0.55, length: 26 }
      ];
      for (const b of bridges) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, b.length, 12), logMat);
        log.rotation.z = Math.PI * 0.5;
        log.rotation.y = b.rotY;
        const gy = this.getHeightAt(b.x, b.z);
        log.position.set(b.x, Math.max(gy, this.waterLevel) + 0.38, b.z);
        log.castShadow = true;
        this.scene.add(log);
        this.fallenLogs.push(log);
      }
    } else {
      for (let i = 0; i < 75; i++) {
        const x = (Math.random() - 0.5) * (this.worldSize - 30);
        const z = (Math.random() - 0.5) * (this.worldSize - 30);
        const tree = this.createRainforestTree(trunkMat, leafMat, vineMat, 13 + Math.random() * 7);
        tree.position.set(x, -0.2, z);
        this.foliageGroup.add(tree);
      }
      for (let i = 0; i < 40; i++) {
        const lily = this.createVictoriaAmazonica(lilyMat, 2.2 + Math.random() * 1.6);
        lily.position.set((Math.random() - 0.5) * 170, this.waterLevel + 0.02, (Math.random() - 0.5) * 170);
        this.scene.add(lily);
        this.lilyPads.push(lily);
      }
    }
  }

  // Realistic Amazon Rainforest Canopy Tree with Buttress Roots, Tiered Foliage & Hanging Vines
  createRainforestTree(trunkMat, leafMat, vineMat, height = 9) {
    const tree = new THREE.Group();

    // 1. Organic Buttressed Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.32, 0.95, height, 10);
    trunkGeom.translate(0, height * 0.5, 0);
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // 2. Multi-Clustered Canopy Volumes (Rich foliage instead of simple cones)
    const crown = new THREE.Group();
    crown.position.y = height * 0.88;

    const clusters = [
      { x: 0, y: height * 0.18, z: 0, s: height * 0.42 },
      { x: -height * 0.22, y: 0, z: height * 0.18, s: height * 0.35 },
      { x: height * 0.24, y: -height * 0.06, z: -height * 0.15, s: height * 0.36 },
      { x: height * 0.15, y: -height * 0.12, z: height * 0.22, s: height * 0.32 }
    ];

    for (const c of clusters) {
      const foliageGeom = new THREE.IcosahedronGeometry(c.s, 1);
      foliageGeom.scale(1.2, 0.72, 1.2);
      const foliage = new THREE.Mesh(foliageGeom, leafMat);
      foliage.position.set(c.x, c.y, c.z);
      foliage.castShadow = true;
      crown.add(foliage);
    }
    tree.add(crown);

    // 3. Hanging Amazon Vines / Lianas
    if (height > 6) {
      const numVines = 3;
      for (let v = 0; v < numVines; v++) {
        const vAngle = (v / numVines) * Math.PI * 2 + Math.random() * 0.5;
        const vDist = height * 0.28;
        const vineLen = height * (0.4 + Math.random() * 0.3);
        const vineGeom = new THREE.CylinderGeometry(0.02, 0.015, vineLen, 6);
        vineGeom.translate(0, -vineLen * 0.5, 0);
        const vine = new THREE.Mesh(vineGeom, vineMat);
        vine.position.set(Math.cos(vAngle) * vDist, height * 0.82, Math.sin(vAngle) * vDist);
        tree.add(vine);
      }
    }

    return tree;
  }

  // Giant Victoria Amazonica Water Lily with Authentic Raised Rim
  createVictoriaAmazonica(lilyMat, radius = 1.2) {
    const lily = new THREE.Group();

    // Circular pad base
    const padGeom = new THREE.CylinderGeometry(radius, radius, 0.04, 24);
    const pad = new THREE.Mesh(padGeom, lilyMat);
    lily.add(pad);

    // Upturned vertical perimeter rim
    const rimGeom = new THREE.CylinderGeometry(radius, radius, 0.14, 24, 1, true);
    rimGeom.translate(0, 0.06, 0);
    const rim = new THREE.Mesh(rimGeom, lilyMat);
    lily.add(rim);

    // Radial vein pattern (dark undersurface ribs)
    const ribMat = new THREE.MeshBasicMaterial({ color: 0x1b441a });
    for (let r = 0; r < 6; r++) {
      const ribGeom = new THREE.BoxGeometry(radius * 1.9, 0.02, 0.03);
      const rib = new THREE.Mesh(ribGeom, ribMat);
      rib.rotation.y = (r / 6) * Math.PI;
      rib.position.y = -0.02;
      lily.add(rib);
    }

    return lily;
  }

  // Smooth Riverbed Boulder with Wet Specular Sheen
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

    // Carved River Gate Lintel
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
      const { skyTex, envMap } = this.assets.createEquirectangularSky(this.renderer);
      this.scene.background = skyTex;
      this.scene.environment = envMap;
    }

    // 2. Directional Golden Amazon Sunlight
    const amb = new THREE.AmbientLight(0x385542, 1.25);
    this.scene.add(amb);

    this.sunLight = new THREE.DirectionalLight(0xfff5d6, 2.1);
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

    // 3. Atmospheric Rainforest Haze
    this.scene.fog = new THREE.FogExp2(0x183322, 0.009);
  }

  update(delta) {
    // 1. Animate Water Surface Ripples
    if (this.waterGeom && this.waterInitialPositions) {
      const pos = this.waterGeom.attributes.position;
      const count = pos.count;
      const time = Date.now() * 0.0022;

      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const origY = this.waterInitialPositions[i * 3 + 1];
        const wave = Math.sin(u * 0.45 + time) * 0.038 + Math.cos(v * 0.35 + time * 0.8) * 0.026;
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

    if (this.barrierMesh && this.barrierMesh.visible) {
      this.barrierMesh.rotation.y = Math.sin(Date.now() * 0.0025) * 0.06;
    }
  }
}

window.AmazonWorld = AmazonWorld;