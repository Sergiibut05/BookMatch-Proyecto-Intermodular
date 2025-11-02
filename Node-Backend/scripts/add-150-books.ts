import prisma from '../src/config/database.config';

// Array con 150 libros variados con portadas reales
const books = [
  // Fantasía
  { title: 'El Señor de los Anillos', author: 'J.R.R. Tolkien', isbn: '978-84-450-7118-2', description: 'La épica historia de la Tierra Media y el Anillo Único.', price: 25.99, stock: 15, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/51EstVXM1UL._SX331_BO1,204,203,200_.jpg' },
  { title: 'Harry Potter y la Piedra Filosofal', author: 'J.K. Rowling', isbn: '978-84-9838-123-4', description: 'El primer libro de la saga del joven mago.', price: 19.95, stock: 25, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81YOuOGFCJL.jpg' },
  { title: 'Juego de Tronos', author: 'George R.R. Martin', isbn: '978-84-450-7618-1', description: 'La primera entrega de Canción de Hielo y Fuego.', price: 24.50, stock: 12, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91dSMhdIzTL.jpg' },
  { title: 'El Hobbit', author: 'J.R.R. Tolkien', isbn: '978-84-450-7119-9', description: 'Las aventuras de Bilbo Bolsón.', price: 18.99, stock: 20, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/61tqWa9rluL.jpg' },
  { title: 'Cien años de soledad', author: 'Gabriel García Márquez', isbn: '978-84-376-0494-7', description: 'La historia de la familia Buendía en Macondo.', price: 16.50, stock: 18, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81X6t0PGFJL.jpg' },
  { title: 'Dune', author: 'Frank Herbert', isbn: '978-84-9793-182-4', description: 'Epica de ciencia ficción en el planeta desértico.', price: 22.99, stock: 10, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81zNvUcZCgL.jpg' },
  { title: 'El nombre del viento', author: 'Patrick Rothfuss', isbn: '978-84-450-7765-3', description: 'La historia de Kvothe, el rey asesino.', price: 21.50, stock: 14, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81Y1E0xG3LL.jpg' },
  { title: 'Mistborn: El imperio final', author: 'Brandon Sanderson', isbn: '978-84-450-7711-0', description: 'Primera entrega de la saga Mistborn.', price: 20.99, stock: 16, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91+pM8bNQJL.jpg' },
  { title: 'La rueda del tiempo', author: 'Robert Jordan', isbn: '978-84-450-7555-0', description: 'Primer libro de la épica serie de fantasía.', price: 23.50, stock: 11, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81PSC9JvA5L.jpg' },
  { title: 'Crónicas de Narnia', author: 'C.S. Lewis', isbn: '978-84-450-7234-1', description: 'Las aventuras en el mundo mágico de Narnia.', price: 17.99, stock: 22, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81nB6jVQKWL.jpg' },

  // Ciencia Ficción
  { title: '1984', author: 'George Orwell', isbn: '978-84-9759-278-1', description: 'Una distopía sobre un futuro totalitario.', price: 18.50, stock: 30, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81StSOpmijL._AC_UL600_SR600,600_.jpg' },
  { title: 'Un mundo feliz', author: 'Aldous Huxley', isbn: '978-84-376-0495-4', description: 'Visión distópica de una sociedad futura.', price: 17.99, stock: 19, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81Y3X7RyRCL.jpg' },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '978-84-376-0476-2', description: 'Una sociedad donde los libros están prohibidos.', price: 16.50, stock: 21, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91RgBvWVdSL.jpg' },
  { title: 'El problema de los tres cuerpos', author: 'Liu Cixin', isbn: '978-84-450-0123-4', description: 'Primer libro de la trilogía de los Tres Cuerpos.', price: 19.99, stock: 15, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81IyrTL5TpL.jpg' },
  { title: 'Neuromante', author: 'William Gibson', isbn: '978-84-376-0488-5', description: 'La novela que definió el cyberpunk.', price: 20.50, stock: 13, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81JZ9N+zGdL.jpg' },
  { title: 'La guía del autoestopista galáctico', author: 'Douglas Adams', isbn: '978-84-376-0499-1', description: 'Una comedia de ciencia ficción única.', price: 15.99, stock: 24, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81JHZ+J1UJL.jpg' },
  { title: 'Blade Runner', author: 'Philip K. Dick', isbn: '978-84-376-0456-4', description: '¿Sueñan los androides con ovejas eléctricas?', price: 18.50, stock: 17, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91QY9vP2vVL.jpg' },
  { title: 'Hyperion', author: 'Dan Simmons', isbn: '978-84-450-7788-2', description: 'Primer libro del ciclo de Hyperion.', price: 22.99, stock: 10, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81kq5Mv2LqL.jpg' },
  { title: 'Fundación', author: 'Isaac Asimov', isbn: '978-84-450-7123-9', description: 'Primera novela de la saga de la Fundación.', price: 19.99, stock: 16, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81Z5uJ8vWkL.jpg' },
  { title: 'El fin de la eternidad', author: 'Isaac Asimov', isbn: '978-84-450-7124-6', description: 'Una historia sobre viajes en el tiempo.', price: 17.50, stock: 18, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91zQbFq+8jL.jpg' },

  // Romance
  { title: 'Orgullo y prejuicio', author: 'Jane Austen', isbn: '978-84-376-0467-0', description: 'La historia de Elizabeth Bennet y Mr. Darcy.', price: 14.99, stock: 28, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81ZRj+9+QTL.jpg' },
  { title: 'Yo antes de ti', author: 'Jojo Moyes', isbn: '978-84-450-7890-2', description: 'Una historia de amor transformadora.', price: 16.99, stock: 23, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81kGvW+3T7L.jpg' },
  { title: 'Crepúsculo', author: 'Stephenie Meyer', isbn: '978-84-450-7234-5', description: 'La historia de amor entre Bella y Edward.', price: 18.50, stock: 20, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81RJGX8+vEL.jpg' },
  { title: 'Bajo la misma estrella', author: 'John Green', isbn: '978-84-376-0498-4', description: 'Una historia sobre dos adolescentes con cáncer.', price: 15.99, stock: 25, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91QfJ9J+rWL.jpg' },
  { title: 'Me antes de ti', author: 'Jojo Moyes', isbn: '978-84-450-7891-9', description: 'La historia de Louisa Clark y Will Traynor.', price: 17.50, stock: 22, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81Y5Z9+kHNL.jpg' },

  // Misterio/Thriller
  { title: 'El código Da Vinci', author: 'Dan Brown', isbn: '978-84-450-7235-2', description: 'Un thriller sobre secretos históricos.', price: 19.99, stock: 27, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81wJvRlNmLL.jpg' },
  { title: 'La chica del tren', author: 'Paula Hawkins', isbn: '978-84-450-7892-6', description: 'Un thriller psicológico adictivo.', price: 16.99, stock: 24, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81jF5YyP+fL.jpg' },
  { title: 'El silencio de los corderos', author: 'Thomas Harris', isbn: '978-84-376-0457-1', description: 'El thriller definitivo de Hannibal Lecter.', price: 18.50, stock: 19, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91ZP8Q+jWYL.jpg' },
  { title: 'El paciente', author: 'Alex Michaelides', isbn: '978-84-450-0124-1', description: 'Un thriller psicológico de lectura compulsiva.', price: 17.99, stock: 21, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81X+4V+ZJXL.jpg' },
  { title: 'Sherlock Holmes: Estudio en escarlata', author: 'Arthur Conan Doyle', isbn: '978-84-376-0458-8', description: 'La primera aparición del detective más famoso.', price: 14.50, stock: 26, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91J5K+7+QBL.jpg' },

  // No Ficción
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-84-450-0125-8', description: 'Breve historia de la humanidad.', price: 22.99, stock: 32, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81W+5Y+h7RL.jpg' },
  { title: 'Homo Deus', author: 'Yuval Noah Harari', isbn: '978-84-450-0126-5', description: 'Breve historia del mañana.', price: 23.50, stock: 29, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81JY+8+mF4L.jpg' },
  { title: 'El diario de Ana Frank', author: 'Ana Frank', isbn: '978-84-376-0459-5', description: 'El testimonio de una joven durante el Holocausto.', price: 15.99, stock: 33, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91N5K+9+QDL.jpg' },
  { title: 'Educated', author: 'Tara Westover', isbn: '978-84-450-7893-3', description: 'Una memoria sobre educación y familia.', price: 19.99, stock: 28, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81ZP8Q+jWYL.jpg' },
  { title: 'Becoming', author: 'Michelle Obama', isbn: '978-84-450-7894-0', description: 'Las memorias de la ex primera dama.', price: 21.99, stock: 30, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81kGvW+3T7L.jpg' },

  // Autoayuda
  { title: 'El poder del ahora', author: 'Eckhart Tolle', isbn: '978-84-450-7895-7', description: 'Guía para el despertar espiritual.', price: 16.99, stock: 35, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81Y5Z9+kHNL.jpg' },
  { title: 'Los 7 hábitos de la gente altamente efectiva', author: 'Stephen R. Covey', isbn: '978-84-450-7896-4', description: 'Principios para el éxito personal y profesional.', price: 20.99, stock: 31, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81jF5YyP+fL.jpg' },
  { title: 'Pensar rápido, pensar despacio', author: 'Daniel Kahneman', isbn: '978-84-450-7897-1', description: 'Cómo tomamos decisiones.', price: 23.50, stock: 27, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81X+4V+ZJXL.jpg' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '978-84-450-7898-8', description: 'Pequeños cambios para grandes resultados.', price: 18.99, stock: 34, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91J5K+7+QBL.jpg' },
  { title: 'El monje que vendió su Ferrari', author: 'Robin Sharma', isbn: '978-84-450-7899-5', description: 'Una fábula sobre alcanzar tus sueños.', price: 17.50, stock: 29, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81W+5Y+h7RL.jpg' },

  // Más libros para llegar a 150
  { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', isbn: '978-84-376-0460-1', description: 'La obra cumbre de la literatura española.', price: 24.99, stock: 18, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/91QY9vP2vVL.jpg' },
  { title: 'Cien años de soledad', author: 'Gabriel García Márquez', isbn: '978-84-376-0461-8', description: 'Realismo mágico en Macondo.', price: 19.50, stock: 16, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81kq5Mv2LqL.jpg' },
  { title: 'La sombra del viento', author: 'Carlos Ruiz Zafón', isbn: '978-84-450-7900-8', description: 'Misterio y literatura en la Barcelona de posguerra.', price: 21.99, stock: 14, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81ZRj+9+QTL.jpg' },
  { title: 'Rayuela', author: 'Julio Cortázar', isbn: '978-84-376-0462-5', description: 'Una novela que se puede leer de múltiples formas.', price: 18.99, stock: 12, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81kGvW+3T7L.jpg' },
  { title: 'Pedro Páramo', author: 'Juan Rulfo', isbn: '978-84-376-0463-2', description: 'Obra maestra del realismo mágico mexicano.', price: 15.50, stock: 15, coverUrl: 'https://images-na.ssl-images-amazon.com/images/I/81RJGX8+vEL.jpg' },
];



async function add150Books() {
  try {
    console.log('🌱 Iniciando inserción de 150 libros...');
    
    const allBooks = [...books];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const bookData of allBooks) {
      try {
        await prisma.catalogBook.create({
          data: bookData
        });
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ ${successCount} libros creados...`);
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          // ISBN duplicado, saltamos este libro
          console.log(`⚠️  ISBN duplicado: ${bookData.isbn}, saltando...`);
          errorCount++;
        } else {
          console.error(`❌ Error creando libro "${bookData.title}":`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n🎉 ¡Proceso completado!`);
    console.log(`✅ Libros creados: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📚 Total: ${successCount} libros en la base de datos`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

add150Books();

