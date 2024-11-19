import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TransactionPercentagePerType } from "./types";

export const getDashboard = async (month: string) => {
  const where = {
    date: {
      gte: new Date(`2024-${month}-01`),
      lt: new Date(`2024-${month}-31`),
    },
  };

  async function getTransactionTotalByType(
    type: TransactionType,
  ): Promise<number> {
    const result = await db.transaction.aggregate({
      where: { ...where, type },
      _sum: { amount: true },
    });

    return Number(result._sum?.amount || 0);
  }

  const depositsTotal = await getTransactionTotalByType(
    TransactionType.DEPOSIT,
  );
  const investmentsTotal = await getTransactionTotalByType(
    TransactionType.INVESTMENT,
  );
  const expensesTotal = await getTransactionTotalByType(
    TransactionType.EXPENSE,
  );
  const balance = depositsTotal - investmentsTotal - expensesTotal;

  const transactionsTotal = Number(
    (
      await db.transaction.aggregate({
        where,
        _sum: { amount: true },
      })
    )._sum.amount,
  );
  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: Math.round(
      (Number(depositsTotal || 0) / Number(transactionsTotal)) * 100,
    ),
    [TransactionType.EXPENSE]: Math.round(
      (Number(expensesTotal || 0) / Number(transactionsTotal)) * 100,
    ),
    [TransactionType.INVESTMENT]: Math.round(
      (Number(investmentsTotal || 0) / Number(transactionsTotal)) * 100,
    ),
  };

  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    typesPercentage,
  };
};
