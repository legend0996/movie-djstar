const prisma = require('../src/config/database');
const { TRANSACTION_STATUS, ORDER_STATUS } = require('../src/constants');

async function fixStuckTransactions() {
  const processing = await prisma.transaction.findMany({
    where: {
      status: 'processing',
      callbackData: { not: null },
    },
  });

  for (const tx of processing) {
    const cb = tx.callbackData;
    const resultCode = cb?.Body?.stkCallback?.ResultCode;
    const mpesaReceipt = cb?.Body?.stkCallback?.CallbackMetadata?.Item?.find(
      i => i.Name === 'MpesaReceiptNumber'
    )?.Value;
    const transactionDateVal = cb?.Body?.stkCallback?.CallbackMetadata?.Item?.find(
      i => i.Name === 'TransactionDate'
    )?.Value;

    if (resultCode !== 0) continue;

    const dateStr = String(transactionDateVal).replace(/\D/g, '');
    let txDate = new Date();
    if (dateStr.length === 14) {
      txDate = new Date(dateStr.slice(0,4), dateStr.slice(4,6)-1, dateStr.slice(6,8),
                        dateStr.slice(8,10), dateStr.slice(10,12), dateStr.slice(12,14));
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        status: TRANSACTION_STATUS.SUCCESS,
        mpesaReceipt,
        transactionDate: txDate,
      },
    });

    await prisma.order.update({
      where: { id: tx.orderId },
      data: { status: ORDER_STATUS.COMPLETED, paymentStatus: 'paid', paidAt: new Date() },
    });

    const items = await prisma.orderItem.findMany({ where: { orderId: tx.orderId } });
    for (const item of items) {
      await prisma.userLibrary.upsert({
        where: { uq_library_user_movie: { userId: tx.userId, movieId: item.movieId } },
        update: { isAvailable: true, orderId: tx.orderId },
        create: { userId: tx.userId, movieId: item.movieId, orderId: tx.orderId, purchasePrice: item.itemPrice },
      });

      await prisma.movie.update({
        where: { id: item.movieId },
        data: { totalPurchases: { increment: 1 }, popularityScore: { increment: 10 } },
      });

      const movie = await prisma.movie.findUnique({ where: { id: item.movieId } });

      const order = await prisma.order.findUnique({ where: { id: tx.orderId } });
      if (order) {
        const commissionPercentage = 40;
        const developerCommission = (Number(tx.amount) * commissionPercentage) / 100;
        const ownerEarnings = Number(tx.amount) - developerCommission;

        const existing = await prisma.revenueRecord.findFirst({ where: { orderId: tx.orderId } });
        if (!existing) {
          await prisma.revenueRecord.create({
            data: {
              orderId: tx.orderId,
              transactionId: tx.id,
              totalAmount: tx.amount,
              developerCommission,
              ownerEarnings,
              commissionPercentage,
            },
          });
        }

        const existingReceipt = await prisma.receipt.findFirst({ where: { orderId: tx.orderId } });
        if (!existingReceipt) {
          const receiptNumber = 'RCP-' + Date.now().toString(36).toUpperCase() + '-' + tx.id;
          await prisma.receipt.create({
            data: {
              orderId: tx.orderId,
              userId: tx.userId,
              receiptNumber,
              receiptData: {
                receiptNumber,
                orderNumber: order.orderNumber,
                transactionId: tx.id,
                mpesaReceipt,
                movieTitle: movie?.title,
                amount: tx.amount,
                phoneNumber: tx.phoneNumber,
                purchaseDate: new Date().toISOString(),
              },
            },
          });
        }
      }
    }
  }

  console.log(`Fixed ${processing.filter(tx => tx.callbackData?.Body?.stkCallback?.ResultCode === 0).length} stuck transactions`);
}

fixStuckTransactions()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
