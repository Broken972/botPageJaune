const puppeteer = require("puppeteer");
const { littleSleep, bigSleep } = require("../utils/sleep");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

async function acceptCookiesFromPopup(
    page,
    popupSelector,
    acceptButtonSelector
) {
    try {
        await page.waitForSelector(popupSelector);
        await page.click(acceptButtonSelector);
        console.log("Cookies accepted.");
        return true;
    } catch (error) {
        console.error("Error handling the cookie popup:", error);
        return false;
    }
}

async function takeSearchLink(url) {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--window-size=1200,800", // Set the browser window size
            "--window-position=0,0", // Move the browser window to the top-left corner
        ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
    );
    await page.goto(url);

    const context = browser.defaultBrowserContext();
    context.overridePermissions(url, ["notifications"]);

    // Cookie acceptance handled here
    await acceptCookiesFromPopup(
        page,
        "#didomi-notice-agree-button",
        "#didomi-notice-agree-button"
    );

    const location = await page.evaluate(
        () => document.querySelector("#ou").value
    );
    const activiteSeach = await page.evaluate(
        () => document.querySelector("#quoiqui").value
    );
    const nbPage = await page.evaluate(() => {
        const text = document.querySelector(".pagination-compteur").innerText;
        return parseInt(text.split("/")[1].trim(), 10);
    });

    let tabLinks = [];
    for (let i = 1; i <= nbPage; i++) {
        console.log(`Processing page ${i} of ${nbPage}`);
        await littleSleep();
        const links = await page.evaluate(() => {
            return Array.from(
                document.querySelectorAll("a.bi-denomination")
            ).map((anchor) => anchor.href);
        });
        tabLinks = [...new Set([...tabLinks, ...links])]; // Remove duplicates on the fly
        await bigSleep();
        if (i < nbPage) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: "domcontentloaded" }),
                page.click("#pagination-next"),
            ]);
        }
    }

    tabLinks = tabLinks.filter((link) =>
        link.includes("https://www.pagesjaunes.fr/pros/")
    );
    console.log("Filtered tabLinks:", tabLinks);
    await scrapInfos(tabLinks, browser, location, activiteSeach); // Pass browser instance to reuse
}

async function scrapInfos(links, browser, location, activiteSeach) {
    const records = [];
    try {
        for (let i = 0; i < links.length; i++) {
            const page = await browser.newPage();
            console.log(`Scraping link ${i + 1}/${links.length}: ${links[i]}`);
            await page.goto(links[i], { waitUntil: "domcontentloaded" });
            await littleSleep();

            try {
                const infos = await page.evaluate(() => {
                    const getName = () => {
                        const element = document.querySelector("h1");
                        return element
                            ? element.innerText.trim()
                            : "No name available";
                    };

                    const getActivite = () => {
                        const element = document.querySelector(".activite");
                        return element
                            ? element.innerText.trim()
                            : "No activity available";
                    };

                    const getSite = () => {
                        const element = document.querySelector(
                            "#teaser-footer > div > div > div.lvs-container.marg-btm-s > a > span.value"
                        );
                        return element
                            ? element.innerText.trim()
                            : "No site available";
                    };

                    return {
                        name: getName(),
                        activite: getActivite(),
                        site: getSite(),
                    };
                });

                records.push({
                    location,
                    name: infos.name,
                    activite: infos.activite,
                    site: infos.site,
                });
                console.log("Scraped info:", infos);
            } catch (selectorError) {
                console.error(
                    `Error during scraping link ${i + 1}:`,
                    selectorError
                );
            }

            await page.close();
            await bigSleep();
        }
    } catch (error) {
        console.error("Error during scraping process:", error);
    } finally {
        await browser.close();
    }

    // Write records to CSV
    const csvWriter = createCsvWriter({
        path: `${location}_${activiteSeach}_results.csv`,
        header: [
            { id: "location", title: "Location" },
            { id: "name", title: "Name" },
            { id: "activite", title: "Activity" },
            { id: "site", title: "Website" },
        ],
    });

    await csvWriter.writeRecords(records);
    console.log("CSV file written successfully");
}

module.exports = {
    takeSearchLink,
    scrapInfos,
};
