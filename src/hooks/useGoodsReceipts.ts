import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GoodsReceipt {
    id: string;
    gr_number: string;
    invoice_number: string;
    po_number: string;
    status: string;
    created_at: string;
}

export function useGoodsReceipts() {
    const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReceipts() {
            setLoading(true);
            const { data, error } = await supabase
                .from("goods_receipts")
                .select(`
          id,
          gr_number,
          invoice_number,
          status,
          created_at,
          purchase_orders ( po_number )
        `)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
                setReceipts([]);
            } else {
                const transformed = data.map((r: any) => ({
                    id: r.id,
                    gr_number: r.gr_number,
                    invoice_number: r.invoice_number,
                    po_number: r.purchase_orders.po_number,
                    status: r.status,
                    created_at: r.created_at,
                }));
                setReceipts(transformed);
                setError(null);
            }
            setLoading(false);
        }

        fetchReceipts();
    }, []);

    return { receipts, loading, error };
}
