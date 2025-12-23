import { hostname } from "./envs.js";

export const fetchIndexPage = async () => {
    const response = await fetch(`${hostname}/campusweb/`).then((res) => res.text());

    return response;
};
