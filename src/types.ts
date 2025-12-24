export type IndexPageItem = {
    title: string;
    id: {
        keijitype: number;
        genrecd: number;
        seqNo: number;
    };
    date: string;
};

export type ParsedDetailPage = {
    title: {
        text: string;
        date: string;
    };
    contents: string;
    attachments: unknown[];
    footer: {
        affiliation: string;
        subAffiliation?: string;
        period: {
            start: string;
            end: string;
        };
    };
};

export type OutputItem = {
    page: IndexPageItem;
    parsedDetailPage: ParsedDetailPage;
    url: string;
};
