import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { render } from 'ink';
import { App } from './app.js';
function ConnectedApp({ controller, requestExit }) {
    const [snapshot, setSnapshot] = useState(() => controller.snapshot());
    useEffect(() => controller.subscribe(() => { setSnapshot(controller.snapshot()); }), [controller]);
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
    return _jsx(App, { snapshot: snapshot, dispatch: dispatch });
}
/** Mount the interactive Ink surface over the shared Harness controller. */
export async function runInkMode(controller, startup) {
    await controller.start(startup.resume);
    if (startup.prompt !== undefined)
        await controller.submit(startup.prompt);
    const exit = Promise.withResolvers();
    const instance = render(_jsx(ConnectedApp, { controller: controller, requestExit: () => { exit.resolve(); } }), { exitOnCtrlC: false, patchConsole: false });
    try {
        await exit.promise;
    }
    finally {
        instance.unmount();
        await controller.stop();
    }
}
//# sourceMappingURL=ink-mode.js.map