import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

// Accepts plain decimal strings like "100", "99.9", "1000.50".
export const DECIMAL_AMOUNT_REGEX = /^\d{1,10}(\.\d{1,2})?$/;

export function parsePositiveDecimal(
  value: string,
  fieldName: string,
): Prisma.Decimal {
  let amount: Prisma.Decimal;
  try {
    amount = new Prisma.Decimal(value);
  } catch {
    throw new BadRequestException(
      `${fieldName} must be a valid decimal number`,
    );
  }
  if (amount.lessThanOrEqualTo(0)) {
    throw new BadRequestException(`${fieldName} must be greater than zero`);
  }
  return amount;
}
