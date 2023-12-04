export async function storeCredentials(id: string, password: string) {
    if (!navigator.credentials) {
        return; // Feature not available
    }

    try {
        // @ts-ignore
        const cred = new window.PasswordCredential({
            id,
            password,
        });
        await navigator.credentials.store(cred);
    } catch (e: any) {
        // Firefox will crash because it thinks publicKey is mandatory inside cred.
        // Even if the spec says otherwise
        // Current API inside Firefox
    }
}
