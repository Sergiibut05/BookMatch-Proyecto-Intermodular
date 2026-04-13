---
description: BookMatch Git — ramas personales (sergii/samuel/lucas), integrar develop antes de trabajar, merge seguro hacia develop. Usar al empezar tarea, antes de commit o merge. @bookmatch-git-branches
alwaysApply: false
---

# BookMatch — Git: ramas personales y merge seguro

**Invocación:** **@bookmatch-git-branches** cuando vayas a **empezar una tarea**, **hacer commit**, **integrar en develop** o **resolver conflictos**. No usamos una rama por tarea: cada persona trabaja en **su rama fija** y fusiona en **`develop`** con cuidado.

Fuente humana detallada: **`GIT-WORKFLOW.md`** en la raíz del repo.

## Modelo de ramas

| Rama | Uso |
|------|-----|
| `main` | Producción estable; no trabajar directamente. |
| `develop` | Integración del equipo; aquí convergen los merges. |
| `sergii` / `samuel` / `lucas` | Rama **personal** por desarrollador; todo el trabajo diario va aquí (no `feature/SCRUM-xxx` salvo acuerdo excepcional del equipo). |

## Al empezar el día o una tarea nueva (obligatorio antes de tocar código)

1. Confirmar en qué rama estás: `git status` / `git branch --show-current`.
2. Cambiar a **tu rama personal**: `git checkout <tu-rama>` (p. ej. `sergii`).
3. Traer remoto: `git fetch origin`.
4. Integrar **siempre** los últimos cambios de **`develop`** en tu rama **antes** de implementar:
   - `git pull origin develop`  
   (con checkout en tu rama, incorpora `develop` en la tuya; si preferís explícito: `git merge origin/develop`).
5. Si hay **conflictos**, resolverlos en **tu rama** antes de seguir programando.
6. Opcional pero recomendable: `git push origin <tu-rama>` tras un merge limpio para backup.

**El agente** (Cursor) debe **recordar este orden** y, si el usuario va a empezar trabajo, **proponer o ejecutar** estos comandos tras confirmar el nombre de su rama.

## Durante el trabajo

- Commits pequeños con **Conventional Commits** (`feat:`, `fix:`, `docs:`, …).
- `git push origin <tu-rama>` con regularidad.
- **No** hacer `git add` de `.env` (hook del proyecto); revisar `git status` antes de commit.

## Integrar tu trabajo en `develop` (merge seguro)

**Checklist antes de mergear:**

- [ ] Estás en tu rama con cambios **commiteados** (árbol limpio o solo lo que quieres llevar).
- [ ] Has vuelto a hacer `git fetch origin` y `git pull origin develop` (o `merge origin/develop`) para minimizar sorpresas.
- [ ] Tests o checks locales que el equipo exija (p. ej. `npm test` en el paquete afectado).
- [ ] Sin secretos en el diff.

**Opción recomendada:** **Pull Request** en GitHub: base **`develop`** ← compare **tu rama**; revisión y merge desde la UI.

**Opción merge local** (si el equipo lo permite): `checkout develop` → `pull origin develop` → `merge <tu-rama>` → resolver conflictos → `push origin develop` → volver a `checkout <tu-rama>`.

**Prohibido salvo emergencia acordada:** `git push --force` a `develop` o `main`.

## Después de que otros mergeen a `develop`

En tu rama personal:

```bash
git checkout <tu-rama>
git fetch origin
git merge origin/develop
# o: git pull origin develop
git push origin <tu-rama>
```

## Si el usuario no indica su rama

Preguntar cuál es su rama personal (`sergii`, `samuel`, `lucas` u otra acordada) antes de proponer `checkout` o `merge`.
