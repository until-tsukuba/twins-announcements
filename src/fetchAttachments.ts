import { hostname, userAgent } from "./envs.js";
import { stringifyCookie } from "./fetchDetailPage.js";

export const fetchAttachments = async (url: string, cookies: Map<string, string>) => {
    const response = await fetch(new URL(url, `${hostname}/campusweb/`), {
        method: "GET",
        redirect: "manual",
        headers: {
            "User-Agent": userAgent,
            Cookie: stringifyCookie(cookies),
        },
    });
    const body = await response.arrayBuffer();
    return body;
};
