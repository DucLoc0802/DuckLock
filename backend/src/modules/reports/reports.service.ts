import { pool } from "../../config/db";
import { randomUUID } from "crypto";
import { GetReportQueryDto } from "./dto/get-report-query.dto";
import { AppError } from "../../utils/app-errors";

export const ReportsService = {
    getMonthlySummary: async (userId: string, queryDto: GetReportQueryDto): Promise<any> => {

        // Tháng, năm của giao dịch hiện tại và trước đó 1 tháng
        const targetMonth = Number(queryDto.month) || (new Date().getMonth() + 1);
        const targetYear = Number(queryDto.year) || new Date().getFullYear();
        let prevMonth = targetMonth - 1;
        let prevYear = targetYear;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        // Ngày bắt đầu và kết thúc của tháng hiện tại
        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

        //1. Lấy tổng chi tiêu của tháng hiện tại
        const query1 = `select sum(amount) as total_expense 
        from transactions 
        where user_id = ? 
        AND deleted_at IS NULL 
        AND month(transaction_date) = ? 
        AND year(transaction_date) = ? 
        AND type = 'EXPENSE'`
        const [totalExpenseValue] = await pool.query<any[]>(query1, [userId, targetMonth, targetYear]);
        const totalExpense = Number(totalExpenseValue[0].total_expense) || 0;

        //2. Lấy tổng thu nhập của tháng hiện tại
        const query2 = `select sum(amount) as total_income 
        from transactions 
        where user_id = ? 
        AND deleted_at IS NULL 
        AND month(transaction_date) = ? 
        AND year(transaction_date) = ? 
        AND type = 'INCOME'`
        const [totalIncomeValue] = await pool.query<any[]>(query2, [userId, targetMonth, targetYear]);
        const totalIncome = Number(totalIncomeValue[0].total_income) || 0;

        //3. Lấy tổng chi tiêu của tháng trước tháng hiện tại
        const query3 = `select sum(amount) as previous_month_expense 
        from transactions 
        where user_id = ? 
        AND deleted_at IS NULL 
        AND month(transaction_date) = ? 
        AND year(transaction_date) = ? 
        AND type = 'EXPENSE'`
        const [previousMonthExpenseValue] = await pool.query<any[]>(query3, [userId, prevMonth, prevYear]);
        const previousMonthExpense = Number(previousMonthExpenseValue[0].previous_month_expense) || 0;

        //4. Lấy tổng thu nhập của tháng trước tháng hiện tại
        const query4 = `select sum(amount) as previous_month_income 
        from transactions 
        where user_id = ? 
        AND deleted_at IS NULL 
        AND month(transaction_date) = ? 
        AND year(transaction_date) = ? 
        AND type = 'INCOME'`
        const [previousMonthIncomeValue] = await pool.query<any[]>(query4, [userId, prevMonth, prevYear]);
        const previousMonthIncome = Number(previousMonthIncomeValue[0].previous_month_income) || 0;


        // Lấy danh mục chi tiêu
        const query5 = `SELECT c.id AS categoryId, SUM(t.amount) AS amount 
        FROM transactions t 
        JOIN categories c ON t.category_id = c.id 
        WHERE t.user_id = ? 
        AND t.type = 'EXPENSE' 
        AND t.transaction_date BETWEEN ? AND ? 
        AND t.deleted_at IS NULL 
        GROUP BY c.id`
        const [categoryBreakdown] = await pool.query<any[]>(query5, [userId, startDate, endDate]);

        // So sánh tổng chi tiêu của tháng hiện tại với tháng trước
        const compareTextValue = totalExpense > previousMonthExpense ? `Tăng ${totalExpense - previousMonthExpense}` : `Giảm ${previousMonthExpense - totalExpense}`;

        // Tính tổng chi tiêu
        const totalAmount = categoryBreakdown.reduce((sum: number, item: any) => sum + item.amount, 0);

        // Tính phần trăm chi tiêu
        const categoryBreakdownArray = categoryBreakdown.map((item: any) => ({
            categoryId: item.categoryId,
            amount: item.amount,
            percent: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0
        }));

        return {
            monthLabel: `Tháng ${targetMonth} năm ${targetYear}`,
            totalExpense: totalExpense,
            totalIncome: totalIncome,
            compareText: compareTextValue,
            categoryBreakdown: categoryBreakdownArray
        };
    },

    getWeeklySummary: async (userId: string, queryDto: GetReportQueryDto): Promise<any> => {
        // 5. Tính ngày bắt đầu (Thứ 2) và ngày kết thúc (Chủ Nhật) của tuần hiện tại
        const today = queryDto.day ? new Date(queryDto.day) : new Date();
        if (isNaN(today.getTime())) {
            throw new AppError(400, "Ngày không hợp lệ");
        }
        const currentDay = today.getDay(); // 0 là Chủ nhật, 1 là Thứ 2, ..., 6 là Thứ 7
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Tính khoảng cách từ ngày hiện tại đến Thứ 2

        const monday = new Date(today); // Lấy monday là ngày hiện tại
        monday.setDate(today.getDate() + distanceToMonday); // Cộng ngày hiện tại với distanceToMonday để được ngày thứ 2
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6); // Cộng ngày thứ 2 với 6 để được ngày Chủ nhật

        // Định dạng ngày thành chuỗi "YYYY-MM-DD" để truyền vào SQL
        const startOfWeek = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        const endOfWeek = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

        // Lấy tổng chi tiêu trong tuần có ngày hiện tại
        const query = `SELECT WEEKDAY(transaction_date) as weekday_index, SUM(amount) as total 
        FROM transactions 
        WHERE user_id = ? 
        AND type = 'EXPENSE' 
        AND transaction_date BETWEEN ? AND ? 
        AND deleted_at IS NULL 
        GROUP BY weekday_index`;
        const [dailySeriesValue] = await pool.query<any[]>(query, [userId, startOfWeek, endOfWeek]);

        // Khởi tạo mảng 7 phần tử ứng với Thứ 2 (index 0) -> Chủ nhật (index 6)
        const dailySeriesArray = [0, 0, 0, 0, 0, 0, 0];

        // Duyệt kết quả từ database trả về để gán số tiền vào đúng ngày trong tuần
        dailySeriesValue.forEach((row: any) => {
            const index = row.weekday_index;
            if (index >= 0 && index < 7) {
                dailySeriesArray[index] = Number(row.total) || 0;
            }
        });
        return {
            startOfWeek,
            endOfWeek,
            dailySeries: dailySeriesArray
        };

    },

    getDailySummary: async (userId: string, queryDto: GetReportQueryDto): Promise<any> => {
        const targetDay = queryDto.day || new Date().getDate();
        const targetMonth = queryDto.month || (new Date().getMonth() + 1);
        const query = `select sum(amount) as total_expense 
        from transactions 
        where user_id = ? 
        AND deleted_at IS NULL 
        AND day(transaction_date) = ? 
        AND month(transaction_date) = ?
        AND year(transaction_date) = ? 
        AND type = 'EXPENSE'`
        const [result] = await pool.query<any[]>(query, [userId, targetDay, targetMonth]);
        return result;
    },
}