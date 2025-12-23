import { parseIndexPage } from "./parseIndexPage.js";
import { fetchIndexPage } from "./fetchIndexPage.js";
import { fetchDetailPage } from "./fetchDetailPage.js";
import { parseDetailPage } from "./parseDetailPage.js";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchAttachments } from "./fetchAttachments.js";

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
    await mkdir("attachments")
    // Fetch the announcement page
    const indexHtml = await fetchIndexPage();

    // Parse the announcement page
    const parsedIndexPage = parseIndexPage(indexHtml);

    console.log(parsedIndexPage);

    const result = await mapSeries(parsedIndexPage, async (page) => {
        const { response, cookies } = await fetchDetailPage(page.id.keijitype, page.id.genrecd, page.id.seqNo);
        const parsedDetailPage = parseDetailPage(response);

        const solvedAttachments = await mapSeries(parsedDetailPage.attachments, async (attachment) => {
            if (attachment.type === "url") {
                return attachment;
            }

            const solvedItems = await Promise.all(
                attachment.items.map(async (item) => {
                    const body = await fetchAttachments(item.url, cookies);

                    const filePath = `attachments/${Buffer.from(crypto.getRandomValues(new Uint8Array(16)))
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
        };
    });

    console.log(result);

    writeFile("output.json", JSON.stringify(result, null, 2));
};

main();
