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

export const fetchDetailPage = async (keijitype: number, genrecd: number, seqNo: number) => {
    const url = generateUrl(keijitype, genrecd, seqNo);
    console.log(`Fetching detail page from URL: ${url}`);
    console.log(`Using User-Agent: ${userAgent}`);
    const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        headers: {
            "User-Agent": userAgent,
        },
    }).then((res) => {
        return res.headers.get("Location");
    });

    return response;
};
