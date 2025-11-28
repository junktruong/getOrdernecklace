const sku_title_style_map = {
    "ORM205003": {
        title: "Personalized Your Photo Ornament, Custom Christmas Ornaments, Personalized Christmas Ornaments for Christmas Tree",
        url: "https://necklacespring.com/product/personalized-your-photo-ornament-double-sided-print-custom-christmas-ornaments-personalized-christmas-ornaments-for-christmas-tree/"
    },
    "ORM205012": {
        title: "Personalized Your Photo Ornament, Custom Christmas Ornaments, Personalized Christmas Ornaments for Christmas Tree",
        url: "https://necklacespring.com/product/personalized-your-photo-ornament-double-sided-print-custom-christmas-ornaments-personalized-christmas-ornaments-for-christmas-tree/"
    },
    "AC023": {
        title: "Custom Photo Crystal Glass Ornament - Personalized Christmas Gifts from Your Favorite Picture",
        url: "https://necklacespring.com/product/custom-photo-crystal-glass-ornament-personalized-engraved-christmas-gifts-from-your-favorite-picture/"
    },
    "AC097": {
        title: "Granddaughter Necklace, Gift for Granddaughter “I Believe In You” Love Grandma Necklace",
        url: "https://necklacespring.com/product/granddaughter-necklace-gift-for-granddaughter-i-believe-in-you-love-grandma-necklace/"
    },
    "ORM020725": {
        title: "Crystal Ornament Photo, Glass Christmas Ornaments, Personalized Family Ornaments, from Photo, with Pictures, Mothers Day, Fathers Day Ornament with Custom Name, Photo, Date 2025",
        url: "https://necklacespring.com/product/crystal-ornament-photo-glass-christmas-ornaments-personalized-family-ornaments-from-photo-with-pictures-mothers-day-fathers-day-ornament-with-custom-name-photo-date-2025/"
    },
    "ORM205009": {
        title: "Custom Watercolor House Ornament, Personalized Home Christmas Ornament, Personalized Christmas Ornament Gift, Housewarming",
        url: "https://necklacespring.com/product/custom-watercolor-house-ornament-personalized-home-christmas-ornament-personalized-christmas-ornament-gift-housewarming/"
    },
    "ORM215003": {
        title: "Custom Photo Crystal Glass Ornament - Personalized Christmas Gifts from Your Favorite Picture",
        url: "https://necklacespring.com/product/custom-photo-crystal-glass-ornament-personalized-engraved-christmas-gifts-from-your-favorite-picture/"
    },
    "AC004-1": {
        title: "To My Beautiful Daughter Necklace, Daughter Gift from Dad, Father Daughter Gift",
        url: "https://necklacespring.com/product/to-my-beautiful-daughter-necklace-daughter-gift-from-dad-father-daughter-gift/"
    },
    "ORM161025": {
        title: "Custom Photo Ornament Glass",
        url: "https://necklacespring.com/product/personalized-family-christmas-ornament-2025/"
    },
    "NS0894": {
        title: "Wife Necklace, Promise Necklace For Her, Gift For Girlfriend From Boyfriend, Anniversary Gift Custom Necklace",
        url: "https://necklacespring.com/product/wife-necklace-promise-necklace-for-her-gift-for-girlfriend-from-boyfriend-anniversary-gift-custom-necklace/"
    }
};


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


                const country = "US";

                // --- LẤY TẤT CẢ ORDER ITEMS ---
                const items = [...document.querySelectorAll("tr.item")];

                const result = [];

                const Payment_Time = document.querySelector("p.woocommerce-order-data__meta.order_number")?.innerText.trim() || "";

                // Regex để lấy Payment Name
                const paymentRegex = /(?<=Payment via\s).*?(?=\s\()/;
                const paymentMatch = Payment_Time.match(paymentRegex);
                const payment = paymentMatch ? paymentMatch[0] : 'Không tìm thấy';

                // Hàm chuyển yyyy-mm-dd → mm/dd/yyyy
                function formatDate(dateStr) {
                    const [year, month, day] = dateStr.split("-");
                    return `${month}/${day}/${year}`;
                }

                // ---- Lấy giờ từ Payment_Time → chuẩn 24h ----
                const timeRegex = /(\d{1,2}):(\d{2})\s?(am|pm)/i;
                const timeMatch = Payment_Time.match(timeRegex);

                let time24 = "00:00";

                if (timeMatch) {
                    let hour = parseInt(timeMatch[1], 10);
                    let minute = timeMatch[2];
                    const period = timeMatch[3].toLowerCase();

                    if (period === "pm" && hour < 12) hour += 12;
                    if (period === "am" && hour === 12) hour = 0;

                    time24 = `${String(hour).padStart(2, '0')}:${minute}`;
                }

                // ---- Lấy ngày từ input order_date ----
                const rawDate = getAttr("input[name='order_date']", "value");
                const formattedDate = formatDate(rawDate);

                // ---- Ngày + giờ cuối cùng ----
                const date = `${formattedDate} ${time24}`;

                const orderTotalRow = [...document.querySelectorAll(".wc-order-totals tbody tr")]
                    .find(r => r.querySelector(".label")?.innerText.trim() === "Order Total:");

                const total = orderTotalRow
                    ? orderTotalRow.querySelector(".total .woocommerce-Price-amount").innerText.replace("$", "").trim()
                    : "";


                let id = 0;
                items.forEach(item => {
                    id++;
                    const container = item.closest("tr");

                    // Title product
                    // const productTitle = getText("a.wc-order-item-name", container);
                    // const productLink = getAttr("a.wc-order-item-name", "href", container);
                    const sku_title_style_map = {
                        "ORM205003": {
                            title: "Personalized Your Photo Ornament, Custom Christmas Ornaments, Personalized Christmas Ornaments for Christmas Tree",
                            url: "https://necklacespring.com/product/personalized-your-photo-ornament-double-sided-print-custom-christmas-ornaments-personalized-christmas-ornaments-for-christmas-tree/"
                        },
                        "ORM205012": {
                            title: "Personalized Your Photo Ornament, Custom Christmas Ornaments, Personalized Christmas Ornaments for Christmas Tree",
                            url: "https://necklacespring.com/product/personalized-your-photo-ornament-double-sided-print-custom-christmas-ornaments-personalized-christmas-ornaments-for-christmas-tree/"
                        },
                        "AC023": {
                            title: "Custom Photo Crystal Glass Ornament - Personalized Christmas Gifts from Your Favorite Picture",
                            url: "https://necklacespring.com/product/custom-photo-crystal-glass-ornament-personalized-engraved-christmas-gifts-from-your-favorite-picture/"
                        },
                        "AC097": {
                            title: "Granddaughter Necklace, Gift for Granddaughter “I Believe In You” Love Grandma Necklace",
                            url: "https://necklacespring.com/product/granddaughter-necklace-gift-for-granddaughter-i-believe-in-you-love-grandma-necklace/"
                        },
                        "ORM020725": {
                            title: "Crystal Ornament Photo, Glass Christmas Ornaments, Personalized Family Ornaments, from Photo, with Pictures, Mothers Day, Fathers Day Ornament with Custom Name, Photo, Date 2025",
                            url: "https://necklacespring.com/product/crystal-ornament-photo-glass-christmas-ornaments-personalized-family-ornaments-from-photo-with-pictures-mothers-day-fathers-day-ornament-with-custom-name-photo-date-2025/"
                        },
                        "ORM205009": {
                            title: "Custom Watercolor House Ornament, Personalized Home Christmas Ornament, Personalized Christmas Ornament Gift, Housewarming",
                            url: "https://necklacespring.com/product/custom-watercolor-house-ornament-personalized-home-christmas-ornament-personalized-christmas-ornament-gift-housewarming/"
                        },
                        "ORM215003": {
                            title: "Custom Photo Crystal Glass Ornament - Personalized Christmas Gifts from Your Favorite Picture",
                            url: "https://necklacespring.com/product/custom-photo-crystal-glass-ornament-personalized-engraved-christmas-gifts-from-your-favorite-picture/"
                        },
                        "AC004-1": {
                            title: "To My Beautiful Daughter Necklace, Daughter Gift from Dad, Father Daughter Gift",
                            url: "https://necklacespring.com/product/to-my-beautiful-daughter-necklace-daughter-gift-from-dad-father-daughter-gift/"
                        },
                        "ORM161025": {
                            title: "Custom Photo Ornament Glass",
                            url: "https://necklacespring.com/product/personalized-family-christmas-ornament-2025/"
                        },
                        "NS0894": {
                            title: "Wife Necklace, Promise Necklace For Her, Gift For Girlfriend From Boyfriend, Anniversary Gift Custom Necklace",
                            url: "https://necklacespring.com/product/wife-necklace-promise-necklace-for-her-gift-for-girlfriend-from-boyfriend-anniversary-gift-custom-necklace/"
                        }
                    };


                    // SKU
                    let skuRaw = getText(".wc-order-item-sku", container);
                    let sku = skuRaw.replace(/SKU:/i, "").trim().split(" ")[0].trim();
                    let skuInfo = "null";
                    try {

                        skuInfo = sku_title_style_map[sku] || null;
                    } catch (e) {
                        skuInfo = e.message;
                    }


                    const productTitle = skuInfo ? skuInfo.title : "#";

                    const productLink = skuInfo ? skuInfo.url : "#";



                    const qtyText = getText("td.quantity .view", container);
                    let quantity = qtyText.replace("×", "").trim();

                    // Lấy tất cả meta fields (Size, Personalization, Photo Upload…)
                    const metaRows = [...container.querySelectorAll("tr.item_wcpa")];

                    //-----------------------------------------------------------
                    // 🎓 PARSER CHO SKU ORM205012 – Graduation Ornament
                    //-----------------------------------------------------------

                    let size = "";
                    let personalization = "";
                    let imgLink = "";

                    // Trường đặc biệt (SKU ORM205012)
                    let capGown = "";
                    let stole = "";
                    let gradName = "";
                    let schoolName = "";
                    let gradYear = "";

                    // Quét tất cả bảng meta <tr class="item_wcpa">
                    metaRows.forEach(row => {
                        const label = getText("td.name", row).toLowerCase();
                        const rawValue = getText("td.value .view", row).trim();

                        // -------------------------------------------------------
                        // 📏 SIZE (áp dụng cho MỌI SKU)
                        // -------------------------------------------------------
                        if (label.includes("select size")) {
                            let raw = rawValue;
                            let lines = raw.split("\n");
                            let valueLine = lines.find(l => l.toLowerCase().includes("value")) || raw;
                            valueLine = valueLine.replace(/label:/i, "")
                                .replace(/value:/i, "")
                                .trim();
                            size = valueLine.split("(")[0].trim(); // 5.5", 3in, ...
                        }

                        // -------------------------------------------------------
                        // 🖼 ẢNH (áp dụng cho mọi SKU)
                        // -------------------------------------------------------
                        const img = row.querySelector("img.wcpa_img");
                        if (img && img.src) {
                            imgLink = img.src;
                        }

                        // -------------------------------------------------------
                        // 🎓 PARSER DÀNH CHO SKU ORM205012
                        // -------------------------------------------------------
                        if (sku === "ORM205012") {

                            //----------------------------------
                            // 1️⃣ Select Color Cap and Gown
                            //----------------------------------
                            if (label.includes("gown")) {
                                // Dòng label chính là màu
                                capGown = rawValue.split("\n")[0]
                                    .replace("Label:", "")
                                    .trim();
                            }

                            //----------------------------------
                            // 2️⃣ Select Color Graduation Stole
                            //----------------------------------
                            if (label.includes("stole")) {
                                stole = rawValue.split("\n")[0]
                                    .replace("Label:", "")
                                    .trim();
                            }

                            //----------------------------------
                            // 3️⃣ Enter Your Name
                            //----------------------------------
                            if (label.includes("your name")) {
                                gradName = rawValue;
                            }

                            //----------------------------------
                            // 4️⃣ Enter School Name
                            //----------------------------------
                            if (label.includes("name school")) {
                                schoolName = rawValue;
                            }

                            //----------------------------------
                            // 5️⃣ Enter Class Year
                            //----------------------------------
                            if (label.includes("class year")) {
                                gradYear = rawValue;
                            }
                        }

                        // -------------------------------------------------------
                        // ✨ PERSONALIZATION (áp dụng cho SKU khác)
                        // -------------------------------------------------------
                        if (label.includes("personalization") && sku !== "ORM205012") {
                            personalization = rawValue || "#";
                        }
                        if (sku == "ORM205012") {
                            personalization = [
                                gradName,
                                schoolName,
                                gradYear,
                                capGown,
                                stole,

                            ]
                                .filter(Boolean) // xoá giá trị rỗng
                                .join(" / ");     // nối bằng dấu /
                        }

                    });



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
                        total,
                        payment,
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
            "SKU", "Link ảnh", "Link PNG", "Note", "Link order", "Personalized", "Order Necklace",
            "SKU", "Total", "Fulfil", "Titles", "Style", "Color", "Size", "Quantity", "Date",
            "Order", "Tracking", "Check Track", "Thanh toán", "Full Name", "Phone Number",
            "Email", "Address 1", "City", "State", "Zip code", "Country"
        ];

        // create a copy table button
        let copyTableButton = `
<button id="btnCopyTable" style="
    padding: 8px 12px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background-color: #007bff;
    margin: 0 0 15px 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    transition: background-color 0.3s, transform 0.1s;
">
    📋 Copy Table
</button>
`;


        // tạo nút download all images
        let downloadImagesButton = `
    <button id="btnDownloadImages" style="
        padding: 8px 12px;
        font-size: 14px;
        font-weight: bold;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background-color: #28a745;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        transition: background-color 0.3s, transform 0.1s;
    ">
        📥 Tải toàn bộ ảnh (Download All Images)
    </button>
`;

        // Tạo bảng HTML
        let tableHtml = `
${downloadImagesButton}
${copyTableButton}
<div style="
    overflow-x: auto; 
    border: 1px solid #ccc; 
    padding: 10px; 
    min-width: 100%;
    max-width: 100%;
    white-space: nowrap;
">
    <table  id="dataOutputTable" style="border-collapse: collapse; width: max-content;">
        <thead>
            <tr>
`;

        // ---- xây header -----
        headers.forEach(h => {
            tableHtml += `
        <th style="
            border: 1px solid #ddd; 
            padding: 6px 10px; 
            background:#f7f7f7;
            font-weight:bold;
            text-align:left;
        ">${h}</th>`;
        });

        tableHtml += `
            </tr>
        </thead>
        <tbody>
`;

        // ---- xây từng dòng -----
        data.forEach(item => {
            let row = [];
            if (item.id > 1) {
                row = [
                    item.sku + " - " + item.size,
                    "#",
                    "#",
                    "#",
                    item.imgLink,
                    item.personalization || "#",
                    "#" + item.orderNumber,
                    item.sku,
                    item.total,
                    "#",
                    item.productTitle,
                    item.productLink,
                    "#",
                    "#",
                    item.quantity,
                    item.date,
                    "#" + item.orderNumber,
                    "#",
                    "#",
                    item.payment,
                    item.fullName,
                    item.phone,
                    item.email,
                    item.address1,
                    item.city,
                    item.state,
                    item.zip,
                    item.country
                ];
            } else {
                row = [
                    item.sku + " - " + item.size,
                    "#",
                    "#",
                    "#",
                    item.imgLink,
                    item.personalization || "#",
                    "#" + item.orderNumber,
                    item.sku,
                    item.total,
                    "#",
                    item.productTitle,
                    item.productLink,
                    "#",
                    "#",
                    item.quantity,
                    item.date,
                    "#" + item.orderNumber,
                    "#",
                    "#",
                    item.payment,
                    item.fullName,
                    item.phone,
                    item.email,
                    item.address1,
                    item.city,
                    item.state,
                    item.zip,
                    item.country
                ];
            }
            tableHtml += "<tr>";

            row.forEach(col => {
                tableHtml += `
            <td style="
                border: 1px solid #ddd; 
                padding: 6px 10px;
            ">${col}</td>`;
            });

            tableHtml += "</tr>";
        });

        tableHtml += `
        </tbody>
    </table>
</div>
`;

        // ---- đưa vào resultBox ----
        resultBox.innerHTML = tableHtml;

        // ---- Gắn sự kiện click cho nút Download All Images ----
        document.getElementById("btnDownloadImages").addEventListener("click", () => {
            data.forEach((item, index) => {
                if (item.imgLink) {
                    chrome.downloads.download({
                        url: item.imgLink,
                        filename: `image_${item.orderNumber}_${index + 1}.jpg`
                    });
                }
                document.getElementById("notice").innerText =
                    "✅ Đang tải ảnh... Vui lòng kiểm tra thư mục Tải xuống (Downloads) của bạn.";
            });
            document.getElementById("notice").innerText =
                " ✅ Đã tải xuống tất cả ảnh. Vui lòng kiểm tra thư mục Tải xuống (Downloads) của bạn.";
        });

        // ---- COPY TABLE BUTTON ----
        document.getElementById("btnCopyTable").addEventListener("click", () => {
            const table = document.getElementById("dataOutputTable");
            if (!table) return;

            let output = "";
            const rows = table.querySelectorAll("tr");

            // Start from index 1 → skip row 1
            for (let i = 1; i < rows.length; i++) {
                const cols = [...rows[i].querySelectorAll("th, td")].map(td =>
                    td.innerText.replace(/\n/g, " ").trim()
                );
                output += cols.join("\t") + "\n";  // Tab-separated for Google Sheets
            }

            navigator.clipboard.writeText(output).then(() => {
                document.getElementById("notice").innerText =
                    "✅ Đã sao chép bảng vào clipboard. Vui lòng dán vào Google Sheets hoặc Excel.";
            }).catch(err => {
                document.getElementById("notice").innerText =
                    "❌ Lỗi : " + (err?.message || JSON.stringify(err));
            });
        });




    } catch (err) {
        document.getElementById("result").innerText =
            "❌ LỖI: " + (err?.message || JSON.stringify(err));
    }
});
