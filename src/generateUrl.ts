import { hostname } from "./envs.js";

export const generateUrl = (keijitype: number, genrecd: number, seqNo: number): string => {
    const searchParams = new URLSearchParams({
        _flowId: "POW1200000-flow",
        calledFlow: "keiji",
        keijitype: keijitype + "",
        genrecd: genrecd + "",
        seqNo: seqNo + "",
    });
    const url = new URL(`/campusweb/campussquare.do`, hostname);
    url.search = searchParams.toString();
    return url.toString();
};
