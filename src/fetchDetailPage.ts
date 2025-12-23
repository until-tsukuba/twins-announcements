import { hostname, userAgent } from "./envs.js";

const generateUrl = (keijitype: number, genrecd: number, seqNo: number): string => {
    const searchParams = new URLSearchParams({
        _flowId: "POW1200000-flow",
        _campus_new_portal: "true",
        _action_id: "displayPortletRequest",
        calledFlow: "keiji",
        keijitype: keijitype + "",
        genrecd: genrecd + "",
        seqNo: seqNo + "",
    });
    const url = new URL(`/campusweb/campussquare.do`, hostname);
    url.search = searchParams.toString();
    return url.toString();
};

const parseCookie = (cookies: readonly string[]) => {
    const map = new Map(
        cookies.map((c) => {
            const p = c.split(";")[0]?.trim().split("=");
            return [p?.[0] ?? "", p?.[1] ?? ""];
        }),
    );

    return map;
};

export const stringifyCookie = (cookies: Map<string, string> | null): string => {
    if (!cookies) {
        return "";
    }
    return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
};

export const fetchDetailPage = async (keijitype: number, genrecd: number, seqNo: number) => {
    const url = generateUrl(keijitype, genrecd, seqNo);
    console.log(`Fetching detail page from URL: ${url}`);
    const firstResponse = await fetch(url, {
        method: "GET",
        redirect: "manual",
        headers: {
            "User-Agent": userAgent,
        },
    });

    const redirectURL = firstResponse.headers.get("location");
    const cookies = parseCookie(firstResponse.headers.getSetCookie() || []);

    if (!redirectURL) {
        throw new Error("No redirect URL found");
    }

    const response = await fetch(new URL(redirectURL, hostname), {
        method: "GET",
        headers: {
            "User-Agent": userAgent,
            Cookie: stringifyCookie(cookies),
        },
    }).then((res) => res.text());

    return { response, cookies };
};
