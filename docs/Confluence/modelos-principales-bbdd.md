# Modelos principales (BBDD)

Resumen de entidades; **fuente de verdad:** `BookMatch-Backend/prisma/schema.prisma` (nombres de tabla `@map`, campos y enums pueden evolucionar).

##### **User**

<!\[CDATA\[model User { id Int @id @default(autoincrement()) firebaseUid String @unique @map("firebase\_uid") email String @unique fullName String? @map("full\_name") avatarUrl String? @map("avatar\_url") phone String? role Role @default(USER) @map("role") createdAt DateTime @default(now()) @map("created\_at") updatedAt DateTime @updatedAt @map("updated\_at") userBooks UserBook\[\] orders Order\[\] reviews Review\[\] createdForums Forum\[\] @relation("UserForums") posts Post\[\] comments Comment\[\] votes Vote\[\] @@map("users") }\]\]>

##### **Category**

<!\[CDATA\[model Category { id Int @id @default(autoincrement()) name String @unique slug String @unique type CategoryType parentId Int? @map("parent\_id") icon String? description String? createdAt DateTime @default(now()) @map("created\_at") updatedAt DateTime @updatedAt @map("updated\_at") parent Category? @relation("CategoryHierarchy", ...) children Category\[\] @relation("CategoryHierarchy") catalogBooks CatalogBookCategory\[\] userBooks UserBookCategory\[\] @@map("categories") }\]\]>

##### **CatalogBook**

<!\[CDATA\[model CatalogBook { id Int @id @default(autoincrement()) title String author String isbn String @unique description String? coverUrl String? @map("cover\_url") imageUrls String\[\] @default(\[\]) price Decimal @db.Decimal(10, 2) stock Int @default(0) createdAt DateTime @default(now()) @map("created\_at") updatedAt DateTime @updatedAt @map("updated\_at") orderItems OrderItem\[\] reviews Review\[\] categories CatalogBookCategory\[\] @@map("catalog\_books") }\]\]>

##### **Order**

<!\[CDATA\[model Order { id Int @id @default(autoincrement()) userId Int @map("user\_id") totalAmount Decimal @map("total\_amount") @db.Decimal(10, 2) status OrderStatus @default(PENDING) paymentIntentId String? @map("payment\_intent\_id") shippingAddress String? @map("shipping\_address") createdAt DateTime @default(now()) @map("created\_at") updatedAt DateTime @updatedAt @map("updated\_at") user User @relation(...) items OrderItem\[\] @@map("orders") }\]\]>

##### **Forum** / **Post** / **Comment** / **Vote**

Foros, posts, comentarios anidados (`parentId`), imágenes (`PostImage`), votos por usuario/post — ver `schema.prisma` para restricciones `@@unique` y `onDelete`.

### Relaciones (lectura rápida)

* **CatalogBook ↔ Category:** N:M vía `CatalogBookCategory`.
* **User → Order → OrderItem → CatalogBook** cadena de pedido.
* **Forum → Post → Comment / Vote / PostImage.**

---

**Actualización:** abril 2026 — rol de usuario, marcas de tiempo en pedidos, tablas `@map`.