import type { ExtensionConfig } from '../shared/types';

/** Shared mutable state between the options page controller and the tab modules. */
export interface State {
    config: ExtensionConfig;
}
