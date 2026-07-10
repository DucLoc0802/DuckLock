export type WalletType = "cash" | "bank" | "saving" | "other";

export interface WalletEntity {
    id: string;
    user_id: string;
    name: string;
    type: WalletType;
    balance: number;
    currency: string;
    interest_rate_percent: number | null;

    note: string | null;

    is_default: boolean;
    sort_order: number;

    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}