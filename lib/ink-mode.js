import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { readBannerFacts } from './banner-facts.js';
export function installResizeCleanup(output, clearInkOutput) {
    const clearBeforeResize = () => {
        clearInkOutput();
        output.write('\u001B[2J\u001B[H');
    };
    output.prependListener('resize', clearBeforeResize);
    return () => { output.off('resize', clearBeforeResize); };
}
function ConnectedApp({ controller, requestExit, bannerFacts }) {
    const [snapshot, setSnapshot] = useState(() => controller.snapshot());
    useEffect(() => controller.subscribe(() => { setSnapshot(controller.snapshot()); }), [controller]);
    useEffect(() => {
        if (snapshot.exitRequested === true)
            requestExit();
    }, [requestExit, snapshot.exitRequested]);
    const dispatch = (intent) => {
        if (intent.type === 'submit') {
            void controller.submit(intent.value);
            return;
        }
        if (intent.type === 'cancel') {
            controller.cancel();
            return;
        }
        if (intent.type === 'exit')
            requestExit();
        if (intent.type === 'answer-approval' || intent.type === 'answer-question' || intent.type === 'cancel-decision') {
            controller.answerDecision(intent);
        }
    };
    return _jsx(App, { snapshot: snapshot, dispatch: dispatch, bannerFacts: bannerFacts });
}
/** Mount the interactive Ink surface over the shared Harness controller. */
export async function runInkMode(controller, startup) {
    const bannerFacts = await readBannerFacts();
    await controller.start(startup.resume);
    if (startup.prompt !== undefined)
        await controller.submit(startup.prompt);
    const exit = Promise.withResolvers();
    const instance = render(_jsx(ConnectedApp, { controller: controller, requestExit: () => { exit.resolve(); }, bannerFacts: bannerFacts }), { exitOnCtrlC: false, patchConsole: false });
    const removeResizeCleanup = installResizeCleanup(process.stdout, () => { instance.clear(); });
    try {
        await exit.promise;
    }
    finally {
        removeResizeCleanup();
        instance.unmount();
        await controller.stop();
    }
}
//# sourceMappingURL=ink-mode.js.map