import { PrismaClient, CategoryType } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const GOOGLE_API_URL = '[https://www.googleapis.com/books/v1/volumes](https://www.googleapis.com/books/v1/volumes)';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// CONFIGURACIÓN
const BOOKS_PER_CATEGORY = 22; 
const MAX_RESULTS_PER_CALL = 40; 

// TUS CATEGORÍAS
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
  { id: 47, name: "Novedades", slug: "novedades", parentId: null }, // Se llena al final
  
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
  if (!API_KEY) {
    console.error('❌ ERROR: Falta GOOGLE_BOOKS_API_KEY en el archivo .env');
    process.exit(1);
  }

  console.log('🌱 1. Sincronizando Categorías (Upsert)...');
  
  for (const cat of MY_CATEGORIES) {
    const type = cat.parentId === null ? CategoryType.MAIN : CategoryType.SPECIAL;
    
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug || `cat-${cat.id}`,
        parentId: cat.parentId,
        type: type
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug || `cat-${cat.id}`,
        parentId: cat.parentId,
        type: type,
        description: `Libros de ${cat.name}`
      }
    });
  }
  console.log('✅ Categorías listas.');

  console.log('📚 2. Buscando e insertando libros...');
  
  let totalBooksInserted = 0;

  for (const category of MY_CATEGORIES) {
    if (category.id === 47) {
      console.log(`⏩ Saltando búsqueda API para "Novedades" (se llenará al final).`);
      continue; 
    }

    console.log(`\n🔍 Procesando: ID ${category.id} - "${category.name}"...`);
    
    const searchTerm = category.name.replace('/', ' ').replace('  ', ' ');

    try {
      const response = await axios.get(GOOGLE_API_URL, {
        params: {
          q: `subject:${searchTerm}`,
          maxResults: MAX_RESULTS_PER_CALL,
          key: API_KEY,
          printType: 'books',
          langRestrict: 'es',
          orderBy: 'relevance'
        },
      });

      const items = response.data.items || [];
      let countForThisCat = 0;

      for (const item of items) {
        if (countForThisCat >= BOOKS_PER_CATEGORY) break;

        const info = item.volumeInfo;
        const saleInfo = item.saleInfo;
        const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13') 
                     || info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10');
        
        if (!isbnObj || !info.title || !info.authors) continue;

        const isbn = isbnObj.identifier;
        
        let price = 0;
        if (saleInfo?.listPrice?.amount) {
          price = saleInfo.listPrice.amount;
        } else {
          price = parseFloat((Math.random() * (45 - 12) + 12).toFixed(2));
        }

        const book = await prisma.catalogBook.upsert({
          where: { isbn: isbn },
          update: {}, 
          create: {
            title: info.title,
            author: info.authors.join(', '),
            isbn: isbn,
            description: info.description ? info.description.substring(0, 1000) : `Sin descripción.`,
            coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            imageUrls: info.imageLinks?.smallThumbnail ? [info.imageLinks.smallThumbnail.replace('http:', 'https:')] : [],
            price: price,
            stock: Math.floor(Math.random() * 50) + 5, 
          },
        });

        const relationExists = await prisma.catalogBookCategory.findUnique({
          where: {
            catalogBookId_categoryId: {
              catalogBookId: book.id,
              categoryId: category.id
            }
          }
        });

        if (!relationExists) {
          await prisma.catalogBookCategory.create({
            data: {
              catalogBookId: book.id,
              categoryId: category.id
            }
          });
          process.stdout.write('+');
          countForThisCat++;
          totalBooksInserted++;
        } else {
          process.stdout.write('s');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error) {
      console.error(`❌ Error buscando "${category.name}":`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n\n✨ 3. Generando sección "Novedades"...');
  
  const allBooks = await prisma.catalogBook.findMany({
    take: 100,
    orderBy: { id: 'desc' } 
  });

  const shuffled = allBooks.sort(() => 0.5 - Math.random());
  const selectedForNovedades = shuffled.slice(0, 40);

  console.log(`   Conectando ${selectedForNovedades.length} libros aleatorios a "Novedades"...`);

  for (const book of selectedForNovedades) {
    const exists = await prisma.catalogBookCategory.findUnique({
      where: {
        catalogBookId_categoryId: {
          catalogBookId: book.id,
          categoryId: 47 
        }
      }
    });

    if (!exists) {
      await prisma.catalogBookCategory.create({
        data: {
          catalogBookId: book.id,
          categoryId: 47
        }
      });
      process.stdout.write('*');
    }
  }

  console.log(`\n\n🏁 PROCESO COMPLETADO.`);
  console.log(`📦 Total de asignaciones procesadas: ~${totalBooksInserted}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });