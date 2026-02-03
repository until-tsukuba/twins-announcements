import { hostname } from "./envs.js";
import type { OutputItem, Attachment } from "./types.js";

// フィード共通情報
const FEED_TITLE = "筑波大学TWINS 在学生へのお知らせ";
const FEED_DESCRIPTION = "TWINS「在学生へのお知らせ」の新着情報";
const FEED_HOME_URL = hostname + "/campusweb/";
const FEED_GENERATOR = "twins-announcements by UNTIL.";

const escapeXml = (str: string): string => {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};

const buildContent = (item: OutputItem): string => {
    const { contents, footer, attachments } = item.parsedDetailPage;
    const affiliation = footer.subAffiliation
        ? `${footer.affiliation} / ${footer.subAffiliation}`
        : footer.affiliation;

    // 添付ファイル情報を構築
    const fileAttachments = attachments.filter((att: Attachment): att is Extract<Attachment, { type: "file" }> => att.type === "file");
    const urlAttachments = attachments.filter((att: Attachment): att is Extract<Attachment, { type: "url" }> => att.type === "url");

    let attachmentSection = "";

    if (fileAttachments.length > 0) {
        const fileList = fileAttachments
            .flatMap((att) => att.items.map((item) => item.title))
            .map((title: string, index: number) => `  ${index + 1}. ${title}`)
            .join("\n");
        attachmentSection += `\n【添付ファイル】\n${fileList}`;
    } else {
        attachmentSection += "\n【添付ファイル】無し";
    }

    if (urlAttachments.length > 0) {
        const urlList = urlAttachments
            .flatMap((att) => att.items.map((item) => item.url))
            .map((url: string, index: number) => `  ${index + 1}. ${url}`)
            .join("\n");
        attachmentSection += `\n【添付URL】\n${urlList}`;
    }

    return `${contents}${attachmentSection}\n\n【所属】${affiliation}`;
};

const generateId = (item: OutputItem): string => {
    const { keijitype, genrecd, seqNo } = item.page.id;
    return `twins-${keijitype}-${genrecd}-${seqNo}`;
};

const toISODate = (dateStr: string): string => {
    // dateStr is in format "YYYY-MM-DD"
    return `${dateStr}T00:00:00Z`;
};

export const generateRSS = (items: OutputItem[]): string => { // RSS 2.0
    const lastBuildDate = new Date().toUTCString();

    // Sort by date descending (newest first)
    const sortedItems = [...items].sort((a, b) => b.page.date.localeCompare(a.page.date));

    const itemsXml = sortedItems
        .map((item) => {
            const title = escapeXml(item.page.title);
            const link = escapeXml(item.url);
            const description = escapeXml(buildContent(item));
            const guid = escapeXml(generateId(item));
            const pubDate = new Date(item.updated).toUTCString();

            return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(FEED_HOME_URL)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>${FEED_GENERATOR}</generator>
${itemsXml}
  </channel>
</rss>`;
};

export const generateAtom = (items: OutputItem[]): string => { // Atom
    const updated = new Date().toISOString();

    // Sort by date descending (newest first)
    const sortedItems = [...items].sort((a, b) => b.page.date.localeCompare(a.page.date));

    const entriesXml = sortedItems
        .map((item) => {
            const title = escapeXml(item.page.title);
            const link = escapeXml(item.url);
            const content = escapeXml(buildContent(item));
            const id = escapeXml(generateId(item));
            const published = toISODate(item.page.date);
            const entryUpdated = item.updated;

            return `  <entry>
    <title>${title}</title>
    <link href="${link}" />
    <id>${id}</id>
    <published>${published}</published>
    <updated>${entryUpdated}</updated>
    <content type="text">${content}</content>
  </entry>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(FEED_TITLE)}</title>
  <id>${escapeXml(FEED_HOME_URL)}</id>
  <link href="${escapeXml(FEED_HOME_URL)}" />
  <updated>${updated}</updated>
  <subtitle>${escapeXml(FEED_DESCRIPTION)}</subtitle>
  <generator>${FEED_GENERATOR}</generator>
${entriesXml}
</feed>`;
};

export const generateJSONFeed = (items: OutputItem[]): string => { // JSON feed
    // Sort by date descending (newest first)
    const sortedItems = [...items].sort((a, b) => b.page.date.localeCompare(a.page.date));

    const feed = {
        version: "https://jsonfeed.org/version/1.1",
        title: FEED_TITLE,
        home_page_url: FEED_HOME_URL,
        description: FEED_DESCRIPTION,
        items: sortedItems.map((item) => ({
            id: generateId(item),
            url: item.url,
            title: item.page.title,
            content_text: buildContent(item),
            date_published: item.updated,
        })),
    };

    return JSON.stringify(feed, null, 2);
};
