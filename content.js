
const hotKeyCtrl = chrome.runtime.getURL('images/hotKeyCtrl.svg');
const hotKeyCmd = chrome.runtime.getURL('images/hotKeyCmd.svg');
const hotKeyShift = chrome.runtime.getURL('images/hotKeyShift.svg');


function testIfMacOS() {
    return navigator.userAgent.includes('Macintosh');
}

const isMacOS = testIfMacOS();

const supportedHosters = [
    "1fichier",
    "4shared",
    "clicknupload",
    "dailymotion",
    "dailyuploads",
    "ddownload",
    "ddl",
    "drop",
    "dropapk",
    "dropbox",
    "fikper",
    "file",
    "filefactory",
    "filenext",
    "filespace",
    "filestore",
    "flashbit",
    "gigapeta",
    "google",
    "drive",
    "hexupload",
    "hexload",
    "hitfile",
    "icloud",
    "isra",
    "katfile",
    "mediafire",
    "mega",
    "prefiles",
    "radiotunes",
    "rapidgator",
    "rg",
    "redtube",
    "scribd",
    "send",
    "sendspace",
    "terabytez",
    "turbobit",
    "uploady",
    "usersdrive",
    "vimeo",
    "voe",
    "wipfiles",
    "worldbytez",
    "wupfile",
    "salefiles",
    "youporn"
];

let toastDownloadingPhaseInterval

