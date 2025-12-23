import { parseIndexPage } from "./parseIndexPage.js";
import { fetchIndexPage } from "./fetchIndexPage.js";
import { fetchDetailPage } from "./fetchDetailPage.js";

const main = async () => {
    // Fetch the announcement page
    const indexHtml = await fetchIndexPage();

    // Parse the announcement page
    const parsedPage = parseIndexPage(indexHtml);

    console.log(parsedPage);

    const first = parsedPage[0];

    if (!first) {
        throw new Error("Test error");
    }

    const detailHtml = await fetchDetailPage(first.id.keijitype, first.id.genrecd, first.id.seqNo);
    console.log(detailHtml);
};

main();
