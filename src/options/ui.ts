/** Escapes a string for safe insertion into innerHTML. */
export function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => {
        switch (c) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case '\'': return '&#39;';
            default: return c;
        }
    });
}

let toastTimer: number | undefined;

export function showToast(message: string, kind: 'success' | 'error' = 'success'): void {
    const el = document.querySelector<HTMLElement>('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', kind === 'error');
    el.hidden = false;
    if (toastTimer !== undefined) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        el.hidden = true;
    }, 2200);
}

export function uniqueId(prefix = 'id'): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
