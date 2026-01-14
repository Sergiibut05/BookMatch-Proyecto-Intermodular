import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface BookData {
  title: string;
  author: string;
  coverImage: string;
  url?: string;
  id?: number;
}

@Component({
  selector: 'app-book-carousel-3d',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-carousel-3d.component.html',
  styleUrl: './book-carousel-3d.component.scss',
})
export class BookCarousel3dComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  @Input() books: BookData[] = [];
  @Input() title: string = 'The Best Selling Books';
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

  // Current center book
  centerBookIndex = signal<number | null>(null);
  currentBook = signal<BookData | null>(null);

  // Background colors for each book
  private bookBackgroundColors = [
    0xDFEFED,
    0xFFE5E5,
    0xE5FFE5,
    0xFFFFF5,
    0xFFF5E5
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.updateMobileConfig();
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      if (this.canvasRef && this.books.length > 0) {
        this.initThree();
      }
    }, 0);
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private updateMobileConfig() {
    if (this.isMobile) {
      this.carouselConfig.dragSensitivity = 0.002;
      this.carouselConfig.buttonStep = 0.3;
      this.carouselConfig.bookSpacing = 0.3;
      this.carouselConfig.curveHeight = 0.30;
    }
  }

  private async initThree() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    
    if (!container) {
      console.error('Canvas container not found');
      return;
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor);

    // Sizes - use container dimensions
    const sizes = {
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight
    };

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    if (this.isMobile) {
      this.camera.position.set(0, 0.3, 0.7);
    } else {
      this.camera.position.set(0, 0.2, 0.5);
    }
    this.scene.add(this.camera);

    // Renderer - try WebGPU first, fallback to WebGL
    try {
      this.renderer = new WebGPURenderer({
        canvas: canvas,
        antialias: true
      });
      await this.renderer.init();
    } catch (error) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
      });
    }
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
      const deltaX = event.clientX - this.lastDragX;
      const newOffset = this.targetCarouselOffset + deltaX * this.carouselConfig.dragSensitivity;
      this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));
      this.lastDragX = event.clientX;
    }
  }

  private onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.lastDragX = event.clientX;
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = 'grabbing';
  }

  private onMouseUp() {
    this.isDragging = false;
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = 'default';
  }

  private onTouchStart(event: TouchEvent) {
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
        const newOffset = this.targetCarouselOffset - event.deltaX * this.carouselConfig.scrollSensitivity;
        this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));
      }
      // Si es scroll vertical, no hacer preventDefault() para permitir scroll normal de la página
    }
  }

  private onClick(event: MouseEvent) {
    if (!this.isDragging) {
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
  }

  onPrevClick() {
    const newOffset = this.targetCarouselOffset + this.carouselConfig.buttonStep;
    this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));
  }

  onNextClick() {
    const newOffset = this.targetCarouselOffset - this.carouselConfig.buttonStep;
    this.targetCarouselOffset = Math.max(this.carouselMinOffset, Math.min(this.carouselMaxOffset, newOffset));
  }

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

    // Animate carousel offset smoothly
    this.carouselOffset = THREE.MathUtils.lerp(
      this.carouselOffset,
      this.targetCarouselOffset,
      this.carouselConfig.smoothness
    );

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

    // Update background color and current book
    if (centerBookIndex !== null) {
      const targetColor = new THREE.Color(this.bookBackgroundColors[centerBookIndex % this.bookBackgroundColors.length]);
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.lerp(targetColor, 0.05);
      } else {
        this.scene.background = targetColor;
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
      this.camera.position.set(0, 0.3, 0.7);
    } else {
      this.camera.position.set(0, 0.2, 0.5);
    }

    this.camera.aspect = sizes.width / sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private cleanup() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    // Dispose of Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

