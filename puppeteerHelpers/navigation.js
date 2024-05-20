const puppeteer = require("puppeteer");
const { takeSearchLink } = require("./scraping");

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

async function openSearchPage(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);
    const context = browser.defaultBrowserContext();
    context.overridePermissions(url, ["notifications"]);

    // Cookie acceptance handled here
    await acceptCookiesFromPopup(
        page,
        "#didomi-notice-agree-button",
        "#didomi-notice-agree-button"
    );

    // Event handler setup
    page.on("framenavigated", async (frame) => {
        console.log("Navigated to " + frame.url());
        if (frame.url().includes("/annuaire")) {
            console.log("Annuaire page reached at:", frame.url());
            await takeSearchLink(frame.url());
            browser.close();
        }
    });

    return { browser, page };
}

module.exports = {
    acceptCookiesFromPopup,
    openSearchPage,
};
