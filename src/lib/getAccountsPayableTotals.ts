import { supabase } from '@/integrations/supabase/client';

export async function getAccountsPayableTotals() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const monthStart = new Date(year, month, 1).toISOString();
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

        // Payroll totals
        const { data: payrolls, error: payrollError } = await supabase
            .from('payroll')
            .select('salary')
            .gte('payroll_period_start', monthStart)
            .lte('payroll_period_end', monthEnd)
            .eq('status', 'Pending');

        if (payrollError) {
            console.error('Error fetching payroll total:', payrollError.message);
            return null;
        }

        const totalPayrollAmount = payrolls?.reduce((acc, p) => acc + (p.salary ?? 0), 0) || 0;

        // Approved POs totals
        const { data: approvedPOs, error: poError } = await supabase
            .from('purchase_orders')
            .select('total')
            .eq('status', 'approved');

        if (poError) {
            console.error('Error fetching approved POs total:', poError.message);
            return null;
        }

        const totalApprovedPOAmount = approvedPOs?.reduce((acc, po) => acc + (po.total ?? 0), 0) || 0;

        return {
            totalPayrollAmount,
            totalApprovedPOAmount,
            totalLiabilities: totalPayrollAmount + totalApprovedPOAmount,
        };
    } catch (error) {
        console.error('Error fetching accounts payable totals:', error);
        return null;
    }
}
