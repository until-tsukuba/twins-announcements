import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { generateUrl } from "./generateUrl.js";
import type { IndexPageItem, OutputItem } from "./types.js";

/**
 * 既存のoutput.jsonを読み込み、新規のお知らせのみを抽出する
 * @param indexPageItems parseIndexPageで取得した一覧
 * @param outputPath output.jsonのパス
 * @returns 新規のお知らせのみの配列
 */
export const detectNewItems = async (
    indexPageItems: IndexPageItem[],
    outputPath: string,
): Promise<{ newItems: IndexPageItem[]; existingData: OutputItem[] }> => {
    // output.jsonが存在しない場合は全件新規として扱う
    if (!existsSync(outputPath)) {
        return {
            newItems: indexPageItems,
            existingData: [],
        };
    }

    // 既存データを読み込む
    const existingDataRaw = await readFile(outputPath, "utf-8");
    const existingDataParsed = JSON.parse(existingDataRaw);

    // 既存データにurlフィールドがない場合は補完
    const existingData: OutputItem[] = existingDataParsed.map((item: any) => {
        if (!item.url) {
            const { keijitype, genrecd, seqNo } = item.page.id;
            item.url = generateUrl(keijitype, genrecd, seqNo);
        }
        return item;
    });

    // 既存のIDセットを作成
    const existingIds = new Set(
        existingData.map((item) => {
            const { keijitype, genrecd, seqNo } = item.page.id;
            return `${keijitype}-${genrecd}-${seqNo}`;
        }),
    );

    // 新規のアイテムのみを抽出
    const newItems = indexPageItems.filter((item) => {
        const { keijitype, genrecd, seqNo } = item.id;
        const idKey = `${keijitype}-${genrecd}-${seqNo}`;
        return !existingIds.has(idKey);
    });

    return {
        newItems,
        existingData,
    };
};
