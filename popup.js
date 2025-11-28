document.getElementById("listBtn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
        document.getElementById("result").innerText = "Không tìm thấy tab hiện tại.";
        return;
    }

    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Tìm tất cả ảnh có class wcpa_img
                const imgs = Array.from(document.querySelectorAll("img.wcpa_img"));
                return imgs.map(img => img.src).filter(src => !!src);
            }
        });

        const urls = results?.[0]?.result ?? [];
        const container = document.getElementById("result");
        container.innerHTML = "";

        if (urls.length === 0) {
            container.innerText = "Không tìm thấy ảnh nào có class wcpa_img.";
        } else {
            const ul = document.createElement("ul");
            urls.forEach((url, index) => {
                const li = document.createElement("li");
                li.innerText = `${index + 1}. ${url}`;
                li.style.cursor = "pointer";
                li.style.textDecoration = "underline";
                li.addEventListener("click", () => {
                    chrome.tabs.create({ url: url, active: false });
                });
                ul.appendChild(li);
            });
            container.appendChild(ul);
        }
    } catch (e) {
        document.getElementById("result").innerText =
            "Lỗi khi liệt kê ảnh: " + (e.message || e);
    }
});
