import { mailService } from '../src/services/mail.service.js';
import { generateOrderConfirmationEmail } from '../src/utils/email-templates.js';
import { prisma } from '../src/config/db.js';

async function testPaymentsEmail() {
  try {
    // 1. Obtener la última order pagada
    const order = await prisma.order.findFirst({
      where: { status: 'PAID' },
      include: { items: { include: { catalogBook: true } } },
      orderBy: { createdAt: 'desc' }
    });

    if (!order) {
      console.log('No paid orders found.');
      return;
    }

    console.log(`Order found: ${order.id}`);

    // 2. Obtener el usuario
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
    if (!user?.email) {
      console.log('User has no email.');
      return;
    }
    console.log(`Sending to user email: ${user.email}`);

    // 3. Preparar items y mandar correo
    const emailItems = order.items.map((item: any) => {
      const priceValue = item.price;
      const priceNumber = typeof priceValue === 'object' && priceValue !== null && 'toNumber' in priceValue
        ? priceValue.toNumber()
        : Number(priceValue);
      return {
        title: item.catalogBook.title,
        quantity: item.quantity,
        price: priceNumber * item.quantity,
        coverUrl: item.catalogBook.coverUrl
      };
    });

    const emailHtml = generateOrderConfirmationEmail(order.id.toString(), Number(order.totalAmount), emailItems);
    
    // Mandar a bookmatch3@gmail.com en lugar de user.email real para la prueba
    await mailService.sendEmail({ 
      to: 'bookmatch3@gmail.com', 
      subject: `Pedido #${order.id} confirmado`, 
      html: emailHtml 
    });

    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentsEmail();
