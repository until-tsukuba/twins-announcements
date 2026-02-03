export type IndexPageItem = {
    title: string;
    id: {
        keijitype: number;
        genrecd: number;
        seqNo: number;
    };
    date: string;
};

type AttachmentBase = {
    items: { title: string; url: string }[];
};

export type FileAttachment = AttachmentBase & {
    type: "file";
};

export type UrlAttachment = AttachmentBase & {
    type: "url";
};

export type Attachment = FileAttachment | UrlAttachment;

export type ParsedDetailPage = {
    title: {
        text: string;
        date: string;
    };
    contents: string;
    attachments: Attachment[];
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
    updated: string;
};
