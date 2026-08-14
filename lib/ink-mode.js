import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { readBannerFacts } from './banner-facts.js';
export const inkInternals = { render, stdout: process.stdout };
export function installResizeCleanup(output, clearInkOutput) {
    const clearBeforeResize = () => {
        clearInkOutput();
        output.write('\u001B[2J\u001B[H');
    };
    output.prependListener('resize', clearBeforeResize);
    return () => { output.off('resize', clearBeforeResize); };
}
export function ConnectedApp({ controller, requestExit, bannerFacts }) {
    const [snapshot, setSnapshot] = useState(() => controller.snapshot());
    useEffect(() => {
        const refresh = () => { setSnapshot(controller.snapshot()); };
        const unsubscribe = controller.subscribe(refresh);
        refresh();
        return unsubscribe;
    }, [controller]);
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
    const exit = Promise.withResolvers();
    let closing = false;
    let startupFailure;
    let teardownFailure;
    const requestExit = () => {
        closing = true;
        exit.resolve();
    };
    const instance = inkInternals.render(_jsx(ConnectedApp, { controller: controller, requestExit: requestExit, bannerFacts: bannerFacts }), { exitOnCtrlC: false, patchConsole: false });
    const removeResizeCleanup = installResizeCleanup(inkInternals.stdout, () => { instance.clear(); });
    const startupTask = (async () => {
        try {
            await controller.start(startup.resume);
            if (!closing && startup.prompt !== undefined)
                await controller.submit(startup.prompt);
        }
        catch (error) {
            startupFailure = { error };
            exit.reject(error);
        }
    })();
    const recordTeardownFailure = (error) => {
        teardownFailure ??= { error };
    };
    try {
        await exit.promise;
    }
    catch {
        // Startup failures are rethrown after teardown.
    }
    finally {
        closing = true;
        try {
            controller.cancel();
        }
        catch (error) {
            recordTeardownFailure(error);
        }
        await startupTask;
        try {
            await controller.stop();
        }
        catch (error) {
            recordTeardownFailure(error);
        }
        try {
            removeResizeCleanup();
        }
        catch (error) {
            recordTeardownFailure(error);
        }
        try {
            instance.unmount();
        }
        catch (error) {
            recordTeardownFailure(error);
        }
    }
    if (startupFailure !== undefined)
        throw startupFailure.error;
    if (teardownFailure !== undefined)
        throw teardownFailure.error;
}
//# sourceMappingURL=ink-mode.js.map