let toastTimeOut; // Declare the timeout variable outside the function
function createToast(inputParameters) {

    const message = inputParameters.message;
    const duration = inputParameters.duration || 3000;
    const backgroundColor = inputParameters.backgroundColor || 'rgba(255, 255, 255, 0.75)';

    const toastId = 'realdebrid-extension-toast';
    const existingToast = document.getElementById(toastId);

    // Helper function to remove toast with fade out
    const removeToast = () => {
        clearInterval(toastDownloadingPhaseInterval);
        clearTimeout(toastTimeOut);

        const toast = document.getElementById(toastId);
        if (toast) {
            const messageElement = toast.shadowRoot.querySelector('#realdebrid-extension-message');
            messageElement.classList.add('fade-out');
            
            // Wait for animation to complete before removing element
            messageElement.addEventListener('animationend', () => {
                document.body.removeChild(toast);
            }, { once: true });
        }
        toastTimeOut = null;
    };


    // Update existing toast
    if (existingToast) {
        const shadowRoot = existingToast.shadowRoot;
        const messageElement = shadowRoot.querySelector('#realdebrid-extension-message');
        messageElement.innerHTML = message;

        messageElement.style.backgroundColor = backgroundColor;
        // Reset timeout for the updated toast
        clearTimeout(toastTimeOut);
        toastTimeOut = setTimeout(removeToast, duration);
        return;
    }

    // Create the container for the Shadow DOM
    const container = document.createElement('div');
    container.id = toastId;

    // Attach Shadow DOM to the container
    const shadow = container.attachShadow({ mode: 'open' });

    // Add CSS styles within the Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
        }

        /* reset css */
        p, div {
            margin: 0;
            padding: 0;
        }

        #realdebrid-extension-message {
            position: fixed;
            z-index: 999999;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.75);
            border-radius: 16px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(9.6px);
            -webkit-backdrop-filter: blur(9.6px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 20px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            border-radius: 5px;
            font-size: 16px;
            font-family: Arial, sans-serif;
            color: #333;
            animation: fadeIn 0.3s ease-out forwards;

            /* Disable text selection */
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            
            /* Disable image dragging */
            -webkit-user-drag: none;
            -khtml-user-drag: none;
            -moz-user-drag: none;
            -o-user-drag: none;
            user-drag: none;
            
            /* Disable right-click menu */
            -webkit-touch-callout: none;
            
            /* Prevent highlighting on mobile tap */
            -webkit-tap-highlight-color: transparent;

            mouse-events: none;
        }

        .icon {
            transform: translateY(5px);
        }

        #realdebrid-extension-message.fade-out {
            animation: fadeOut 0.3s ease-in forwards;
        }
    `;

    // Create the message box element
    const messageBox = document.createElement('div');
    messageBox.id = 'realdebrid-extension-message';
    messageBox.innerHTML = message;
    messageBox.setAttribute('role', 'alert'); // Add ARIA role for accessibility

    // Append styles and message box to the Shadow DOM
    shadow.appendChild(style);
    shadow.appendChild(messageBox);

    // Append the container to the document body
    document.body.appendChild(container);

    // Set the timeout to remove the toast after the duration
    toastTimeOut = setTimeout(removeToast, duration);

    container.addEventListener('mouseover', removeToast);
}



function isThisUrlFromAnSupportedHoster(url) {
    return supportedHosters.some(hoster => url.includes("https://" + hoster));
}

function isThisUrlATorrentMagnet(url) {
    return url.includes("magnet:?");
}

let canClickOnMagnetLink = true;
let canClickOnHosterLink = true;

let defaultActionTimeout;

let defaultAction = false;

document.addEventListener('click', function(event) {

    // Check if the clicked element is a link or has a link parent
    const link = event.target.closest('a');
    
    if (link) {

        clearTimeout(defaultActionTimeout)

        async function action() {

            if (defaultAction === true || ((event.ctrlKey || event.metaKey) && event.shiftKey)) {
                defaultAction = false;
                return;
            }

            // Prevent the default link behavior
            event.preventDefault();
            
            // Get the href attribute
            const url = link.href;
            
            try {

                if (isThisUrlATorrentMagnet(url)) {

                    if (canClickOnMagnetLink === false) {
                        return;
                    }

                    canClickOnMagnetLink = false;
                
                    try {

                        createToast({
                            message: `
                                <div style="text-align: center;">
                                    <p>Processing torrent link...</p>
                                </div>
                            `,
                            duration: 10000
                        });

                        console.log('Torrent link clicked:', url);
                
                        const isActive = await isTorrentActive(url);

                        console.log(isActive)
                
                        // If control key is pressed
                        if (event.ctrlKey || event.metaKey) {
                            if (isActive.isActive === true) {
                                clearInterval(toastDownloadingPhaseInterval);
                                createToast({
                                    message:`
                                        <div style="text-align: center;">
                                            <p>Torrent removed</p>
                                        </div>
                                    `,
                                    duration: 1000,
                                    backgroundColor: 'rgba(87, 255, 131, 0.75)'
                                });
                                await removeTorrent(isActive.torrentInfo.id);
                            } else {
                                createToast({
                                    message:`
                                        <div style="text-align: center;">
                                            <p>This torrent file is not in your list or has already been removed</p>
                                        </div>
                                    `,
                                    backgroundColor: 'rgba(255, 87, 87, 0.75)'
                                });
                                console.log('This torrent file is not in your list and cannot be removed');
                            }
                            return;
                        }
                
                        if (isActive.isActive === true) {
                            console.log('Torrent is active');
                            result = isActive.torrentInfo;
                        } else {
                            
                            console.log('Torrent is not active');
                            result = await processTorrent(url);
                        }
                
                        console.log('Torrent processed:', result);
                
                        if (result.status === 'downloaded') {
                            const realdebridUrl = result.links[0];

                            const secondResult = await getUnrestrictedLink(realdebridUrl);
                            createToast({
                                message:`
                                    <div style="text-align: center;">
                                        <p>Downloading file</p>
                                        <p style="font-size: 14px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${secondResult.filename}</p>
                                    </div>
                                `, 
                                duration: 5000, 
                                backgroundColor: 'rgba(87, 255, 131, 0.75)'
                            });

                            await removeTorrent(result.id);
                        } else {
                            if (event.shiftKey || isActive.isActive === true) {

                                function displayProgress(progress) {
                                    createToast({
                                        message: `
                                            <div style="width: 30vw; text-align: center; display:flex; flex-direction: column; gap: 5px;">
                                                <p>Downloading torrent</p>
                                                <p style="font-size: 14px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${result.filename}</p>
                                                <div style="display: flex; flex-direction: column; justify-content: center;">
                                                    <p style="position: relative; text-align: center; color: white;">${progress}%</p>
                                                    <div class="loading-bar" style="position: absolute; z-index: -1; background-color: green; width: calc(${result.progress / 100} * 30vw); height: 20px;"></div>
                                                    <div style="position: absolute; z-index: -2; background-color: grey; width: 30vw; height: 20px"></div>
                                                </div>
                                                <p style="font-weight: bold; font-size: 14px;">${isMacOS ? `<img class="icon" src="${hotKeyCmd}">` : `<img class="icon" src="${hotKeyCtrl}">`} on the link to cancel the download</p>
                                            </div>
                                        `,
                                        duration: 10000000,
                                    });
                                }

                                displayProgress(result.progress);

                                toastDownloadingPhaseInterval = setInterval(async () => {

                                    const isActive = await isTorrentActive(url);
                                    result = isActive.torrentInfo;

                                    console.log(result)

                                    if (result.status === 'downloaded') {
                                        clearInterval(toastDownloadingPhaseInterval);

                                        const realdebridUrl = result.links[0];
            
                                        const secondResult = await getUnrestrictedLink(realdebridUrl);
                                        createToast({
                                            message:`
                                                <div style="text-align: center;">
                                                    <p>Downloading file</p>
                                                    <p style="font-size: 14px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${secondResult.filename}</p>
                                                </div>
                                            `, 
                                            duration: 5000, 
                                            backgroundColor: 'rgba(87, 255, 131, 0.75)'
                                        });
            
                                        await removeTorrent(result.id);

                                    } else {

                                    displayProgress(result.progress);

                                    }

                                }, 3000);
                                
                            } else {
                                createToast({
                                    message: `
                                        <div style="text-align: center;">
                                            <p>This file is not cached on RealDebrid</p>
                                            <p style="font-weight: bold; font-size: 14px"><img class="icon" src="${hotKeyShift}"> on the link if you still want to download it</p>
                                        </div>
                                    `,
                                    duration: 3000
                                });
                                await removeTorrent(result.id);
                            }
                        }
                    } finally {
                        // Ensure this is always reset to true
                        canClickOnMagnetLink = true;
                    }                

                } else if (isThisUrlFromAnSupportedHoster(url)) {

                    if (canClickOnMagnetLink === false) {
                        return;
                    }

                    canClickOnMagnetLink = false;
                

                    try {

                        createToast({
                            message: `
                                <div style="text-align: center;">
                                    <p>Processing hoster link...</p>
                                </div>
                            `,
                            duration: 10000
                        });
                        console.log('Hoster link clicked:', url);
                        const result = await getUnrestrictedLink(url);
                        console.log('Unrestricted hoster link:', result.download);

                        createToast({
                            message:`
                                <div style="text-align: center;">
                                    <p>Downloading file</p>
                                    <p style="font-size: 14px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${result.filename}</p>
                                </div>
                            `, 
                            duration: 5000, 
                            backgroundColor: 'rgba(87, 255, 131, 0.75)'
                        });
                    } catch (error) {
                        throw error;
                    } finally { 
                        canClickOnMagnetLink = true;
                    }

                } else {
                    throw new Error('This url does not target a supported service');
                }

                
            } catch (error) {

                defaultAction = true

                defaultActionTimeout = setTimeout(() => {
                    defaultAction = false
                }, 400)

                if (error.message === 'This url does not target a supported service') {
                    defaultAction = true;
                    event.target.click();

                } else {

                    canClickOnHosterLink = false;
                    canClickOnMagnetLink = false;

                    console.log(error);

                    let errorMessage = error.message

                    if (errorMessage.includes('bad_token')) {
                        errorMessage = 'Your RealDebrid API key is invalid';
                        // open popup to enter new api key
                        chrome.runtime.sendMessage({ action: 'openPopup' });
                    }

                    else if (errorMessage.includes('Error during link debriding')) {
                        errorMessage = 'No available file found at this hoster adress';
                    }

                    else if (errorMessage.includes('Error selecting files')) {
                        errorMessage = 'No files found in this torrent';
                    } else {
                        errorMessage = errorMessage.replace(/_/g, ' ');
                    }

                    createToast({
                        message:`
                            <div style="text-align: center;">
                                <p>${errorMessage}</p>
                            </div>
                        `, 
                        duration: 1500, 
                        backgroundColor: 'rgba(255, 87, 87, 0.75)'
                    });

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    canClickOnMagnetLink = true;
                    canClickOnHosterLink = true;

                }
                
            }

        }

        action();

    }
}, true);

async function getUnrestrictedLink(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'unrestrictLink',
            url: url
        }, response => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}


async function processTorrent(magnetLink) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'unrestrictTorrent',
            magnetLink: magnetLink
        }, response => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}

async function isTorrentCached(magnetLink) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'isTorrentCached',
            magnetLink: magnetLink
        }, response => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}

async function isTorrentActive(magnetLink) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'isTorrentActive',
            magnetLink: magnetLink
        }, response => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}

async function removeTorrent(torrentId) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            action: 'removeTorrent',
            torrentId: torrentId
        }, response => {
            if (response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    });
}


// receive log messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'log') {
        console.log(request.log)
    }
});