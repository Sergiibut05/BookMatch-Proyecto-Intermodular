# 📚 BookMatch - Proyecto Intermodular

![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Angular](https://img.shields.io/badge/Angular-20.3-red)
![Firebase](https://img.shields.io/badge/Firebase-11.10-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## 🎯 Descripción del Proyecto

**BookMatch** es una aplicación móvil y web que combina la compra de libros (nuevos y de segunda mano) con un sistema innovador de recomendaciones personalizadas mediante inteligencia artificial y una plataforma de trueque digital entre lectores.

La idea surge de la necesidad de fomentar la lectura y adaptarse a las nuevas tendencias de consumo sostenible, uniendo tres conceptos clave:
- 📖 **Lectura y cultura**
- 💻 **Digitalización**
- ♻️ **Economía circular**

---

## 🚀 Estado Actual del Proyecto

### ✅ Completado

- [x] Configuración inicial del proyecto Angular 20
- [x] Integración con Firebase Authentication
- [x] Integración con Firebase Realtime Database
- [x] Sistema de autenticación completo:
  - Login con email/contraseña
  - Registro de usuarios
  - Login con Google OAuth
  - Guards de protección de rutas
- [x] Animación de carga (Splash Screen)
- [x] Estructura de carpetas escalable (core, shared, features)
- [x] Componentes standalone modernos
- [x] Diseño responsive y UI moderna

### 🔄 En Progreso

- [ ] Catálogo de libros (nuevos y usados)
- [ ] Sistema de trueque digital
- [ ] Sistema de recomendaciones con IA (n8n)
- [ ] Comunidad lectora (foros y reseñas)
- [ ] Perfil de usuario
- [ ] Sistema de notificaciones

### 📅 Planificado

Ver el backlog completo en [Jira](https://tu-jira-url.atlassian.net)

---

## 🏗️ Arquitectura del Proyecto

```
BookMatch-Proyecto-Intermodular/
│
├── BookMatch-Angular/          # Frontend Web (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Servicios singleton, guards, interceptors
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts
│   │   │   │   └── services/
│   │   │   │       └── auth.service.ts
│   │   │   │
│   │   │   ├── shared/        # Componentes reutilizables
│   │   │   │   └── components/
│   │   │   │       └── loader/
│   │   │   │
│   │   │   ├── features/      # Módulos funcionales
│   │   │   │   ├── auth/      # Login y registro
│   │   │   │   ├── home/      # Dashboard principal
│   │   │   │   ├── books/     # (Próximamente)
│   │   │   │   ├── trueque/   # (Próximamente)
│   │   │   │   └── profile/   # (Próximamente)
│   │   │   │
│   │   │   └── app.routes.ts  # Configuración de rutas
│   │   │
│   │   └── environments/      # Variables de entorno
│   │
│   └── package.json
│
└── README.md                   # Este archivo
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 20.3** - Framework principal
- **TypeScript 5.9** - Lenguaje de programación
- **SCSS** - Preprocesador CSS
- **RxJS** - Programación reactiva

### Backend y Servicios
- **Firebase Authentication** - Gestión de usuarios
- **Firebase Realtime Database** - Base de datos en tiempo real
- **n8n** - Automatización y recomendaciones IA (próximamente)

### Herramientas de Desarrollo
- **Angular CLI** - Herramientas de desarrollo
- **Git/GitHub** - Control de versiones
- **Jira** - Gestión de proyecto (Scrum)
- **Figma** - Diseño UI/UX
- **VS Code/Cursor** - Editor de código

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v20 o superior) - [Descargar](https://nodejs.org/)
- **npm** (v10 o superior) - Viene con Node.js
- **Angular CLI** - Se instalará con el proyecto
- **Git** - [Descargar](https://git-scm.com/)

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular.git
cd BookMatch-Proyecto-Intermodular/BookMatch-Angular
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

Crea los archivos de configuración de Firebase con tus credenciales:

**`src/environments/environment.ts`**
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID",
    databaseURL: "TU_DATABASE_URL"
  }
};
```

**`src/environments/environment.prod.ts`**
```typescript
export const environment = {
  production: true,
  firebase: {
    // Mismas credenciales de Firebase
  }
};
```

> **Nota:** Obtén tus credenciales desde la [Consola de Firebase](https://console.firebase.google.com/)

### 4. Ejecutar la Aplicación

#### Modo Desarrollo
```bash
npm start
# o
ng serve
```

La aplicación estará disponible en: `http://localhost:4200`

#### Modo Desarrollo con puerto personalizado
```bash
ng serve --port 4300
```

#### Build para Producción
```bash
npm run build
# o
ng build --configuration production
```

Los archivos se generarán en `dist/`

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm test
# o
ng test

# Ejecutar tests con coverage
ng test --code-coverage
```

---

## 📱 Funcionalidades Actuales

### 🔐 Autenticación
- ✅ Registro con email y contraseña
- ✅ Login con email y contraseña
- ✅ Login con Google OAuth
- ✅ Cierre de sesión
- ✅ Protección de rutas con Guards
- ✅ Validación de formularios reactivos
- ✅ Manejo de errores de Firebase

### 🎨 Interfaz
- ✅ Splash screen animado con libro 3D
- ✅ Diseño moderno con gradientes
- ✅ Formularios con validación en tiempo real
- ✅ Responsive design
- ✅ Animaciones y transiciones suaves

---

## 👥 Equipo de Desarrollo

| Rol | Responsabilidades |
|-----|-------------------|
| **Samuel** | Backend + QA + Scrum Master<br>• Responsable técnico del backend (API, trueque, BD)<br>• Documentación API (Swagger)<br>• QA técnico y gestión de tareas |
| **Lucas** | UX/UI Lead + Contenido Visual + QA Visual<br>• Diseño de interfaz en Figma<br>• Recursos gráficos<br>• Recomendaciones IA con n8n<br>• Apoyo frontend/backend |
| **Sergii** | Frontend Developer (Web + Mobile)<br>• Desarrollo web en Angular<br>• App móvil en Kotlin (Android Studio)<br>• Integración Firebase y API backend |

---

## 📊 Metodología de Trabajo

El proyecto sigue la metodología **Scrum** con sprints de **1 mes** de duración:

- **Sprint 1** ✅ - Configuración inicial del sistema y base de datos
- **Sprint 2** ✅ - Registro e inicio de sesión
- **Sprint 3** 🔄 - Catálogo básico de libros / Gestión de perfil
- **Sprint 4** 📅 - Sistema de trueque digital / Notificaciones
- **Sprint 5** 📅 - Sistema de recomendaciones IA / Comunidad lectora

---

## 🎯 Objetivos SMART

### 1. Lanzamiento del MVP funcional
- **S**: MVP con registro, compra y trueque
- **M**: Uso básico medido con testers
- **A**: Tecnologías disponibles (Firebase, Angular, Kotlin)
- **R**: Validar idea y fomentar lectura sostenible
- **T**: 3 meses

### 2. Sistema de recomendaciones IA
- **S**: Recomendaciones personalizadas basadas en IA
- **M**: Relevancia de sugerencias observada con testers
- **A**: Uso de n8n y análisis de datos
- **R**: Mejorar experiencia e impulsar economía circular
- **T**: 2 meses post-MVP

### 3. Comunidad lectora
- **S**: Foros, reseñas e intercambios
- **M**: Participación y ejemplos de interacciones
- **A**: Usuarios de prueba (compañeros/conocidos)
- **R**: Evaluar valor de función social
- **T**: 3 meses desde activación

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start              # Inicia servidor de desarrollo
npm run watch         # Build con watch mode

# Build
npm run build         # Build para producción

# Testing
npm test              # Tests unitarios
```

---

## 🐛 Solución de Problemas

### Error: Cannot find module '@angular/fire'
```bash
npm install firebase @angular/fire
```

### Error: Module resolution
Verifica que `tsconfig.json` tenga:
```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

### Error: Puerto ya en uso
```bash
ng serve --port 4300
```

---

## 📚 Recursos y Documentación

- [Angular Documentation](https://angular.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 🤝 Contribuir

Este es un proyecto académico intermodular. Las contribuciones del equipo se coordinan a través de:

1. **Jira** - Gestión de tareas y sprints
2. **GitHub** - Control de versiones
3. **Discord** - Comunicación del equipo

### Workflow de Git


---

## 📝 Licencia

Este proyecto es parte de un trabajo académico intermodular.

---

## 📞 Contacto

Para más información sobre el proyecto:
- **Repositorio**: [BookMatch-Proyecto-Intermodular](https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular)

---

## ⭐ Agradecimientos

- Profesores y tutores del proyecto intermodular
- Comunidad de Angular
- Firebase team
- Beta testers

---

**Última actualización:** Octubre 2025

**Versión:** 0.1.0 (MVP en desarrollo)

