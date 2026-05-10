import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface LandingSceneRefs {
  bookGroup: THREE.Group;
  altarGroup: THREE.Group;
  spotLight: THREE.SpotLight;
  rimLight: THREE.PointLight;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export class LandingScene {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  readonly bookGroup = new THREE.Group();
  readonly altarGroup = new THREE.Group();

  spotLight!: THREE.SpotLight;
  rimLight!: THREE.PointLight;

  private animationId: number | null = null;
  private clock = new THREE.Clock();
  private disposed = false;
  private paused = false;
  private idleAmplitude = 0.05;

  private ktx2Loader!: KTX2Loader;
  private gltfLoader!: GLTFLoader;
  private pmremGenerator!: THREE.PMREMGenerator;

  isMobile = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.isMobile = window.innerWidth < 768;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = this.isMobile ? 60 : 45;
    this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0.5, this.isMobile ? 6.5 : 5.0);

    this.scene.add(this.bookGroup);
    this.scene.add(this.altarGroup);

    this.altarGroup.visible = false;

    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('assets/basis/');
    this.ktx2Loader.detectSupport(this.renderer);

    this.gltfLoader = new GLTFLoader();

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    const envMap = this.pmremGenerator.fromScene(roomEnv).texture;
    this.scene.environment = envMap;
    roomEnv.dispose();

    this.setupLights();
    this.buildAltar();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.08);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xfcf5e2, 0x2a1a12, 0.25);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe9c2, 1.4);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(
      this.isMobile ? 1024 : 2048,
      this.isMobile ? 1024 : 2048
    );
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    this.scene.add(keyLight);

    this.spotLight = new THREE.SpotLight(0xfff6e0, 3.5, 12, Math.PI / 7, 0.7, 1.5);
    this.spotLight.position.set(0, 5, 0.5);
    this.spotLight.target = this.bookGroup;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.set(
      this.isMobile ? 1024 : 2048,
      this.isMobile ? 1024 : 2048
    );
    this.spotLight.shadow.bias = -0.0004;
    this.scene.add(this.spotLight);

    this.rimLight = new THREE.PointLight(0xe0a15e, 0.6, 8, 1.5);
    this.rimLight.position.set(0, 1, -2);
    this.scene.add(this.rimLight);
  }

  private buildAltar(): void {
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x2e1f1a,
      roughness: 0.35,
      metalness: 0.05,
      envMapIntensity: 0.9,
    });

    const goldLineMat = new THREE.LineBasicMaterial({
      color: 0xe0a15e,
      transparent: true,
      opacity: 0.55,
    });

    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xe0a15e,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0xe0a15e,
      emissiveIntensity: 0.15,
    });

    const tiers = [
      { rTop: 1.2, rBot: 1.35, h: 0.18 },
      { rTop: 0.95, rBot: 1.05, h: 0.14 },
      { rTop: 0.75, rBot: 0.82, h: 0.10 },
    ];

    let yOffset = 0;

    tiers.forEach((tier, i) => {
      const geo = new THREE.CylinderGeometry(tier.rTop, tier.rBot, tier.h, 64);
      const mesh = new THREE.Mesh(geo, altarMat);
      mesh.position.y = yOffset + tier.h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.altarGroup.add(mesh);

      const edges = new THREE.EdgesGeometry(geo, 30);
      const lines = new THREE.LineSegments(edges, goldLineMat);
      lines.position.copy(mesh.position);
      this.altarGroup.add(lines);

      if (i < tiers.length - 1) {
        const ringGeo = new THREE.TorusGeometry(tier.rTop + 0.005, 0.008, 8, 64);
        const ring = new THREE.Mesh(ringGeo, goldRingMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = yOffset + tier.h;
        this.altarGroup.add(ring);
      }

      yOffset += tier.h;
    });

    const runeGeo = new THREE.RingGeometry(0.12, 0.18, 64);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xe0a15e,
      emissive: 0xe0a15e,
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.4,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.rotation.x = -Math.PI / 2;
    rune.position.y = yOffset + 0.005;
    rune.userData['isRune'] = true;
    this.altarGroup.add(rune);

    const innerRuneGeo = new THREE.RingGeometry(0.04, 0.08, 6);
    const innerRune = new THREE.Mesh(innerRuneGeo, runeMat.clone());
    innerRune.rotation.x = -Math.PI / 2;
    innerRune.position.y = yOffset + 0.006;
    innerRune.userData['isRune'] = true;
    this.altarGroup.add(innerRune);

    this.altarGroup.position.set(0, -3, 0);
  }

  async loadBook(onProgress?: (pct: number) => void): Promise<void> {
    const texturePaths = {
      color: 'assets/landing-book/book-color.ktx2',
      normal: 'assets/landing-book/book-normal.ktx2',
      metalRough: 'assets/landing-book/book-metallic-roughtness.ktx2',
      emissive: 'assets/landing-book/book-emessive.ktx2',
    };

    let loaded = 0;
    const total = 5;
    const tick = () => {
      loaded++;
      onProgress?.(Math.round((loaded / total) * 100));
    };

    const [colorTex, normalTex, metalRoughTex, emissiveTex] = await Promise.all([
      this.ktx2Loader.loadAsync(texturePaths.color).then(t => { tick(); return t; }),
      this.ktx2Loader.loadAsync(texturePaths.normal).then(t => { tick(); return t; }),
      this.ktx2Loader.loadAsync(texturePaths.metalRough).then(t => { tick(); return t; }),
      this.ktx2Loader.loadAsync(texturePaths.emissive).then(t => { tick(); return t; }),
    ]);

    colorTex.colorSpace = THREE.SRGBColorSpace;
    emissiveTex.colorSpace = THREE.SRGBColorSpace;

    const gltf = await new Promise<any>((resolve, reject) => {
      this.gltfLoader.load('assets/landing-book/landing-book.glb', resolve, undefined, reject);
    });
    tick();

    const bookModel = gltf.scene;

    bookModel.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mat = new THREE.MeshStandardMaterial({
          map: colorTex,
          normalMap: normalTex,
          roughnessMap: metalRoughTex,
          metalnessMap: metalRoughTex,
          emissiveMap: emissiveTex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 1.6,
          envMapIntensity: 1.2,
          roughness: 1.0,
          metalness: 1.0,
        });
        mesh.material = mat;
      }
    });

    this.bookGroup.add(bookModel);
    this.bookGroup.position.set(0, 0.2, 0);
    this.bookGroup.rotation.set(0, -0.35, 0);
  }

  startRenderLoop(): void {
    if (this.disposed) return;

    const animate = () => {
      if (this.disposed) return;
      this.animationId = requestAnimationFrame(animate);
      if (this.paused) return;

      const t = this.clock.getElapsedTime();

      this.altarGroup.traverse((child: THREE.Object3D) => {
        if (child.userData['isRune'] && (child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = Math.sin(t * 0.6) * 0.1 + 0.4;
        }
      });

      if (this.idleAmplitude > 0.001) {
        this.bookGroup.position.y += Math.sin(t * 1.2) * this.idleAmplitude * 0.01;
        this.bookGroup.rotation.y += Math.sin(t * 0.5) * 0.0003;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  setIdleAmplitude(v: number): void {
    this.idleAmplitude = v;
  }

  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; }

  handleResize(): void {
    if (this.disposed) return;
    this.isMobile = window.innerWidth < 768;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.fov = this.isMobile ? 60 : 45;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(w, h);
  }

  getRefs(): LandingSceneRefs {
    return {
      bookGroup: this.bookGroup,
      altarGroup: this.altarGroup,
      spotLight: this.spotLight,
      rimLight: this.rimLight,
      camera: this.camera,
      renderer: this.renderer,
    };
  }

  dispose(): void {
    this.disposed = true;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.ktx2Loader.dispose();
    this.pmremGenerator.dispose();

    this.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.map?.dispose();
            mat.normalMap?.dispose();
            mat.roughnessMap?.dispose();
            mat.metalnessMap?.dispose();
            mat.emissiveMap?.dispose();
            mat.envMap?.dispose();
          }
          mat.dispose();
        });
      }
    });

    if (this.scene.environment) {
      this.scene.environment.dispose();
    }

    this.renderer.dispose();
  }
}
