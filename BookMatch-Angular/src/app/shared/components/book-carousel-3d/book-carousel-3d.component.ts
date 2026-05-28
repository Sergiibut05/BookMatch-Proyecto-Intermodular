import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Datos de entrada para cada libro renderizado en el carrusel 3D.
 */
export interface BookData {
  /** Título del libro. */
  title: string;
  /** Autor. */
  author: string;
  /** URL de la imagen de portada. */
  coverImage: string;
  /** Ruta para navegar al hacer click. */
  url?: string;
  /** ID del libro en catálogo. */
  id?: number;
}

/**
 * Carrusel 3D de libros basado en Three.js.
 *
 * Renderiza modelos con texturas de portada, soporta interaccion por arrastre,
 * rueda y tactil, y permite navegar al libro seleccionado.
 *
 * @example
 * ```html
 * <app-book-carousel-3d [books]="featuredBooks" title="Destacados" />
 * ```
 */
@Component({
  selector: 'app-book-carousel-3d',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './book-carousel-3d.component.html',
  styleUrl: './book-carousel-3d.component.scss',
})
export class BookCarousel3dComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Referencia al canvas. */
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /** Lista de libros a mostrar en el carrusel. */
  @Input() books: BookData[] = [];
  /** Título de la sección. */
  @Input() title: string = 'The Best Selling Books';
  /** Color de fondo del carrusel. */
  @Input() backgroundColor: string = '#DFEFED';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: any; 
  private booksGroup!: THREE.Group;
  private raycaster!: THREE.Raycaster;
  private mouse = new THREE.Vector2();
  private animationId: number | null = null;

  // Carousel state
  private carouselOffset = 0;
  private targetCarouselOffset = 0;
  private carouselMinOffset = -Infinity;
  private carouselMaxOffset = Infinity;
  private isDragging = false;
  private lastDragX = 0;
  private mouseDownX = 0;
  private mouseDownY = 0;
  private wasDragged = false;           // true when pointer moved > threshold
  private readonly DRAG_THRESHOLD = 5; // px
  private isMouseOverCanvas = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private isHorizontalSwipe = false;

  // Configuration
  private isMobile = false;
  private carouselConfig = {
    smoothness: 0.03,
    rotationSmoothness: 0.01,
    dragSensitivity: 0.001,
    scrollSensitivity: 0.001,
    buttonStep: 0.5,
    rotationStartDistance: 0.1,
    rotationFullDistance: 0.5,
    bookSpacing: 0.5,
    curveHeight: 0.2
  };

  // Parameters
  private parameters = {
    lookAtSmoothness: 0.03,
    cursorRangeY: 3,
    maxTiltAngle: 15 * Math.PI / 180,
  };

  // Cursor
  private cursor = { x: 0, y: 0 };

  /** Índice del libro centrado en el carrusel. */
  centerBookIndex = signal<number | null>(null);
  /** Datos del libro actualmente centrado. */
  currentBook = signal<BookData | null>(null);

  // Background colors per book — paleta "biblioteca" muted. Cada color esta
  // mezclado ~50/50 con el cream base (#EDE0CA), lo que mantiene mismo nivel
  // de luminosidad (~79% L) pero permite que el hue se note. Los libros se
  // sienten "envejecidos" / "encuadernados" sin chocar con el page bg cream.
  private bookBackgroundColors = [
    0xEDE0CA, // 1. Cream base (matches hero)
    0xE3C4B3, // 2. Cream rosa (hint de rose dust)
    0xD2D2B9, // 3. Cream verde (hint de sage)
    0xEDD4AD, // 4. Cream apricot (hint dorado calido)
    0xDDC4A0, // 5. Muted stone (cierre neutro)
  ];

  /** Indice del libro cuyo color ya esta aplicado al :host (evita writes redundantes). */
  private lastAppliedBookIndex = -1;

  // ── Snap duration-based con easing cubic ────────────────────────────────────
  // En vez de boostear smoothness (que pega un salto), animamos el offset por
  // duracion fija con curva ease-out-quart (fuerte deceleracion al final).
  private isSnapping = false;
  private snapStartTime = 0;
  private snapStartOffset = 0;
  private snapTargetOffset = 0;
  private snapDurationMs = 0;
  private readonly SNAP_MIN_MS = 380;
  private readonly SNAP_MAX_MS = 620;

  /** Timer del snap diferido tras un wheel input. */
  private wheelSnapTimer: ReturnType<typeof setTimeout> | null = null;

  /** Inyecta Router y ElementRef (este ultimo se usa para pintar el bg dinamico via CSS). */
  constructor(private router: Router, private elementRef: ElementRef<HTMLElement>) {}

  /** Detecta si es móvil y ajusta la configuración del carrusel. */
  ngOnInit() {
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.updateMobileConfig();
  }

  private intersectionObserver: IntersectionObserver | null = null;

  /** Inicializa Three.js cuando el canvas entra en viewport (IntersectionObserver). */
  ngAfterViewInit() {
    if (!this.canvasRef?.nativeElement || this.books.length === 0) return;

    const container = this.canvasRef.nativeElement.parentElement;
    if (!container) {
      this.initThree();
      return;
    }

    // Lazy-load: only init and load textures when the carousel section is in (or near) viewport
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          this.initThree();
          this.intersectionObserver?.disconnect();
          this.intersectionObserver = null;
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );
    this.intersectionObserver.observe(container);
  }

  /** Limpia escena, listeners y animación. */
  ngOnDestroy() {
    this.cleanup();
  }

  private updateMobileConfig() {
    if (this.isMobile) {
      this.carouselConfig.dragSensitivity = 0.002;
      this.carouselConfig.buttonStep = 0.3;
      this.carouselConfig.bookSpacing = 0.3;
      // Curva mas baja: antes 0.30 levantaba el libro centrado hasta el pico
      // de la cosenoidal (y=0.3 en world), tan alto que pisaba el header en
      // pantallas chicas. Con 0.15 el libro queda mas centrado verticalmente.
      this.carouselConfig.curveHeight = 0.15;
    }
  }

  private async initThree() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    
    if (!container) {
      console.error('Canvas container not found');
      return;
    }

    // Scene — sin background propio. El bg lo pone el :host via CSS para que
    // coincida exactamente con el color del page-bg (sin sRGB drift de WebGL).
    this.scene = new THREE.Scene();

    // Sizes - use container dimensions
    const sizes = {
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight
    };

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    if (this.isMobile) {
      // Mobile: camara cerca (Z=0.55) y a media altura (Y=0.18) para libros
      // grandes (~59% del viewport) posicionados en el centro vertical de la
      // seccion. El book-info flotante esta oculto en mobile, asi que el
      // espacio inferior queda libre para el discover button.
      this.camera.position.set(0, 0.18, 0.55);
    } else {
      this.camera.position.set(0, 0.2, 0.5);
    }
    this.scene.add(this.camera);

    // Renderer - try WebGPU first, fallback to WebGL. Ambos con alpha:true
    // para que el bg del :host (CSS) se vea a traves del canvas sin mismatch.
    try {
      this.renderer = new WebGPURenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
      });
      await this.renderer.init();
    } catch (error) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        premultipliedAlpha: true
      });
    }
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 2);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 8);
    pointLight.position.set(0, 1, 3);
    this.scene.add(pointLight);

    // Raycaster
    this.raycaster = new THREE.Raycaster();

    // Books group
    this.booksGroup = new THREE.Group();
    this.scene.add(this.booksGroup);

    // Load model and textures
    this.loadBooks();

    // Event listeners
    this.setupEventListeners();

    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation
    this.animate();
  }

  private loadBooks() {
    const gltfLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Load textures
    const textures: THREE.Texture[] = [];
    for (let i = 0; i < this.books.length; i++) {
      const texture = textureLoader.load(`assets/book-covers/book${i + 1}.jpg`);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
    }

    // Load GLB model
    gltfLoader.load('assets/book.glb', (gltf: { scene: THREE.Group }) => {
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          const bookGeometry = child.geometry.clone();

          // Create books with different textures
          for (let i = 0; i < this.books.length; i++) {
            const bookMesh = new THREE.Mesh(
              bookGeometry.clone(),
              new THREE.MeshPhysicalMaterial({
                map: textures[i],
                roughness: 0.3,
                metalness: 0.1,
                clearcoat: 0.5,
                clearcoatRoughness: 0.2
              })
            );

            bookMesh.rotateX(Math.PI / 2);
            bookMesh.userData['baseRotationX'] = Math.PI / 2;
            bookMesh.userData['indexOffset'] = i - Math.floor(this.books.length / 2);
            bookMesh.userData['baseX'] = bookMesh.userData['indexOffset'] * this.carouselConfig.bookSpacing;
            bookMesh.userData['bookIndex'] = i;
            bookMesh.userData['bookData'] = this.books[i];

            bookMesh.position.x = bookMesh.userData['baseX'];
            bookMesh.position.y = Math.cos(bookMesh.userData['baseX']) * this.carouselConfig.curveHeight;
            bookMesh.rotateY(0.01);
            bookMesh.position.z = 0;

            this.booksGroup.add(bookMesh);
          }

          // Calculate carousel limits
          const firstBookBaseX = (0 - Math.floor(this.books.length / 2)) * this.carouselConfig.bookSpacing;
          const lastBookBaseX = ((this.books.length - 1) - Math.floor(this.books.length / 2)) * this.carouselConfig.bookSpacing;

          this.carouselMaxOffset = -firstBookBaseX;
          this.carouselMinOffset = -lastBookBaseX;

          // Initial offset to center first book
          const initialBookX = (0 - Math.floor(this.books.length / 2)) * this.carouselConfig.bookSpacing;
          this.carouselOffset = -initialBookX;
          this.targetCarouselOffset = this.carouselOffset;
        }
      });
    });
  }

  private setupEventListeners() {
    const canvas = this.canvasRef.nativeElement;

    // Mouse move
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    // Canvas enter/leave
    canvas.addEventListener('mouseenter', () => {
      this.isMouseOverCanvas = true;
    });

    canvas.addEventListener('mouseleave', () => {
      this.isMouseOverCanvas = false;
      this.isDragging = false;
    });

    // Mouse drag
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Wheel
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // Click
    canvas.addEventListener('click', this.onClick.bind(this));
  }

  private onMouseMove(event: MouseEvent) {
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.cursor.x = (event.clientX / sizes.width) * 2 - 1;
    this.cursor.y = -(event.clientY / sizes.height) * 2 + 1;

    if (this.isDragging) {
      // Track total distance to distinguish real drag from micro-movement
      const totalDx = Math.abs(event.clientX - this.mouseDownX);
      const totalDy = Math.abs(event.clientY - this.mouseDownY);
      if (totalDx > this.DRAG_THRESHOLD || totalDy > this.DRAG_THRESHOLD) {
        this.wasDragged = true;
      }

      const deltaX = event.clientX - this.lastDragX;
      const newOffset = this.targetCarouselOffset + deltaX * this.carouselConfig.dragSensitivity;
      this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));
      this.lastDragX = event.clientX;
    }
  }

  private onMouseDown(event: MouseEvent) {
    this.cancelSnap();
    this.isDragging = true;
    this.wasDragged = false;
    this.mouseDownX = event.clientX;
    this.mouseDownY = event.clientY;
    this.lastDragX = event.clientX;
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = 'grabbing';
  }

  private onMouseUp() {
    if (this.isDragging) {
      this.snapToNearestBook();
    }
    this.isDragging = false;
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = 'default';
  }

  private onTouchStart(event: TouchEvent) {
    this.cancelSnap();
    // Guardar posición inicial para detectar dirección
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.lastDragX = this.touchStartX;
    this.isDragging = true;
    this.isHorizontalSwipe = false; // Resetear hasta determinar dirección
  }

  private onTouchMove(event: TouchEvent) {
    if (this.isDragging && event.touches.length > 0) {
      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      const deltaX = Math.abs(currentX - this.touchStartX);
      const deltaY = Math.abs(currentY - this.touchStartY);
      
      // Determinar dirección del movimiento (solo una vez al inicio)
      if (!this.isHorizontalSwipe && deltaX + deltaY > 10) {
        this.isHorizontalSwipe = deltaX > deltaY;
      }
      
      // Solo interceptar si el movimiento es principalmente horizontal
      if (this.isHorizontalSwipe) {
      event.preventDefault();
        const moveDeltaX = currentX - this.lastDragX;
        const newOffset = this.targetCarouselOffset + moveDeltaX * this.carouselConfig.dragSensitivity;
      this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));
        this.lastDragX = currentX;
      }
      // Si es movimiento vertical, no hacer preventDefault() para permitir scroll normal
    }
  }

  private onTouchEnd(event: TouchEvent) {
    // Solo hacer preventDefault si era un swipe horizontal
    if (this.isHorizontalSwipe) {
      event.preventDefault();
      this.snapToNearestBook();
    }
    this.isDragging = false;
    this.isHorizontalSwipe = false;
  }

  private onWheel(event: WheelEvent) {
    if (this.isMouseOverCanvas) {
      // Detectar si el scroll es principalmente horizontal o vertical
      const isHorizontalScroll = Math.abs(event.deltaX) > Math.abs(event.deltaY);

      if (isHorizontalScroll) {
        // Scroll horizontal: controlar el carrusel
        event.preventDefault();
        this.cancelSnap();
        const newOffset = this.targetCarouselOffset - event.deltaX * this.carouselConfig.scrollSensitivity;
        this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));

        // Snap diferido tras 180ms sin nuevos eventos de wheel
        if (this.wheelSnapTimer) clearTimeout(this.wheelSnapTimer);
        this.wheelSnapTimer = setTimeout(() => this.snapToNearestBook(), 180);
      }
      // Si es scroll vertical, no hacer preventDefault() para permitir scroll normal de la página
    }
  }

  /**
   * Snap a la posicion del libro mas cercano. Animacion duration-based con
   * ease-out-quart para que el settle se sienta cojin (no como un salto).
   * Duracion escalada por distancia: distancias mayores → tiempo proporcional.
   */
  private snapToNearestBook(): void {
    if (!isFinite(this.carouselMinOffset) || !isFinite(this.carouselMaxOffset)) return;

    const step = this.carouselConfig.bookSpacing;
    const snapped = Math.round(this.targetCarouselOffset / step) * step;
    const clampedTarget = Math.max(
      this.carouselMinOffset,
      Math.min(this.carouselMaxOffset, snapped)
    );

    // Si ya estamos donde queremos (< 1% de un step), no animar.
    if (Math.abs(this.carouselOffset - clampedTarget) < step * 0.01) {
      this.targetCarouselOffset = clampedTarget;
      this.carouselOffset = clampedTarget;
      return;
    }

    // Iniciar animacion duration-based desde la posicion actual
    this.snapStartOffset = this.carouselOffset;
    this.snapTargetOffset = clampedTarget;
    this.snapStartTime = performance.now();

    // Duracion escalada: mas larga si la distancia es mayor (sensacion natural).
    // Para una distancia de 1 libro entero, ~520ms. Distancias chicas → 380ms.
    const distance = Math.abs(clampedTarget - this.snapStartOffset);
    const distanceFactor = Math.min(1, distance / step);
    this.snapDurationMs = this.SNAP_MIN_MS + (this.SNAP_MAX_MS - this.SNAP_MIN_MS) * distanceFactor;

    this.isSnapping = true;
  }

  /** Cancela cualquier snap en curso (cuando el usuario empieza un drag nuevo). */
  private cancelSnap(): void {
    if (this.isSnapping) {
      this.targetCarouselOffset = this.carouselOffset; // congelar donde estamos
      this.isSnapping = false;
    }
  }

  private onClick(event: MouseEvent) {
    // Ignore click if user actually dragged (moved pointer beyond threshold)
    if (this.wasDragged) {
      this.wasDragged = false;
      return;
    }

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.mouse.x = (event.clientX / sizes.width) * 2 - 1;
    this.mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.booksGroup.children);

    if (intersects.length > 0) {
      const clickedBook = intersects[0].object as THREE.Mesh;
      const bookData = clickedBook.userData['bookData'] as BookData;
      if (bookData && bookData.url) {
        this.router.navigateByUrl(bookData.url);
      } else if (bookData && bookData.id) {
        this.router.navigate(['/book', bookData.id]);
      }
    }
  }

  /**
   * Desplaza el carrusel al libro anterior, garantizando que el destino
   * cae exactamente sobre un libro (animacion duration-based con ease-out).
   */
  onPrevClick() {
    const step = this.carouselConfig.bookSpacing;
    const currentSnapped = Math.round(this.carouselOffset / step) * step;
    this.targetCarouselOffset = Math.max(
      this.carouselMinOffset,
      Math.min(this.carouselMaxOffset, currentSnapped + step)
    );
    this.snapToNearestBook();
  }

  /**
   * Desplaza el carrusel al libro siguiente, garantizando que el destino
   * cae exactamente sobre un libro (animacion duration-based con ease-out).
   */
  onNextClick() {
    const step = this.carouselConfig.bookSpacing;
    const currentSnapped = Math.round(this.carouselOffset / step) * step;
    this.targetCarouselOffset = Math.max(
      this.carouselMinOffset,
      Math.min(this.carouselMaxOffset, currentSnapped - step)
    );
    this.snapToNearestBook();
  }

  /**
   * Navega al detalle del libro centrado actualmente.
   */
  /** Navega al libro centrado si tiene URL. */
  onDiscoverClick() {
    const currentBook = this.currentBook();
    if (currentBook) {
      if (currentBook.url) {
        this.router.navigateByUrl(currentBook.url);
      } else if (currentBook.id) {
        this.router.navigate(['/book', currentBook.id]);
      }
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    // Limit offset
    this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, this.targetCarouselOffset));

    // Animate carousel offset.
    // - Durante drag/wheel: lerp exponencial (sensible, interruptible)
    // - Durante snap: animacion duration-based con ease-out-quart para que
    //   el settle sea cojin/smooth en vez de un salto.
    if (this.isSnapping) {
      const elapsed = performance.now() - this.snapStartTime;
      const t = Math.min(1, elapsed / this.snapDurationMs);
      // ease-out-quart: 1 - (1-t)^4 — fuerte deceleracion al final
      const eased = 1 - Math.pow(1 - t, 4);
      this.carouselOffset = this.snapStartOffset + (this.snapTargetOffset - this.snapStartOffset) * eased;
      this.targetCarouselOffset = this.snapTargetOffset; // mantener target locked durante snap
      if (t >= 1) {
        this.isSnapping = false;
        this.carouselOffset = this.snapTargetOffset;
      }
    } else {
      this.carouselOffset = THREE.MathUtils.lerp(
        this.carouselOffset,
        this.targetCarouselOffset,
        this.carouselConfig.smoothness
      );
    }

    // Find center book
    let centerBookIndex: number | null = null;
    let closestToCenter = Infinity;

    // Update positions and rotations
    this.booksGroup.children.forEach((book: THREE.Object3D) => {
      const bookMesh = book as THREE.Mesh;
      const newX = bookMesh.userData['baseX'] + this.carouselOffset;
      bookMesh.position.x = newX;

      // Detect center book
      const distanceFromCenter = Math.abs(newX);
      if (distanceFromCenter < closestToCenter) {
        closestToCenter = distanceFromCenter;
        centerBookIndex = bookMesh.userData['bookIndex'];
      }

      // Recalculate Y based on X (cosine curve)
      bookMesh.position.y = Math.cos(newX) * this.carouselConfig.curveHeight;

      // Calculate rotation direction
      const isLeft = newX < 0;

      // Interpolation for Z rotation based on distance from center
      let targetRotationZ = 0;
      if (distanceFromCenter > this.carouselConfig.rotationStartDistance) {
        const rotationProgress = Math.min(1,
          (distanceFromCenter - this.carouselConfig.rotationStartDistance) /
          (this.carouselConfig.rotationFullDistance - this.carouselConfig.rotationStartDistance)
        );
        targetRotationZ = rotationProgress * Math.PI * (isLeft ? 1 : -1);
      }

      bookMesh.rotation.z = THREE.MathUtils.lerp(
        bookMesh.rotation.z,
        targetRotationZ,
        this.carouselConfig.rotationSmoothness
      );

      // Tilt based on cursor
      let targetRotationX = bookMesh.userData['baseRotationX'];
      targetRotationX += -this.cursor.y * this.parameters.maxTiltAngle;

      bookMesh.rotation.x = THREE.MathUtils.lerp(
        bookMesh.rotation.x,
        targetRotationX,
        this.parameters.lookAtSmoothness
      );
    });

    // Update background color and current book.
    // El bg lo pinta CSS sobre el :host element (con transition smooth).
    // Solo escribimos cuando cambia el libro centrado para evitar style writes
    // en cada frame.
    if (centerBookIndex !== null) {
      if (centerBookIndex !== this.lastAppliedBookIndex) {
        this.lastAppliedBookIndex = centerBookIndex;
        const color = this.bookBackgroundColors[centerBookIndex % this.bookBackgroundColors.length];
        this.elementRef.nativeElement.style.backgroundColor =
          '#' + color.toString(16).padStart(6, '0');
      }
      this.centerBookIndex.set(centerBookIndex);
      this.currentBook.set(this.books[centerBookIndex]);
    }

    // Update mouse for raycaster
    this.mouse.x = this.cursor.x;
    this.mouse.y = this.cursor.y;

    // Raycast for cursor change
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.booksGroup.children);

    const canvas = this.canvasRef.nativeElement;
    if (!this.isDragging) {
      if (intersects.length > 0) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize() {
    const canvas = this.canvasRef?.nativeElement;
    const container = canvas?.parentElement;
    
    if (!container || !this.renderer || !this.camera) return;

    const sizes = {
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight
    };

    const isMobileNow = window.innerWidth < 768;
    if (isMobileNow) {
      this.camera.position.set(0, 0.18, 0.55);
    } else {
      this.camera.position.set(0, 0.2, 0.5);
    }

    this.camera.aspect = sizes.width / sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private cleanup() {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.wheelSnapTimer) {
      clearTimeout(this.wheelSnapTimer);
      this.wheelSnapTimer = null;
    }

    // Dispose of Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

