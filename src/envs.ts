import "dotenv/config";

export const hostname = process.env.TWINS_HOSTNAME ?? "https://twins.tsukuba.ac.jp";

export const userAgent = process.env.TWINS_USER_AGENT ?? "";
