# 🌳 Git Workflow - BookMatch Team

> Guía rápida para trabajar con ramas en el proyecto BookMatch

---

## 📋 Estructura de Ramas

```
main (producción)
  ↓
develop (integración del equipo)
  ↓
  ├── sergii (Frontend: Angular + Kotlin)
  ├── samuel (Backend: API + BD + QA)
  └── lucas (UX/UI + IA + Diseño)
```

### Descripción de Ramas

| Rama | Propósito | Quién trabaja aquí |
|------|-----------|-------------------|
| `main` | Código en producción, estable | Nadie directamente |
| `develop` | Integración del equipo | Todos (vía merge) |
| `sergii` | Desarrollo Frontend | Sergii |
| `samuel` | Desarrollo Backend | Samuel |
| `lucas` | Desarrollo UI/UX + IA | Lucas |

---

## 🚀 Setup Inicial (Una sola vez)

### Clonar el Proyecto
```bash
git clone https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular.git
cd BookMatch-Proyecto-Intermodular
```

### Crear tu Rama Personal
```bash
# Cada miembro crea su rama desde develop
git checkout develop
git checkout -b TU_NOMBRE  # sergii, samuel, o lucas
git push origin TU_NOMBRE
```

---

## 📅 Workflow Diario

### 1️⃣ Empezar a Trabajar (Cada Día)

```bash
# Ir a tu rama personal
git checkout sergii  # (o samuel, o lucas)

# Traer cambios recientes de develop
git pull origin develop

# Ver el estado de tu rama
git status
```

### 2️⃣ Trabajar y Guardar Progreso

```bash
# Hacer cambios en tu código...
# Editar archivos, crear componentes, etc.

# Ver qué cambios hiciste
git status
git diff

# Guardar tu trabajo
git add .
git commit -m "feat: descripción de lo que hiciste"

# Subir a GitHub (tu rama)
git push origin sergii  # (o tu rama)
```

### 3️⃣ Integrar tu Trabajo a Develop (Cuando terminas algo)

#### Opción A: Merge Directo (Rápido)

```bash
# 1. Ir a develop
git checkout develop

# 2. Actualizar develop
git pull origin develop

# 3. Mergear tu rama
git merge sergii  # (o tu rama)

# 4. Si todo OK, subir
git push origin develop

# 5. Avisar en Discord
# "✅ Login terminado y en develop"

# 6. Volver a tu rama
git checkout sergii
```

#### Opción B: Pull Request (Recomendado)

```bash
# 1. Asegurarte que tu rama está actualizada
git push origin sergii

# 2. Ir a GitHub:
#    https://github.com/Sergiibut05/BookMatch-Proyecto-Intermodular

# 3. Click en "Compare & pull request"
# 4. Base: develop ← Compare: sergii
# 5. Título: "feat: Login component terminado"
# 6. Descripción: Explicar qué hiciste
# 7. Asignar reviewer (Samuel o Lucas)
# 8. Create pull request

# 9. Avisar en Discord
# 10. Esperar aprobación y merge
```

### 4️⃣ Mantener tu Rama Actualizada

```bash
# Cuando alguien haga merge a develop
git checkout sergii  # tu rama
git merge develop    # traer cambios de develop
git push origin sergii
```

---

## 🎯 Comandos Más Usados

### Ver Estado
```bash
git status              # Ver cambios actuales
git log --oneline      # Ver historial de commits
git branch             # Ver todas las ramas
git branch -a          # Ver ramas locales y remotas
```

### Guardar Trabajo
```bash
git add .                           # Agregar todos los cambios
git add archivo.ts                  # Agregar archivo específico
git commit -m "mensaje"             # Guardar con mensaje
git push origin sergii              # Subir a GitHub
```

### Actualizar
```bash
git pull origin develop             # Traer cambios de develop
git pull origin sergii              # Traer cambios de tu rama
git merge develop                   # Mergear develop en tu rama
```

### Cambiar de Rama
```bash
git checkout sergii                 # Ir a tu rama
git checkout develop                # Ir a develop
git checkout -b nueva-rama          # Crear y cambiar a nueva rama
```

---

## 💬 Convención de Commits

Usar **Conventional Commits** para mensajes claros:

### Formato
```
tipo(scope): descripción corta

feat: nueva funcionalidad
fix: corrección de bug
style: cambios de estilo (sin lógica)
refactor: refactorización de código
docs: cambios en documentación
test: añadir o modificar tests
chore: tareas de mantenimiento
```

### Ejemplos
```bash
git commit -m "feat(auth): implement login with Firebase"
git commit -m "fix(loader): center book animation"
git commit -m "style(login): improve button hover effect"
git commit -m "refactor(auth): optimize auth service"
git commit -m "docs: update README with setup instructions"
git commit -m "test(login): add unit tests for validation"
git commit -m "chore: update dependencies"
```

