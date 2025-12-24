import * as parse5 from "parse5";

export const parseDateString = (dateString: string) => {
    // 2025/12/04
    const match = dateString.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!match || !match[1] || !match[2] || !match[3]) {
        throw new Error(`Invalid date string format: ${dateString}`);
    }
    const year = +match[1];
    const month = +match[2];
    const day = +match[3];
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

export const parsePeriodString = (periodString: string): { start: string; end: string } => {
    // "2025/12/23 - 2026/1/23"
    const term = periodString.split(" - ");
    if (!term[0] || !term[1]) {
        throw new Error(`Invalid period string format: ${periodString}`);
    }
    const start = parseDateString(term[0]);
    const end = parseDateString(term[1]);
    return { start, end };
};

export function isElement(node: parse5.DefaultTreeAdapterTypes.Node | undefined): node is parse5.DefaultTreeAdapterTypes.Element {
    return node !== undefined && "tagName" in node;
}

export function assertElement(node: parse5.DefaultTreeAdapterTypes.Node | undefined): asserts node is parse5.DefaultTreeAdapterTypes.Element {
    if (!isElement(node)) {
        throw new Error("Node is not an element");
    }
}

export function assertBrElement(node: parse5.DefaultTreeAdapterTypes.Node | undefined): asserts node is parse5.DefaultTreeAdapterTypes.Element {
    assertElement(node);
    if (node.tagName !== "br") {
        throw new Error(`Invalid br element: expected br, got ${node.tagName}`);
    }
}

export function assertTextNode(node: parse5.DefaultTreeAdapterTypes.ChildNode | undefined): asserts node is parse5.DefaultTreeAdapterTypes.TextNode {
    if (!node) {
        throw new Error(`Invalid text node: expected text, got undefined`);
    }
    if (node.nodeName !== "#text") {
        throw new Error(`Invalid text node: expected text, got ${node?.nodeName}`);
    }
}

export const pickTag = (node: parse5.DefaultTreeAdapterTypes.Element | parse5.DefaultTreeAdapterTypes.Document, tagName: string): parse5.DefaultTreeAdapterTypes.Element => {
    const elem = node.childNodes.filter(isElement).find((n) => {
        return n.tagName === tagName;
    });

    if (!elem) {
        throw new Error(`No ${tagName} element found`);
    }

    return elem;
};

export const pickId = (node: parse5.DefaultTreeAdapterTypes.Element, id: string): parse5.DefaultTreeAdapterTypes.Element => {
    const elem = node.childNodes.filter(isElement).find((n) => {
        return n.attrs.some((attr) => attr.name === "id" && attr.value === id);
    });

    if (!elem) {
        throw new Error(`No element with id ${id} found`);
    }

    return elem;
};

export const getTextContent = (node: parse5.DefaultTreeAdapterTypes.Element): string => {
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

export const getAllTextContent = (node: parse5.DefaultTreeAdapterTypes.Element): string => {
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
