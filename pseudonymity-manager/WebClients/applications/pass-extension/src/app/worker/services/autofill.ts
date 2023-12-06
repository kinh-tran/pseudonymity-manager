import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady, withContext } from 'proton-pass-extension/app/worker/context';
import store from 'proton-pass-extension/app/worker/store';
import { setPopupIconBadge } from 'proton-pass-extension/lib/utils/popup-icon';
import { isContentScriptPort } from 'proton-pass-extension/lib/utils/port';
// import type { WebRequest } from 'webextension-polyfill';

import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/hooks/usePasswordGenerator';
import { clientReady } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import type { SelectAutofillCandidatesOptions } from '@proton/pass/lib/search/types';
import { itemAutofilled } from '@proton/pass/store/actions';
import {
    selectAutofillCandidates,
    selectItemByShareIdAndId,
    selectPopupPasswordOptions,
    selectVaultLimits,
    selectWritableVaults,
} from '@proton/pass/store/selectors';
import type { Maybe, SafeLoginItem } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { parseSender, parseUrl } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';
// import { useLocation } from 'react-router-dom';
// import { useEffect } from 'react';

export const createAutoFillService = () => {
    const getAutofillCandidates = (options: SelectAutofillCandidatesOptions): SafeLoginItem[] =>
        selectAutofillCandidates(options)(store.getState()).map((item) => ({
            name: item.data.metadata.name,
            username: deobfuscate(item.data.content.username),
            note: deobfuscate(item.data.metadata.note),
            itemId: item.itemId,
            shareId: item.shareId,
            url: item.data.content.urls?.[0],
        }));

    const getAutofillData = ({
        shareId,
        itemId,
    }: {
        shareId: string;
        itemId: string;
    }): Maybe<{ username: string; password: string }> => {
        const state = store.getState();
        const item = selectItemByShareIdAndId(shareId, itemId)(state);

        if (item !== undefined && item.data.type === 'login') {
            store.dispatch(itemAutofilled({ shareId, itemId }));
            return {
                username: deobfuscate(item.data.content.username),
                password: deobfuscate(item.data.content.password),
            };
        }
    };

    const updateTabsBadgeCount = withContext(({ status }) => {
        if (!clientReady(status)) return;

        browser.tabs
            .query({ active: true })
            .then((tabs) =>
                Promise.all(
                    tabs.map(({ id: tabId, url }) => {
                        if (tabId) {
                            const state = store.getState();
                            const items = getAutofillCandidates(parseUrl(url));
                            const writableShareIds = selectWritableVaults(state).map(prop('shareId'));
                            const { didDowngrade } = selectVaultLimits(state);

                            /* if the user has downgraded : we want to keep the tab badge count
                             * with the total items matched, but sync the autofillable candidates
                             * in the content-scripts to be only the ones from the writable vaults */
                            const count = items.length;
                            const safeItems = items.filter(
                                (item) => !didDowngrade || writableShareIds.includes(item.shareId)
                            );

                            WorkerMessageBroker.ports.broadcast(
                                {
                                    type: WorkerMessageType.AUTOFILL_SYNC,
                                    payload: { items: safeItems, needsUpgrade: didDowngrade },
                                },
                                isContentScriptPort(tabId)
                            );

                            return setPopupIconBadge(tabId, count);
                        }
                    })
                )
            )
            .catch(noop);
    });

    /* Clears badge count for each valid tab
     * Triggered on logout detection to avoid
     * showing stale counts */
    const clearTabsBadgeCount = () => {
        browser.tabs
            .query({})
            .then((tabs) => Promise.all(tabs.map(({ id: tabId }) => tabId && setPopupIconBadge(tabId, 10))))
            .catch(noop);
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_QUERY,
        onContextReady(({ getState }, _, sender) => {
            if (!getState().loggedIn) return { items: [], needsUpgrade: false };

            const { url, tabId } = parseSender(sender);
            const writableShareIds = selectWritableVaults(store.getState()).map(prop('shareId'));
            const { didDowngrade } = selectVaultLimits(store.getState());

            /* if user has exceeded his vault count limit - this likely means
             * has downgraded to a free plan : only allow him to autofill from
             * his writable vaults */
            const items = getAutofillCandidates({
                ...url,
                ...(didDowngrade ? { shareIds: writableShareIds } : {}),
            });

            if (tabId) void setPopupIconBadge(tabId, items.length);

            return { items: tabId !== undefined && items.length > 0 ? items : [], needsUpgrade: didDowngrade };
        })
    );

    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOFILL_PASSWORD_OPTIONS, () => {
        return { options: selectPopupPasswordOptions(store.getState()) ?? DEFAULT_RANDOM_PW_OPTIONS };
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_SELECT,
        onContextReady(async (_, message) => {
            const credentials = getAutofillData(message.payload);
            if (credentials === undefined) throw new Error('Could not get credentials for autofill request');

            return credentials;
        })
    );

    /* onUpdated will be triggered every time a tab
     * has been loaded with a new url : update the
     * badge count accordingly */
    browser.tabs.onUpdated.addListener(
        onContextReady((_, tabId, __, tab) => {
            if (tabId) {
                const items = getAutofillCandidates(parseUrl(tab.url));
                // fetch('http://localhost:3000/US')
                // .then(data => {
                //     console.log(data)
                // })
                // .catch(error => {
                //     console.error('API Error:', error);
                //     // You may handle errors and decide whether to allow the navigation or not
                // });
                return setPopupIconBadge(tabId, items.length);
            }
        })
    );

    // const onBeforeRequest = async (request: WebRequest.OnBeforeRequestDetailsType) => {
    //     const { tabId, requestId } = request;
    //     if (tabId >= 0) {
    //         try {
    //             const tab = await browser.tabs.get(tabId);
    //             if (tab.url !== undefined) {
    //                 const { domain } = parseUrl(tab.url);
    //                 if (domain) {
    //                     // pendingRequests.set(requestId, { tabId, domain, requestedAt: request.timeStamp });
    //                 }
    //             }
    //         } catch (_) {}
    //     }

    //     // garbageCollect();

    //     return { cancel: true }; 
    // };
    // let apiCallComplete = false;
    // const location = useLocation();

    // useEffect(() => {
    //     console.log('The current route is ${location.pathname}');
    //   }, [location]);

    // browser.webRequest.onBeforeRequest.addListener(
        // (current_details) => {
            browser.webNavigation.onBeforeNavigate.addListener(
                function onBeforeNavigateCallback (details) {
                    // const locationCookie = Cookie.get('location_cookie');
                    // browser.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigateCallback);
                    const items = getAutofillCandidates(parseUrl(details.url));
                    console.log(items);
                    // if (items.length > 0 && current_details.url !== details.url) {
                    if (items.length > 0 && details.parentFrameId <= details.frameId) {
                        const myCountry = items[0].note;
                        // console.log(myCountry);
                    fetch('http://localhost:3000/connect/' + myCountry)
                            .then(data => {
                                console.log('API Response:', data);
                                // browser.tabs.update(details.tabId, { url: details.url })
                                //     .catch(error => {
                                //         console.error('Error:', error);
                                //     });
                                // apiCallComplete = true;
                            })
                            .catch(error => {
                                console.error('API Error:', error);
                                // You may handle errors and decide whether to allow the navigation or not
                            });
                            // Block the navigation by canceling the request
                            // if (!apiCallComplete) {
                            //     return { cancel: true };
                            // }
                        return {};
                    }
                },
            );
    //     }, 
    //     { urls: ['<all_urls>'], types: ['xmlhttprequest'] }, 
    //     ['requestBody']
    // );

    // const items = getAutofillCandidates(parseUrl(details.url));
    // browser.tabs.update(details.tabId, { url: details.url })
    //     .catch(error => {
    //         console.error('Error:', error);
    //     });

    // browser.webRequest.onBeforeRequest.addListener(
    //     // onBeforeRequest,
    //     (details) => {
    //         // Make your API call here before allowing the navigation
    //         fetch('http://localhost:3000/disconnect')
    //             .then(data => {
    //                 console.log('API Response:', data);
    //                 // Allow the navigation after the API call
    //                 browser.webNavigation.onBeforeNavigate.addListener(
    //                     function onBeforeNavigateCallback(details) {
    //                         browser.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigateCallback);
    //                         console.log('Navigating to:', details.url);
    //                     },
    //                     { url: [{ urlEquals: details.url }] }
    //                 );
    //                 // const items = getAutofillCandidates(parseUrl(details.url));
    //                 browser.tabs.update(details.tabId, { url: details.url })
    //                     .catch(error => {
    //                         console.error('Error:', error);
    //                     });
    //             })
    //             .catch(error => {
    //                 console.error('API Error:', error);
    //                 // You may handle errors and decide whether to allow the navigation or not
    //             });
      
    //         // Block the original request while making the API call
    //         return { cancel: true };
    //     },
    //     { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
    //     ["requestBody"]
    // );

    return { getAutofillCandidates, updateTabsBadgeCount, clearTabsBadgeCount };
};

export type AutoFillService = ReturnType<typeof createAutoFillService>;
