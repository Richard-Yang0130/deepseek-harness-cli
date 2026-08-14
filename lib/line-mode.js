/** Drive the shared controller with newline-delimited input for pipes and basic terminals. */
export async function runLineMode(controller, io, startup) {
    const showNotice = () => {
        const notice = controller.snapshot().notice;
        if (notice !== undefined)
            io.write(`${notice}\n`);
    };
    io.onInterrupt(() => {
        if (controller.snapshot().phase === 'running')
            controller.cancel();
        else
            io.close();
    });
    try {
        await controller.start(startup.resume);
        if (startup.prompt !== undefined) {
            await controller.submit(startup.prompt);
            showNotice();
        }
        while (true) {
            const value = await io.read('you> ');
            if (value === undefined || value.trim() === '/exit' || value.trim() === '/quit')
                break;
            await controller.submit(value);
            showNotice();
        }
    }
    finally {
        await controller.stop();
        io.close();
    }
}
//# sourceMappingURL=line-mode.js.map