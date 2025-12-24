import * as parse5 from "parse5";
import { parseDateString, parsePeriodString } from "./parseUtil.js";

function isElement(node: parse5.DefaultTreeAdapterTypes.Node | undefined): node is parse5.DefaultTreeAdapterTypes.Element {
    return node !== undefined && "tagName" in node;
}

// function assertElement(node: parse5.DefaultTreeAdapterTypes.Node | undefined): asserts node is parse5.DefaultTreeAdapterTypes.Element {
//     if (!isElement(node)) {
//         throw new Error("Node is not an element");
//     }
// }

// function assertBrElement(node: parse5.DefaultTreeAdapterTypes.Node | undefined): asserts node is parse5.DefaultTreeAdapterTypes.Element {
//     assertElement(node);
//     if (node.tagName !== "br") {
//         throw new Error(`Invalid br element: expected br, got ${node.tagName}`);
//     }
// }

// function assertTextNode(node: parse5.DefaultTreeAdapterTypes.ChildNode | undefined): asserts node is parse5.DefaultTreeAdapterTypes.TextNode {
//     if (!node) {
//         throw new Error(`Invalid text node: expected text, got undefined`);
//     }
//     if (node.nodeName !== "#text") {
//         throw new Error(`Invalid text node: expected text, got ${node?.nodeName}`);
//     }
// }

// const visit = (node: parse5.DefaultTreeAdapterTypes.Node, visitor: (node: parse5.DefaultTreeAdapterTypes.Node) => boolean) => {
//     const visitChild = visitor(node);
//     if (!visitChild) {
//         return;
//     }
//     const children = "childNodes" in node ? node.childNodes : [];
//     for (const child of children) {
//         visit(child, visitor);
//     }
// };

const pickTag = (node: parse5.DefaultTreeAdapterTypes.Element | parse5.DefaultTreeAdapterTypes.Document, tagName: string): parse5.DefaultTreeAdapterTypes.Element => {
    const elem = node.childNodes.filter(isElement).find((n) => {
        return n.tagName === tagName;
    });

    if (!elem) {
        throw new Error(`No ${tagName} element found`);
    }

    return elem;
};

const pickId = (node: parse5.DefaultTreeAdapterTypes.Element, id: string): parse5.DefaultTreeAdapterTypes.Element => {
    const elem = node.childNodes.filter(isElement).find((n) => {
        return n.attrs.some((attr) => attr.name === "id" && attr.value === id);
    });

    if (!elem) {
        throw new Error(`No element with id ${id} found`);
    }

    return elem;
};

const getTextContent = (node: parse5.DefaultTreeAdapterTypes.Element): string => {
    if (node.childNodes.length !== 1) {
        throw new Error("Unexpected number of child nodes");
    }
    const textNode = node.childNodes[0];
    if (!textNode || isElement(textNode)) {
        throw new Error("No child node found");
    }
    if (textNode.nodeName !== "#text") {
        throw new Error("Child node is not a text node");
    }
    return textNode.value;
};

const getAllTextContent = (node: parse5.DefaultTreeAdapterTypes.Element): string => {
    let text = "";
    for (const child of node.childNodes) {
        if (!isElement(child) && child.nodeName === "#text") {
            text += child.value;
        } else if (isElement(child) && child.tagName === "br") {
            text += "\n";
        } else {
            throw new Error("Unexpected child node");
        }
    }
    return text;
};

export const parseDetailPage = (htmlString: string) => {
    const parsed = parse5.parse(htmlString);

    const html = pickTag(parsed, "html");
    const body = pickTag(html, "body");
    const portlet = pickTag(body, "div");

    const portalLoginZenbunForm = pickId(portlet, "-PortalLoginZenbunForm");

    // title

    const titleBox = pickId(portalLoginZenbunForm, "webpage-list-title-box");
    const titleInner = pickTag(titleBox, "div");
    const titleAnchor = pickTag(titleInner, "a");
    const anchorText = getTextContent(titleAnchor);
    const titleTextsIndex = anchorText.lastIndexOf("\u00A0\u00A0");

    if (titleTextsIndex === -1) {
        throw new Error("Invalid title text format");
    }

    const titleText = anchorText.slice(0, titleTextsIndex).trim();
    const dateText = anchorText.slice(titleTextsIndex + 2).trim();
    if (!titleText || !dateText) {
        throw new Error("Title or date text is empty");
    }
    const date = parseDateString(dateText);

    // contents

    const contentsBox = pickId(portalLoginZenbunForm, "webpage-contents");
    const contents = getAllTextContent(contentsBox).trim();

    // attachments

    const attachmentsTables = portalLoginZenbunForm.childNodes.filter(isElement).filter((elem) => elem.tagName === "table");

    const attachments = attachmentsTables.map((table) => {
        const tbody = pickTag(table, "tbody");
        const trList = tbody.childNodes.filter(isElement).filter((elem) => elem.tagName === "tr");

        const headElem = trList[0];
        if (!headElem) {
            throw new Error("No attachment table header found");
        }
        const headTds = headElem.childNodes.filter(isElement).filter((elem) => elem.tagName === "th");
        if (headTds.length !== 1 || !headTds[0]) {
            throw new Error("Invalid attachment table header format");
        }
        const headText = getTextContent(headTds[0]).trim();

        const attachmentType = ((text) => {
            if (text === "添付ファイル") {
                return "file";
            } else if (text === "URL") {
                return "url";
            } else {
                throw new Error(`Unknown attachment type: ${text}`);
            }
        })(headText);

        const bodyElems = trList.slice(1);

        const items = bodyElems.map((tr) => {
            const tds = tr.childNodes.filter(isElement).filter((elem) => elem.tagName === "td");
            if (tds.length !== 1) {
                throw new Error("Invalid attachment table row format");
            }
            const td = tds[0];
            if (!td) {
                throw new Error("No attachment td found");
            }
            const anchor = pickTag(td, "a");
            const hrefAttr = anchor.attrs.find((attr) => attr.name === "href")?.value;
            if (!hrefAttr) {
                throw new Error("No href attribute found in attachment link");
            }
            const title = getTextContent(anchor).trim();
            if (!title) {
                throw new Error("Attachment title is empty");
            }

            if (attachmentType === "url") {
                if (title !== hrefAttr) {
                    throw new Error("URL attachment title and href do not match");
                }
                if (!hrefAttr.startsWith("http://") && !hrefAttr.startsWith("https://")) {
                    throw new Error("URL attachment href is not a valid URL");
                }
            }

            return {
                title: title,
                url: hrefAttr,
            };
        });

        return {
            type: attachmentType,
            items: items,
        };
    });

    // footer

    const footerBox = pickId(portalLoginZenbunForm, "webpage-contents-list-footer-box");
    const footerInner = pickTag(footerBox, "div");
    const footerText = getTextContent(footerInner).split("\u00A0\u00A0");

    if (footerText.length !== 3) {
        throw new Error("Invalid footer text format");
    }

    const affiliation = footerText[0]?.trim();
    const footerSecond = footerText[1]?.trim().split("\n");
    if (!footerSecond || footerSecond.length !== 2) {
        console.log(footerText);
        console.log(footerSecond);
        throw new Error("Invalid footer second text format");
    }
    const subAffiliation = footerSecond[0]?.trim();
    const periodLabel = footerSecond[1]?.trim();
    const periodText = footerText[2]?.trim();

    if (!affiliation || !subAffiliation || !periodLabel || !periodText) {
        throw new Error("Footer text parts are empty");
    }

    if (periodLabel !== "掲示期間") {
        throw new Error("Invalid period label");
    }
    const period = parsePeriodString(periodText);

    return {
        title: {
            text: titleText,
            date: date,
        },
        contents: contents,
        attachments: attachments,
        footer: {
            affiliation: affiliation,
            subAffiliation: subAffiliation,
            period: period,
        },
    };
};
