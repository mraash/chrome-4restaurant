import { SIGNATURE_DONE_MARKER, SIGNATURE_REPLACEMENTS } from '../shared/constants';

export function replaceSignatures(): void {
    if (document.body.dataset[SIGNATURE_DONE_MARKER] === '1') return;
    for (const [from, to] of SIGNATURE_REPLACEMENTS) {
        replaceFirstTextOccurrence(document.body, from, to);
    }
    document.body.dataset[SIGNATURE_DONE_MARKER] = '1';
}

/**
 * Returns a stateful swapper function that applies each signature replacement at most once
 * across all the strings it is invoked with. Use this when the source text is split into
 * multiple segments (e.g. footer rows in the Excel export) but the "at most once" constraint
 * still applies to the document as a whole.
 */
export function createSignatureSwapper(): (text: string) => string {
    const consumed = new Set<number>();
    return (text: string) => {
        let out = text;
        for (let i = 0; i < SIGNATURE_REPLACEMENTS.length; i++) {
            if (consumed.has(i)) continue;
            const [from, to] = SIGNATURE_REPLACEMENTS[i]!;
            const idx = out.indexOf(from);
            if (idx !== -1) {
                out = out.slice(0, idx) + to + out.slice(idx + from.length);
                consumed.add(i);
            }
        }
        return out;
    };
}

function replaceFirstTextOccurrence(root: Node, from: string, to: string): boolean {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null = walker.nextNode();
    while (node) {
        const text = node.nodeValue ?? '';
        const idx = text.indexOf(from);
        if (idx !== -1) {
            node.nodeValue = text.slice(0, idx) + to + text.slice(idx + from.length);
            return true;
        }
        node = walker.nextNode();
    }
    return false;
}
