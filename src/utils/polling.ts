export async function poll(action: () => Promise<any> | any, delayTime: number) {
    try {
        await delay(delayTime);
        await action();
    } catch (e) {
        console.error(e);
    } finally {
        poll(action, delayTime);
    }
}

export async function pollImmediate(action: () => Promise<any> | any, delayTime: number) {
    try {
        await action();
    } catch (e) {
        console.error(e);
    } finally {
        await delay(delayTime);
        poll(action, delayTime);
    }
}

export function delay(timeout: number) {
    return new Promise<void>(resolve => setTimeout(resolve, timeout));
}
