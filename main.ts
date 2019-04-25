import FocusPanel from './src/FocusPanel';

(window as any).focusPanelInit = function(options?: {mobileBreakpoint?: number}) {
    options = options || {};

    if (options.mobileBreakpoint) {
        FocusPanel.setMobileBreakpoint(options.mobileBreakpoint)
    }

    // create the FocusPanel instances
    document.querySelectorAll('.focus-panel').forEach(panelEl => {
        try {
            new FocusPanel(panelEl as HTMLElement);
        } catch (e) {
            console.error('Error occurred while instantiating Focus Panel', e);
        }
    });
}
