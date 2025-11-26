import { PrismaClient, CategoryType } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const prisma = new PrismaClient();
const GOOGLE_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// --- CONFIGURACIÓN AGRESIVA ---
const BOOKS_PER_CATEGORY = 30; 
const MAX_RESULTS_PER_CALL = 40; 
const MAX_PAGES_TO_CHECK = 10; // Miraremos hasta 400 libros brutos por categoría

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

async function uploadImageToCloudinary(imageUrl: string, publicId: string): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'bookmatch/covers',
      public_id: publicId,
      overwrite: false,
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (error) {
    return null;
  }
}

// Mapa para mejorar los términos de búsqueda y sacar más resultados
const SEARCH_QUERIES: Record<number, string> = {
  1: "Novela Fantasía", // Fantasía
  6: "Novela Ciencia Ficción", 
  11: "Novela Romántica",
  16: "Novela Misterio Thriller",
  21: "Libro No Ficción",
  26: "Libro Autoayuda",
  31: "Literatura Juvenil",
  35: "Literatura Clásica",
  40: "Manga Cómic",
  // Puedes añadir más especificos si alguna categoría falla
};

const MY_CATEGORIES = [
  // PADRES
  { id: 1, name: "Fantasía", slug: "fantasia", parentId: null },
  { id: 6, name: "Ciencia Ficción", slug: "ciencia-ficcion", parentId: null },
  { id: 11, name: "Romance", slug: "romance", parentId: null },
  { id: 16, name: "Misterio / Thriller", slug: "misterio-thriller", parentId: null },
  { id: 21, name: "No Ficción", slug: "no-ficcion", parentId: null },
  { id: 26, name: "Autoayuda / Crecimiento personal", slug: "autoayuda", parentId: null },
  { id: 31, name: "Juvenil", slug: "juvenil", parentId: null },
  { id: 35, name: "Clásicos", slug: "clasicos", parentId: null },
  { id: 40, name: "Cómic / Manga", slug: "comic-manga", parentId: null },
  { id: 47, name: "Novedades", slug: "novedades", parentId: null },
  
  // HIJOS
  { id: 2, name: "Fantasía épica", slug: "fantasia-epica", parentId: 1 },
  { id: 3, name: "Fantasía urbana", slug: "fantasia-urbana", parentId: 1 },
  { id: 4, name: "Mitología y folklore", slug: "mitologia-folklore", parentId: 1 },
  { id: 5, name: "Fantasía oscura", slug: "fantasia-oscura", parentId: 1 },
  { id: 7, name: "Distopía", slug: "distopia", parentId: 6 },
  { id: 8, name: "Espacio y exploración", slug: "espacio-exploracion", parentId: 6 },
  { id: 9, name: "Ciberpunk", slug: "ciberpunk", parentId: 6 },
  { id: 10, name: "Inteligencia artificial / robots", slug: "ia-robots", parentId: 6 },
  { id: 12, name: "Romance contemporáneo", slug: "romance-contemporaneo", parentId: 11 },
  { id: 13, name: "Romance histórico", slug: "romance-historico", parentId: 11 },
  { id: 14, name: "Romance juvenil", slug: "romance-juvenil", parentId: 11 },
  { id: 15, name: "Romance fantástico", slug: "romance-fantastico", parentId: 11 },
  { id: 17, name: "Policíaco", slug: "policiaco", parentId: 16 },
  { id: 18, name: "Thriller psicológico", slug: "thriller-psicologico", parentId: 16 },
  { id: 19, name: "Suspense y terror suave", slug: "suspense-terror", parentId: 16 },
  { id: 20, name: "True crime / Investigación real", slug: "true-crime", parentId: 16 },
  { id: 22, name: "Biografías y memorias", slug: "biografias-memorias", parentId: 21 },
  { id: 23, name: "Historia y sociedad", slug: "historia-sociedad", parentId: 21 },
  { id: 24, name: "Ciencia y divulgación", slug: "ciencia-divulgacion", parentId: 21 },
  { id: 25, name: "Política y actualidad", slug: "politica-actualidad", parentId: 21 },
  { id: 27, name: "Motivación y bienestar", slug: "motivacion-bienestar", parentId: 26 },
  { id: 28, name: "Psicología práctica", slug: "psicologia-practica", parentId: 26 },
  { id: 29, name: "Espiritualidad y mindfulness", slug: "espiritualidad-mindfulness", parentId: 26 },
  { id: 30, name: "Finanzas personales / Éxito", slug: "finanzas-exito", parentId: 26 },
  { id: 32, name: "Aventura juvenil", slug: "aventura-juvenil", parentId: 31 },
  { id: 33, name: "Coming of age", slug: "coming-of-age", parentId: 31 },
  { id: 34, name: "Fantasía juvenil", slug: "fantasia-juvenil-sub", parentId: 31 },
  { id: 36, name: "Literatura universal", slug: "literatura-universal", parentId: 35 },
  { id: 37, name: "Literatura española", slug: "literatura-espanola", parentId: 35 },
  { id: 38, name: "Literatura europea", slug: "literatura-europea", parentId: 35 },
  { id: 39, name: "Literatura americana", slug: "literatura-americana", parentId: 35 },
  { id: 41, name: "Superhéroes", slug: "superheroes", parentId: 40 },
  { id: 42, name: "Manga shōnen", slug: "manga-shonen", parentId: 40 },
  { id: 43, name: "Seinen / Josei", slug: "seinen-josei", parentId: 40 },
  { id: 44, name: "Cómic europeo", slug: "comic-europeo", parentId: 40 },
];

