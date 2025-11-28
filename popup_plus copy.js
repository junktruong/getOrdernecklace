document.getElementById("listBtn").addEventListener("click", async () => {
    const resultBox = document.getElementById("result");
    resultBox.innerText = "Đang xử lý...";


    try {

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
            resultBox.innerText = "❌ Không tìm thấy tab hiện tại.";
            return;
        }

        const execution = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const getText = (sel, root = document) =>
                    root.querySelector(sel)?.innerText?.trim() || "";
                const getAttr = (sel, attr, root = document) =>
                    root.querySelector(sel)?.getAttribute(attr) || "";

                // --- ORDER NUMBER ---
                const orderHeading = getText("h2.woocommerce-order-data__heading");
                const orderNumber = orderHeading.replace("Order #", "").replace(" details", "").trim();

                // --- BILLING INFO ---
                const billingText = document.querySelector(".order_data_column .address")?.innerText || "";
                const bLines = billingText.split("\n");

                const fullName = bLines[0] || "";
                const address1 = bLines[1] || "";
                const cityStateZip = bLines[2] || "";

                let city = "", state = "", zip = "";
                if (cityStateZip.includes(",")) {
                    const p = cityStateZip.split(",");
                    city = p[0].trim();
                    const arr = p[1].trim().split(" ");
                    state = arr[0];
                    zip = arr[1];
                }

                const email = (billingText.match(/Email.*?:\s*(.*)/)?.[1] || "").trim();
                const phone = (billingText.match(/Phone.*?:\s*(.*)/)?.[1] || "").trim();

                const date = getAttr("input[name='order_date']", "value");
                const country = "US";

                // --- LẤY TẤT CẢ ORDER ITEMS ---
                const items = [...document.querySelectorAll("tr.item")];

                const result = [];

                let id = 0;
                items.forEach(item => {
                    id++;
                    const container = item.closest("tr");

                    // Title product
                    const productTitle = getText("a.wc-order-item-name", container);
                    const productLink = getAttr("a.wc-order-item-name", "href", container);

                    // SKU
                    const sku = getText(".wc-order-item-sku", container).replace("SKU:", "").trim();

                    const qtyText = getText("td.quantity .view", container);
                    const quantity = qtyText.replace("×", "").trim();

                    // Lấy tất cả meta fields (Size, Personalization, Photo Upload…)
                    const metaRows = [...container.querySelectorAll("tr.item_wcpa")];

                    let size = "";
                    let personalization = "";
                    let imgLink = "";

                    // SPECIAL FIELDS for ORM205012
                    let capGown = "";
                    let stole = "";
                    let gradName = "";
                    let schoolName = "";
                    let gradYear = "";

                    metaRows.forEach(row => {
                        const label = getText("td.name", row).toLowerCase();
                        const value = getText("td.value .view", row);

                        if (label.includes("size")) {
                            let raw = value;

                            const valueLine = raw.split("\n")[0];

                            size = valueLine;
                        };

                        if (label.includes("personalization") || label.includes("add your")) personalization = value;

                        // Lấy ảnh
                        const img = row.querySelector("img.wcpa_img");
                        if (img && img.src) imgLink = img.src;

                        // ----------------------------
                        // 🎓 SKU ĐẶC BIỆT ORM205012
                        // ----------------------------
                        if (item.sku === "ORM205012") {

                            if (label.includes("select color cap and gown")) {
                                capGown = value.split("\n")[0].replace("Label:", "").trim();
                            }

                            if (label.includes("select color graduation stole")) {
                                stole = value.split("\n")[0].replace("Label:", "").trim();
                            }

                            if (label.includes("enter your name")) {
                                gradName = value.trim();
                            }

                            if (label.includes("enter name school")) {
                                schoolName = value.trim();
                            }

                            if (label.includes("enter class year")) {
                                gradYear = value.trim();
                            }
                        }

                        // ----------------------------
                        // ⚙️ NORMAL PERSONALIZATION (SKU khác)
                        // ----------------------------
                        // if (label.includes("personalization") && item.sku !== "ORM205012") {
                        //     personalization = value.trim();
                        // }
                    });
                    if (item.sku === "ORM205012") {
                        personalization = [
                            capGown,
                            stole,
                            gradName,
                            schoolName,
                            gradYear
                        ]
                            .filter(Boolean) // remove empty
                            .join(" / ");     // ghep theo yêu cầu
                    }

                    result.push({
                        id,
                        sku,
                        imgLink,
                        personalization,
                        size,
                        productTitle,
                        productLink,
                        quantity,
                        date,
                        fullName,
                        phone,
                        email,
                        address1,
                        city,
                        state,
                        zip,
                        country,
                        orderNumber
                    });
                });

                return result;
            }
        });

        const data = execution[0].result;


        if (!data) {
            resultBox.innerText = "❌ Không lấy được dữ liệu từ trang.";
            return;
        }

        // --- CSV headers ---
        const headers = [
            "ID", "SKU", "Link ảnh", "Link PNG", "Link order", "Personalized", "Order Necklace",
            "SKU", "Total", "Fulfil", "Titles", "Style", "Color", "Size", "Quantity", "Date",
            "Order", "Tracking", "Check Track", "Thanh toán", "Full Name", "Phone Number",
            "Email", "Address 1", "City", "State", "Zip code", "Country"
        ];


        let csv = headers.join(",") + "\n";
        data.forEach(item => {
            const row = [
                item.id,
                item.sku,
                "",
                "",
                item.imgLink,
                item.personalization,
                item.orderNumber,
                item.sku,
                "",
                "",
                item.productTitle,
                "",
                "",
                item.size,
                item.quantity,
                item.date,
                item.orderNumber,
                "",
                "",
                "PayPal",
                item.fullName,
                item.phone,
                item.email,
                item.address1,
                item.city,
                item.state,
                item.zip,
                item.country
            ];

            csv += row.map(v => `"${v}"`).join(",") + "\n";
        });



        // Hiển thị danh sách ảnh + nút Download All
        resultBox.innerHTML = "<h3>Danh sách ảnh:</h3>";

        // Biến CSS cho nút Download
        const buttonStyles = `
    padding: 8px 12px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.1s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
`;

        // ---- Nút Download All ----
        if (data.length > 0) {
            const btnAll = document.createElement("button");
            btnAll.innerText = "Tải về Tất cả (Download All)";
            btnAll.style.cssText = `
        ${buttonStyles}
        background-color: #28a745;
        margin: 15px 0;
    `;

            // Hover
            btnAll.onmouseover = () => btnAll.style.backgroundColor = '#1e7e34';
            btnAll.onmouseout = () => btnAll.style.backgroundColor = '#28a745';
            btnAll.onmousedown = () => btnAll.style.transform = 'scale(0.98)';
            btnAll.onmouseup = () => btnAll.style.transform = 'scale(1)';

            btnAll.addEventListener("click", () => {
                data.forEach((item, index) => {
                    chrome.downloads.download({
                        url: item.imgLink,
                        filename: `${item.orderNumber}_${index + 1}.jpg`
                    });
                });
            });

            resultBox.appendChild(btnAll);
        }

        // ---- Danh sách từng ảnh ----
        const ul = document.createElement("ul");

        data.forEach((item, index) => {
            const li = document.createElement("li");

            const linkContainer = document.createElement("div");
            linkContainer.style.display = "flex";
            linkContainer.style.alignItems = "center";
            linkContainer.style.justifyContent = "space-between";

            const link = document.createElement("a");
            link.href = item.imgLink;
            link.innerText = `${index + 1}. ${item.imgLink}`;
            link.target = "_blank";
            link.style.marginRight = "10px";
            link.style.flex = "1";
            link.style.color = "#007bff";
            link.style.textDecoration = "none";

            link.onmouseover = () => link.style.textDecoration = 'underline';
            link.onmouseout = () => link.style.textDecoration = 'none';

            // Nút download từng ảnh
            const btn = document.createElement("button");
            btn.innerText = "Tải về";
            btn.style.cssText = `
        ${buttonStyles}
        padding: 6px 10px;
        font-size: 12px;
        background-color: #007bff;
        white-space: nowrap;
    `;

            btn.onmouseover = () => btn.style.backgroundColor = '#0056b3';
            btn.onmouseout = () => btn.style.backgroundColor = '#007bff';
            btn.onmousedown = () => btn.style.transform = 'scale(0.98)';
            btn.onmouseup = () => btn.style.transform = 'scale(1)';

            btn.addEventListener("click", () => {
                chrome.downloads.download({
                    url: item.imgLink,
                    filename: `${item.orderNumber}_${index + 1}.jpg`
                });
            });

            linkContainer.appendChild(link);
            linkContainer.appendChild(btn);
            li.appendChild(linkContainer);
            ul.appendChild(li);
        });

        resultBox.appendChild(ul);





        // Tải file CSV
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        let orderNumber = data[0]?.orderNumber || "unknown";
        chrome.downloads.download({
            url: url,
            filename: `order_${orderNumber}.csv`
        });

    } catch (err) {
        document.getElementById("result").innerText =
            "❌ LỖI: " + (err?.message || JSON.stringify(err));
    }
});
