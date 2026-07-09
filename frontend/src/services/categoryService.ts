import { mockCategories } from '@/src/mocks/piggy-data';
import { Category } from '@/src/types/piggy';
import { randomDelay } from '@/src/utils/format';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const categoryService = {
  async listCategories(): Promise<Category[]> {
    await wait(randomDelay());
    return mockCategories;
  },
};