### Ejemplos Específicos del Proyecto
```bash
# Sergii (Frontend)
git commit -m "feat(home): add book catalog component"
git commit -m "style(login): improve responsive design"
git commit -m "fix(routing): correct navigation guard"

# Samuel (Backend)
git commit -m "feat(api): create trueque endpoints"
git commit -m "fix(database): correct Firebase connection"
git commit -m "test(auth): add integration tests"

# Lucas (UX/UI)
git commit -m "feat(design): add design system colors"
git commit -m "feat(ai): implement book recommendation logic"
git commit -m "docs(figma): update design documentation"
```

---

## 🚨 Resolver Conflictos

### ¿Qué son los conflictos?

Ocurren cuando **tú y otro compañero editaron las mismas líneas del mismo archivo**.

### Cómo Resolverlos

```bash
# 1. Intentas mergear
git merge develop

# 2. Git dice: "CONFLICT in archivo.ts"

# 3. Abrir el archivo, verás algo como:
<<<<<<< HEAD (tu versión)
export class AuthService {
  login() { /* tu código */ }
}
=======
export class AuthService {
  login() { /* código de otro */ }
}
>>>>>>> develop

# 4. Decidir qué versión mantener:
#    - Tu versión
#    - La otra versión
#    - Combinar ambas

# 5. Eliminar las marcas <<<<, ====, >>>>

# 6. Guardar el archivo

# 7. Marcar como resuelto
git add archivo.ts
git commit -m "fix: resolve merge conflict in auth service"
git push origin sergii
```

### Tips para Evitar Conflictos

✅ Hacer `git pull origin develop` frecuentemente  
✅ Comunicar en Discord qué archivos estás editando  
✅ Mergear a develop seguido (no acumular días de trabajo)  
✅ Dividir el trabajo en archivos diferentes cuando sea posible  

---

## ⚠️ Reglas Importantes

### ✅ SÍ Puedes:
- Hacer commits directos en **tu rama personal** (sergii/samuel/lucas)
- Experimentar libremente en **tu rama**
- Hacer push a **tu rama** cuantas veces quieras
- Mergear **tu rama → develop** cuando termines algo
- Pedir ayuda si tienes dudas

### ❌ NO Hagas:
- ~~Trabajar directamente en `develop` (sin PR o aviso)~~
- ~~Trabajar directamente en `main` (nunca)~~
- ~~Hacer `git push --force` en develop o main~~
- ~~Mergear sin avisar al equipo~~
- ~~Borrar ramas de otros compañeros~~

### 📢 Comunicación:
- ✅ Avisar en **Discord** cuando hagas merge a develop
- ✅ Revisar al menos 1 PR de un compañero por sprint
- ✅ Pedir ayuda a Samuel (Scrum Master) si hay problemas
- ✅ Compartir pantalla en Discord si hay conflictos complejos

---

## 🔄 Ciclo de Sprint (cada mes)

```
Sprint Inicia (Día 1)
    ↓
Cada uno trabaja en su rama personal
    ├── Sergii: desarrolla frontend
    ├── Samuel: desarrolla backend
    └── Lucas: trabaja en UI/UX + IA
    ↓
Integraciones frecuentes a develop
    ├── PR 1: Login terminado
    ├── PR 2: Auth API lista
    └── PR 3: Diseño implementado
    ↓
Sprint Review (Final del mes)
    ↓
Samuel: develop → main
    ↓
Tag: v1.0.0, v1.1.0, etc.
    ↓
Nuevo Sprint comienza desde develop actualizado
```

---

## 🛡️ Comandos Seguros vs Peligrosos

### ✅ SEGUROS (no pierdes trabajo)
```bash
git status                  # Ver estado
git log                     # Ver historial
git diff                    # Ver cambios
git add .                   # Preparar archivos
git commit -m "mensaje"     # Guardar trabajo
git push origin rama        # Subir trabajo
git pull origin develop     # Traer cambios (seguro si hiciste commit)
git merge develop           # Mergear (seguro si hiciste commit)
```

### ⚠️ PELIGROSOS (pueden borrar trabajo)
```bash
git reset --hard           # ❌ Borra cambios sin commit
git clean -fd              # ❌ Borra archivos nuevos
git checkout -- archivo    # ❌ Descarta cambios del archivo
git push --force           # ❌ Sobrescribe remoto (¡NUNCA!)
git branch -D rama         # ❌ Borra rama sin merge
```

---

## 💡 Guía Rápida por Situación

### "Voy a empezar a trabajar hoy"
```bash
git checkout sergii
git pull origin develop
# Trabajar...
```

