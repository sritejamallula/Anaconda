// Photorealistic Asset & Texture Pipeline for Anaconda Amazon Survival
class GameAssets {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = {};
    this.isLoaded = false;
    this.initFallbacks();
  }

  // Synchronous High-Definition Procedural Fallbacks (Ensures instant 3D rendering with zero wait)
  initFallbacks() {
    this.textures.snakeSkin = this.generateSnakeSkinTexture();
    this.textures.snakeHead = this.generateSnakeSkinTexture();
    this.textures.terrainLevel1 = this.generateMudTexture(0x2d4422, 0x1a2814);
    this.textures.terrainLevel2 = this.generateMudTexture(0x384824, 0x1f2e16);
    this.textures.terrainLevel3 = this.generateMudTexture(0x19281a, 0x0c160e);
    this.textures.capybara = this.generateFurTexture(0x5a3d24, 0x3d2716);
    this.textures.frog = this.generateAmphibianTexture();
    this.textures.rat = this.generateFurTexture(0x4a3c30, 0x2e231b);
    this.textures.caiman = this.generateReptileArmorTexture();
    this.textures.caimanBoss = this.generateTitanCaimanTexture();
  }

  generateSnakeSkinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep iridescent olive green base
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#354d24');
    grad.addColorStop(0.5, '#476831');
    grad.addColorStop(1, '#2f421f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Micro-hexagonal scale pattern
    const scaleSize = 8;
    ctx.strokeStyle = 'rgba(20, 32, 12, 0.45)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 1024; y += scaleSize * 1.5) {
      for (let x = 0; x < 1024; x += scaleSize * 1.732) {
        const ox = (Math.floor(y / (scaleSize * 1.5)) % 2) * (scaleSize * 0.866);
        ctx.beginPath();
        ctx.arc(x + ox, y, scaleSize * 0.75, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Authentic Eunectes murinus black oval rosettes with yellow/ochre rings
    for (let i = 0; i < 90; i++) {
      const cx = (i * 127) % 1024;
      const cy = (i * 193 + (i % 3) * 70) % 1024;
      const rx = 24 + (i % 5) * 6;
      const ry = 36 + (i % 7) * 8;
      const rot = (i * 0.35);

      // Yellow-ochre halo
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 6, ry + 6, rot, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 142, 54, 0.55)';
      ctx.fill();

      // Jet black core
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      ctx.fillStyle = '#10150d';
      ctx.fill();

      // Specular scale gleam inside rosette
      ctx.beginPath();
      ctx.ellipse(cx - rx * 0.2, cy - ry * 0.2, rx * 0.3, ry * 0.3, rot, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 14);
    return tex;
  }

  generateMudTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#' + color1.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 512, 512);

    // Wet mud noise & organic riverbed silt
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 2 + Math.random() * 12;
      ctx.fillStyle = (Math.random() > 0.5) 
        ? '#' + color2.toString(16).padStart(6, '0')
        : 'rgba(20, 40, 16, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  generateFurTexture(baseCol, darkCol) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + baseCol.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#' + darkCol.toString(16).padStart(6, '0');
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 6 + Math.random() * 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateAmphibianTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Lime green to emerald gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#38a832');
    grad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Mottled yellow-orange dots & dark spots
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255, 235, 59, 0.45)' : 'rgba(10, 30, 10, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.random() * 9, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  generateReptileArmorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#263321';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#141c11';
    for (let y = 0; y < 512; y += 24) {
      for (let x = 0; x < 512; x += 32) {
        ctx.fillRect(x + 2, y + 2, 28, 20);
        ctx.fillStyle = 'rgba(70, 95, 60, 0.35)';
        ctx.fillRect(x + 5, y + 5, 22, 6);
        ctx.fillStyle = '#141c11';
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
  }

  generateTitanCaimanTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#161d18';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#080d0a';
    for (let y = 0; y < 512; y += 28) {
      for (let x = 0; x < 512; x += 36) {
        ctx.fillRect(x + 3, y + 3, 30, 22);
        ctx.fillStyle = 'rgba(180, 50, 30, 0.15)';
        ctx.fillRect(x + 7, y + 7, 22, 5);
        ctx.fillStyle = '#080d0a';
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
  }

  // Generates 360° Equirectangular Amazon Environment Sky
  createEquirectangularSky(renderer) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Tropical Amazon Atmosphere: Sun glow, sky blue, lush green tree canopy line
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#5891b0');
    skyGrad.addColorStop(0.35, '#82b2a6');
    skyGrad.addColorStop(0.52, '#d4c294');
    skyGrad.addColorStop(0.68, '#26421c');
    skyGrad.addColorStop(1.0, '#0a160d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Golden tropical sun flare
    const sunGrad = ctx.createRadialGradient(512, 220, 10, 512, 220, 160);
    sunGrad.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
    sunGrad.addColorStop(0.3, 'rgba(255, 220, 140, 0.6)');
    sunGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(512, 220, 160, 0, Math.PI * 2);
    ctx.fill();

    // Soft canopy silhouettes along the 360° horizon
    ctx.fillStyle = '#182d13';
    for (let x = 0; x < 1024; x += 18) {
      const h = 40 + Math.sin(x * 0.05) * 25 + Math.cos(x * 0.02) * 18;
      ctx.beginPath();
      ctx.arc(x, 280, h * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    const skyTex = new THREE.CanvasTexture(canvas);
    skyTex.mapping = THREE.EquirectangularReflectionMapping;

    let envMap = skyTex;
    if (renderer && THREE.PMREMGenerator) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        envMap = pmrem.fromEquirectangular(skyTex).texture;
        pmrem.dispose();
      } catch (e) {
        console.warn('PMREM generation fallback to equirectangular:', e);
      }
    }

    return { skyTex, envMap };
  }

  loadAll(onProgress, onComplete) {
    const urls = {
      snakeSkin: 'assets/art/swallowing_bulge.jpg',
      snakeHead: 'assets/art/anaconda_model.jpg',
      caimanBoss: 'assets/art/black_caiman_boss.jpg',
      faunaSheet: 'assets/art/prey_fauna.jpg',
      terrainLevel1: 'assets/art/marajo_island.jpg',
      terrainLevel2: 'assets/art/tapajos_basin.jpg',
      terrainLevel3: 'assets/art/flooded_forest.jpg',
      hudFrame: 'assets/art/tactical_hud.jpg'
    };

    let total = Object.keys(urls).length;
    let loaded = 0;

    const checkComplete = () => {
      loaded++;
      if (onProgress) onProgress(loaded / total);
      if (loaded >= total) {
        this.sliceFaunaSheet();
        this.configureTextures();
        this.isLoaded = true;
        if (onComplete) onComplete();
      }
    };

    for (const [key, url] of Object.entries(urls)) {
      this.loader.load(
        url,
        (tex) => {
          this.textures[key] = tex;
          checkComplete();
        },
        undefined,
        (err) => {
          console.warn('Asset deferred, using synchronous fallback:', url);
          checkComplete();
        }
      );
    }
  }

  sliceFaunaSheet() {
    try {
      const sheet = this.textures.faunaSheet;
      if (!sheet || !sheet.image) return;

      const img = sheet.image;
      const w = img.naturalWidth || img.width || 1024;
      const h = img.naturalHeight || img.height || 576;
      if (w <= 0 || h <= 0) return;

      const halfW = Math.floor(w / 2);
      const halfH = Math.floor(h / 2);

      const sliceQuadrant = (sx, sy, sw, sh) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
      };

      this.textures.capybara = sliceQuadrant(0, 0, halfW, halfH);
      this.textures.frog = sliceQuadrant(halfW, 0, halfW, halfH);
      this.textures.rat = sliceQuadrant(0, halfH, halfW, halfH);
      this.textures.caiman = sliceQuadrant(halfW, halfH, halfW, halfH);
    } catch (e) {
      console.warn('Using procedural textures for fauna:', e);
    }
  }

  configureTextures() {
    for (const [key, tex] of Object.entries(this.textures)) {
      if (tex && tex.isTexture) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
    }

    if (this.textures.snakeSkin) {
      this.textures.snakeSkin.repeat.set(3, 14);
    }
    if (this.textures.terrainLevel1) {
      this.textures.terrainLevel1.repeat.set(4, 4);
    }
    if (this.textures.terrainLevel2) {
      this.textures.terrainLevel2.repeat.set(8, 8);
    }
  }
}

window.GameAssets = GameAssets;