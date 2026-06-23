export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ItemReference = {
    id: number;
    additional_item: { id: number; name: string };
};

export type Itemset = {
    id: number;
    item_count: number;
    support: string;
    support_count: number;
    items: ItemReference[];
};

export type Rule = {
    id: number;
    support: string;
    confidence: string;
    lift: string;
    support_count: number;
    items: Array<ItemReference & { side: 'antecedent' | 'consequent' }>;
};

export type AnalysisRun = {
    id: number;
    date_from: string;
    date_to: string;
    minimum_support: string;
    minimum_confidence: string;
    minimum_lift: string;
    maximum_itemset: number;
    maximum_rules: number;
    minimum_occurrence: number;
    sort_by: 'support' | 'confidence' | 'lift';
    transaction_count: number;
    unique_item_count: number;
    frequent_itemset_count: number;
    rule_count: number;
    execution_time_ms: number | null;
    status: AnalysisStatus;
    error_message: string | null;
    executed_at: string;
    started_at: string | null;
    completed_at: string | null;
    executed_by?: { id: number; name: string } | null;
};

export type Pagination<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
};

export type Insight = {
    id: number;
    antecedent: string;
    consequent: string;
    support: string;
    confidence: string;
    lift: string;
    support_count: number;
    limited_data: boolean;
    interpretation: string;
    recommendation: string;
};

export type Overview = {
    topProducts: Itemset[];
    topCombinations: Itemset[];
    rules: Rule[];
    insights: Insight[];
};

export function formatPercentage(value: string | number): string {
    return `${(Number(value) * 100).toLocaleString('id-ID', {
        maximumFractionDigits: 2,
    })}%`;
}

export function formatLift(value: string | number): string {
    return Number(value).toLocaleString('id-ID', {
        maximumFractionDigits: 3,
    });
}

export function formatDate(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    }).format(new Date(value));
}

export function formatDateTime(value: string | null): string {
    if (value === null) {
        return 'Belum tersedia';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
        timeZoneName: 'short',
    }).format(new Date(value));
}

export function itemNames(items: ItemReference[]): string {
    return items.map((item) => item.additional_item.name).join(', ');
}

export function ruleItems(
    rule: Rule,
    side: 'antecedent' | 'consequent',
): string[] {
    return rule.items
        .filter((item) => item.side === side)
        .map((item) => item.additional_item.name);
}
