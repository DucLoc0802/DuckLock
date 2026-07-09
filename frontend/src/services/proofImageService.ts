import { mockProofImages } from '@/src/mocks/piggy-data';
import { ProofImage } from '@/src/types/piggy';
import { randomDelay } from '@/src/utils/format';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const proofImageService = {
  async listPending(): Promise<ProofImage[]> {
    await wait(randomDelay());
    return mockProofImages.filter((item) => item.status === 'pending');
  },
};