### "Terminé una funcionalidad"
```bash
git add .
git commit -m "feat: descripción"
git push origin sergii
# Crear PR en GitHub o hacer merge directo
```

### "Otro compañero subió cambios a develop"
```bash
git checkout sergii
git merge develop
# Si hay conflictos, resolverlos
git push origin sergii
```

### "Necesito cambiar de rama"
```bash
# IMPORTANTE: Guardar primero
git add .
git commit -m "wip: trabajo en progreso"
git checkout otra-rama
```

### "Cometí un error en mi último commit"
```bash
# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1
# Editar archivos
git add .
git commit -m "feat: mensaje corregido"
```

### "Quiero ver qué cambió en develop"
```bash
git checkout develop
git pull origin develop
git log --oneline -10
```

---

## 🎓 Recursos y Ayuda

### Documentación
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Herramientas Visuales
- **VS Code**: Extensión GitLens
- **GitHub Desktop**: Cliente visual de Git
- **GitKraken**: Visualizar ramas y commits

### Comandos de Ayuda
```bash
git help                    # Ayuda general
git help commit             # Ayuda de comando específico
git status                  # Ver estado actual
```

### Pedir Ayuda al Equipo
1. **Discord**: Canal de #desarrollo
2. **Samuel** (Scrum Master): Resolver conflictos complejos
3. **Screenshot**: Capturar pantalla del error
4. **Pair Programming**: Compartir pantalla en Discord

---

## 📝 Checklist Diario

### Al Empezar el Día ☀️
- [ ] `git checkout mi-rama`
- [ ] `git pull origin develop`
- [ ] `git status` (verificar estado)
- [ ] Revisar Discord por cambios del equipo

### Durante el Trabajo 💻
- [ ] Commits frecuentes (cada 1-2 horas)
- [ ] Mensajes de commit descriptivos
- [ ] `git push` al final de cada sesión
- [ ] Comunicar avances en Discord

### Al Terminar el Día 🌙
- [ ] `git add .`
- [ ] `git commit -m "wip: descripción"`
- [ ] `git push origin mi-rama`
- [ ] Si terminaste algo: Crear PR o mergear a develop
- [ ] Avisar al equipo en Discord

### Al Terminar una Funcionalidad ✅
- [ ] Probar que todo funciona
- [ ] Commit final con mensaje claro
- [ ] Push a tu rama
- [ ] Crear PR o mergear a develop
- [ ] Avisar en Discord
- [ ] Actualizar Jira

---

## 🏆 Buenas Prácticas

### Commits
✅ Commits pequeños y frecuentes  
✅ Mensajes descriptivos y en español  
✅ Un commit = una funcionalidad/fix  
❌ Evitar commits gigantes con 100 archivos  

### Branches
✅ Siempre trabajar en tu rama personal  
✅ Mantener tu rama actualizada con develop  
✅ Mergear a develop cuando algo está terminado  
❌ No acumular semanas de trabajo sin integrar  

### Comunicación
✅ Avisar cuando haces merge a develop  
✅ Comentar en PRs de tus compañeros  
✅ Pedir reviews antes de mergear  
✅ Compartir problemas en Discord  

### Código
✅ Probar localmente antes de push  
✅ No subir archivos de configuración personal  
✅ Respetar el `.gitignore`  
✅ Resolver linter errors antes de commit  

---

## 🚀 Comandos para Copiar y Pegar

### Setup de tu Rama (Primera vez)
```bash
git checkout develop
git pull origin develop
git checkout -b TU_NOMBRE
git push origin TU_NOMBRE
```

### Workflow Diario Completo
```bash
# Mañana
git checkout sergii
git pull origin develop
# ... trabajar ...

# Tarde
git add .
git commit -m "feat: descripción de tu trabajo"
git push origin sergii

# Si terminaste algo
git checkout develop
git pull origin develop
git merge sergii
git push origin develop
git checkout sergii
```

### Actualizar tu Rama con Develop
```bash
git checkout sergii
git merge develop
git push origin sergii
```

---

## 📞 Contactos del Equipo

| Miembro | Rol | Rama | Responsabilidad Git |
|---------|-----|------|---------------------|
| **Sergii** | Frontend Developer | `sergii` | PRs de UI/Frontend |
| **Samuel** | Backend + Scrum Master | `samuel` | Aprobar PRs, develop→main |
| **Lucas** | UX/UI + IA | `lucas` | PRs de diseño y IA |

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0

---

> 💡 **Tip:** Guarda este archivo en favoritos y consúltalo cada vez que tengas dudas sobre Git.

> 🆘 **¿Perdido?** Pregunta en Discord antes de ejecutar comandos que no entiendas.

