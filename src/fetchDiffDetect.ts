import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

type IndexPageItem = {
    title: string;
    id: {
        keijitype: number;
        genrecd: number;
        seqNo: number;
    };
    date: string;
};

type OutputItem = {
    page: IndexPageItem;
    parsedDetailPage: unknown;
};

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
    const existingData: OutputItem[] = JSON.parse(existingDataRaw);

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