async function main() {
  if (!API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ ERROR: Faltan variables de entorno');
    process.exit(1);
  }

  console.log('🌱 1. Sincronizando Categorías...');
  for (const cat of MY_CATEGORIES) {
    const type = cat.parentId === null ? CategoryType.MAIN : CategoryType.SPECIAL;
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, slug: cat.slug || `cat-${cat.id}`, parentId: cat.parentId, type: type },
      create: { id: cat.id, name: cat.name, slug: cat.slug || `cat-${cat.id}`, parentId: cat.parentId, type: type, description: `Libros de ${cat.name}` }
    });
  }
  console.log('✅ Categorías listas.');

  console.log('📚 2. Buscando (Búsqueda General)...');
  
  for (const category of MY_CATEGORIES) {
    if (category.id === 47) continue; 

    // Usamos el término mejorado del mapa, o el nombre de la categoría si no existe en el mapa
    let searchTerm = SEARCH_QUERIES[category.id] || category.name.replace('/', ' ').replace('  ', ' ');
    console.log(`\n🔍 ID ${category.id} - Buscando: "${searchTerm}"`);
    
    let booksAddedForThisCat = 0;
    let startIndex = 0;
    let pagesChecked = 0;

    while (booksAddedForThisCat < BOOKS_PER_CATEGORY && pagesChecked < MAX_PAGES_TO_CHECK) {
      
      try {
        const response = await axios.get(GOOGLE_API_URL, {
          params: {
            q: searchTerm, // ¡Quitamos 'subject:' para buscar en todo!
            maxResults: MAX_RESULTS_PER_CALL,
            startIndex: startIndex,
            key: API_KEY,
            printType: 'books',
            langRestrict: 'es', // Forzamos español
            orderBy: 'relevance'
          },
        });

        const items = response.data.items || [];
        
        if (items.length === 0) {
          console.log(`   ⚠️ Fin de resultados en Google.`);
          break; 
        }

        process.stdout.write(`   (Pág ${pagesChecked + 1}) Revisando ${items.length} libros... `);

        for (const item of items) {
          if (booksAddedForThisCat >= BOOKS_PER_CATEGORY) break;

          const info = item.volumeInfo;
          
          // --- FILTROS ESTRICTOS ---
          const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13') 
                       || info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10');
          
          if (!isbnObj) continue; 
          if (!info.title || !info.authors) continue;
          
          const isbn = isbnObj.identifier;
          
          // Verificar si ya existe en la DB para ahorrar tiempo de Cloudinary
          const existingBook = await prisma.catalogBook.findUnique({ where: { isbn: isbn } });
          let finalCoverUrl = existingBook?.coverUrl || null;
          const googleImageUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

          // Si no tiene imagen en Google Y no tenemos imagen en DB, lo saltamos (queremos libros bonitos)
          if (!googleImageUrl && !finalCoverUrl) continue;

          // SUBIDA A CLOUDINARY (Solo si es nuevo y tiene foto)
          if (!existingBook && googleImageUrl) {
             const cleanUrl = googleImageUrl.replace('http:', 'https:');
             finalCoverUrl = await uploadImageToCloudinary(cleanUrl, `isbn_${isbn}`);
             if (!finalCoverUrl) continue; // Si falla Cloudinary, saltamos el libro
          }

          // Precio Aleatorio
          let price = 0;
          if (item.saleInfo?.listPrice?.amount) {
            price = item.saleInfo.listPrice.amount;
          } else {
            price = parseFloat((Math.random() * (45 - 12) + 12).toFixed(2));
          }

          // Guardar en DB
          const book = await prisma.catalogBook.upsert({
            where: { isbn: isbn },
            update: {}, 
            create: {
              title: info.title,
              author: info.authors.join(', '),
              isbn: isbn,
              description: info.description ? info.description.substring(0, 1000) : `Sin descripción.`,
              coverUrl: finalCoverUrl,
              imageUrls: finalCoverUrl ? [finalCoverUrl] : [],
              price: price,
              stock: Math.floor(Math.random() * 50) + 5, 
            },
          });

          // Relación Categoría
          const relationExists = await prisma.catalogBookCategory.findUnique({
            where: { catalogBookId_categoryId: { catalogBookId: book.id, categoryId: category.id } }
          });

          if (!relationExists) {
            await prisma.catalogBookCategory.create({
              data: { catalogBookId: book.id, categoryId: category.id }
            });
            process.stdout.write('+'); // Libro añadido
            booksAddedForThisCat++;
          }
        } 
        
        console.log(` | Acumulados: ${booksAddedForThisCat}/${BOOKS_PER_CATEGORY}`);

        startIndex += MAX_RESULTS_PER_CALL;
        pagesChecked++;
        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (error) {
        console.error(`❌ Error paginando:`, error instanceof Error ? error.message : error);
        break; 
      }
    } 
  }

  // --- NOVEDADES ---
  console.log('\n\n✨ 3. Generando sección "Novedades"...');
  const allBooks = await prisma.catalogBook.findMany({ take: 200, orderBy: { id: 'desc' } });
  const shuffled = allBooks.sort(() => 0.5 - Math.random());
  const selectedForNovedades = shuffled.slice(0, 60);

  for (const book of selectedForNovedades) {
    const exists = await prisma.catalogBookCategory.findUnique({
      where: { catalogBookId_categoryId: { catalogBookId: book.id, categoryId: 47 } }
    });
    if (!exists) {
      await prisma.catalogBookCategory.create({ data: { catalogBookId: book.id, categoryId: 47 } });
      process.stdout.write('*');
    }
  }

  console.log(`\n\n🏁 PROCESO COMPLETADO.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });