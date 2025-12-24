import * as parse5 from "parse5";
import { getAllTextContent, getTextContent, isElement, parseDateString, parsePeriodString, pickId, pickTag } from "./parseUtil.js";

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
