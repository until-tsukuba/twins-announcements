import * as parse5 from "parse5";
import { assertBrElement, assertElement, assertTextNode, isElement, parseDateString, pickTag } from "./parseUtil.js";

const visit = (node: parse5.DefaultTreeAdapterTypes.Node, visitor: (node: parse5.DefaultTreeAdapterTypes.Node) => boolean) => {
    const visitChild = visitor(node);
    if (!visitChild) {
        return;
    }
    const children = "childNodes" in node ? node.childNodes : [];
    for (const child of children) {
        visit(child, visitor);
    }
};

export const parseIndexPage = (htmlString: string) => {
    const parsed = parse5.parse(htmlString);

    let targetElem: parse5.DefaultTreeAdapterTypes.Element | null = null;
    visit(parsed, (node) => {
        if (!isElement(node)) {
            return true;
        }
        if (!(node.tagName === "div" && node.attrs.some((attr) => attr.name === "id" && attr.value === "keiji-portlet"))) {
            return true;
        }
        targetElem = node;
        return false;
    });

    if (targetElem === null) {
        throw new Error("No elements found");
    }

    const div: parse5.DefaultTreeAdapterTypes.Element = targetElem;

    const table = pickTag(div, "table");

    const tbody = pickTag(table, "tbody");

    const trList = tbody.childNodes.filter(isElement);

    const records = trList.map((tr) => {
        const td = pickTag(tr, "td");

        if (td.childNodes.length < 7) {
            throw new Error("td element has insufficient child nodes");
        }

        const [_text1, title, _br1, dateText, _br2, _br3, _text2] = td.childNodes;

        assertTextNode(_text1);
        assertTextNode(_text2);
        assertBrElement(_br1);
        assertBrElement(_br2);
        assertBrElement(_br3);

        assertElement(title);

        if (title.tagName !== "a") {
            throw new Error("Title element is not an anchor");
        }

        if (title.childNodes.length !== 1) {
            throw new Error("Title element has unexpected child nodes");
        }

        const titleTextNode = title.childNodes[0];
        assertTextNode(titleTextNode);

        const titleText = titleTextNode.value;

        const titleOnclick = title.attrs.find((attr) => attr.name === "onclick")?.value;

        if (!titleOnclick) {
            throw new Error("Title onclick attribute is missing");
        }

        const parsedOnclick = titleOnclick.match(/^showKeijiDetail\('(\d+)', '(\d+)', '(\d+)'\);$/);
        if (!parsedOnclick) {
            throw new Error("Title onclick attribute has invalid format");
        }

        const [, keijitypeText, genrecdText, seqNoText] = parsedOnclick;
        if (!keijitypeText || !genrecdText || !seqNoText) {
            throw new Error("Title onclick attribute is missing parameters");
        }

        const keijitype = +keijitypeText;
        const genrecd = +genrecdText;
        const seqNo = +seqNoText;
        if (isNaN(keijitype) || isNaN(genrecd) || isNaN(seqNo)) {
            throw new Error("Title onclick attribute has invalid numeric parameters");
        }

        const dateTextNode = dateText;
        assertTextNode(dateTextNode);

        const date = parseDateString(dateTextNode.value.trim());

        return {
            title: titleText.trim(),
            id: {
                keijitype,
                genrecd,
                seqNo,
            },
            date: date.trim(),
        };
    });

    return records;
};
