import { mockReport } from '@/src/mocks/piggy-data';
import { ReportSummary } from '@/src/types/piggy';
import { randomDelay } from '@/src/utils/format';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const reportService = {
  async getMonthlySummary(): Promise<ReportSummary> {
    await wait(randomDelay());
    return mockReport;
  },
};
