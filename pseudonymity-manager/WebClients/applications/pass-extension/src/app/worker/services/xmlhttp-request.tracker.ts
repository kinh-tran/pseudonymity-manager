import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
};

type TrackedRequestData = { tabId: TabId; domain: string; requestedAt: number };

type XMLHTTPRequestTrackerOptions = {
    acceptRequest: (request: WebRequest.OnBeforeRequestDetailsType) => boolean;
    onFailedRequest: (data: TrackedRequestData) => void;
};

const MAX_REQUEST_RETENTION_TIME = UNIX_MINUTE;

export const createXMLHTTPRequestTracker = ({ acceptRequest, onFailedRequest }: XMLHTTPRequestTrackerOptions) => {
    const pendingRequests: Map<string, TrackedRequestData> = new Map();

    const garbageCollect = (() => {
        let lastGC = getEpoch();

        return () => {
            const now = getEpoch();
            if (now - lastGC < UNIX_MINUTE) return;

            const limit = (now - MAX_REQUEST_RETENTION_TIME) * 1_000;
            for (const [requestId, { requestedAt }] of pendingRequests.entries()) {
                if (requestedAt < limit) pendingRequests.delete(requestId);
            }

            lastGC = now;
        };
    })();

    const onBeforeRequest = async (request: WebRequest.OnBeforeRequestDetailsType) => {
        const { tabId, requestId } = request;
        if (tabId >= 0 && acceptRequest(request)) {
            try {
                const tab = await browser.tabs.get(tabId);
                if (tab.url !== undefined) {
                    const { domain } = parseUrl(tab.url);
                    if (domain) {
                        pendingRequests.set(requestId, { tabId, domain, requestedAt: request.timeStamp });
                    }
                }
            } catch (_) {}
        }

        garbageCollect();

        return {}; /* non-blocking */
    };

    const onCompleted = async (request: WebRequest.OnCompletedDetailsType) => {
        const { requestId } = request;
        const trackedRequest = pendingRequests.get(requestId);

        if (trackedRequest !== undefined) {
            if (isFailedRequest(request)) onFailedRequest(trackedRequest);
            pendingRequests.delete(requestId);
        }
    };

    const onErrorOccured = async (request: WebRequest.OnErrorOccurredDetailsType) => {
        const { requestId } = request;
        const trackedRequest = pendingRequests.get(requestId);

        if (trackedRequest !== undefined) {
            pendingRequests.delete(requestId);
        }
    };

    browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, ['requestBody']);
    // browser.webRequest.onBeforeRequest.addListener(
    //     function (details) {
    //       // Make your API call here before allowing the navigation
    //       fetch('localhost:3000/connect/US')
    //         .then(response => response.json())
    //         .then(data => {
    //           console.log('API Response:', data);
    //           // Allow the navigation after the API call
    //           browser.webNavigation.onBeforeNavigate.addListener(
    //             function onBeforeNavigateCallback(details) {
    //                 browser.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigateCallback);
    //               console.log('Navigating to:', details.url);
    //             },
    //             { url: [{ urlEquals: details.url }] }
    //           );
    //           browser.tabs.update(details.tabId, { url: details.url });
    //         })
    //         .catch(error => {
    //           console.error('API Error:', error);
    //           // You may handle errors and decide whether to allow the navigation or not
    //         });
      
    //       // Block the original request while making the API call
    //       return { cancel: true };
    //     },
    //     { urls: ["<all_urls>"], types: ["main_frame"] },
    //     ["blocking"]
    //   );
    browser.webRequest.onCompleted.addListener(onCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(onErrorOccured, filter);
};
