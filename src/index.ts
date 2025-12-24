import { parseIndexPage } from "./parseIndexPage.js";
import { fetchIndexPage } from "./fetchIndexPage.js";
import { fetchDetailPage } from "./fetchDetailPage.js";
import { parseDetailPage } from "./parseDetailPage.js";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchAttachments } from "./fetchAttachments.js";
import { detectNewItems } from "./fetchDiffDetect.js";
import { generateUrl } from "./generateUrl.js";
import { generateRSS, generateAtom, generateJSONFeed } from "./generateFeeds.js";

const mapSeries = async <T, R>(items: readonly T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
    // 並列でやるとアクセスしすぎなので
    const results: R[] = [];
    for (const i of items) {
        const result = await fn(i);
        results.push(result);
    }
    return results;
};

const main = async () => {
    await mkdir("output/attachments", { recursive: true });
    // Fetch the announcement page
    const indexHtml = await fetchIndexPage();

    // Parse the announcement page
    const parsedIndexPage = parseIndexPage(indexHtml);

    // Detect new items by comparing with existing output.json
    const { newItems, existingData } = await detectNewItems(parsedIndexPage, "output/output.json");

    console.log(`Total items: ${parsedIndexPage.length}, New items: ${newItems.length}, Existing items: ${existingData.length}`);

    const newResults = await mapSeries(newItems, async (page) => {
        const { response, cookies } = await fetchDetailPage(page.id.keijitype, page.id.genrecd, page.id.seqNo);
        const parsedDetailPage = parseDetailPage(response);

        const solvedAttachments = await mapSeries(parsedDetailPage.attachments, async (attachment) => {
            if (attachment.type === "url") {
                return attachment;
            }

            const solvedItems = await Promise.all(
                attachment.items.map(async (item) => {
                    const body = await fetchAttachments(item.url, cookies);

                    const filePath = `output/attachments/${Buffer.from(crypto.getRandomValues(new Uint8Array(16)))
                        .toString("hex")
                        .slice(0, 8)}-${item.title.replace(/\//g, "_")}`;
                    await writeFile(filePath, Buffer.from(body));

                    return {
                        title: item.title,
                        url: filePath,
                    };
                }),
            );

            return {
                type: attachment.type,
                items: solvedItems,
            };
        });

        return {
            page,
            parsedDetailPage: {
                ...parsedDetailPage,
                attachments: solvedAttachments,
            },
            url: generateUrl(page.id.keijitype, page.id.genrecd, page.id.seqNo),
        };
    });

    // Merge existing data with new results (existing first, new last)
    const result = [...existingData, ...newResults];

    console.log(`Final output: ${result.length} items`);

    await writeFile("output/output.json", JSON.stringify(result, null, 2));

    // Generate RSS feeds
    console.log("Generating RSS feeds...");
    const rssContent = generateRSS(result);
    const atomContent = generateAtom(result);
    const jsonFeedContent = generateJSONFeed(result);

    await Promise.all([
        writeFile("output/rss.xml", rssContent),
        writeFile("output/atom.xml", atomContent),
        writeFile("output/feed.json", jsonFeedContent),
    ]);

    console.log("RSS feeds generated successfully!");
};

main();
