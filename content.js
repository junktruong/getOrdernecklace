chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "getImageSrcs") {
        const imgs = Array.from(document.querySelectorAll("img"));
        const srcs = imgs.map(img => img.src).filter(src => !!src);
        sendResponse({ srcs });
    }
    return true;
});
