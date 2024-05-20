const { openSearchPage } = require("./puppeteerHelpers/navigation");

async function startScraping() {
    console.log("Starting the scraping process...");
    let browser;
    try {
        const { browser: tempBrowser, page } = await openSearchPage(
            "https://www.pagesjaunes.fr/"
        );
        browser = tempBrowser;
        console.log("Page opened successfully.");

        // Ecouteur pour naviguer jusqu'à la page annuaire spécifique
        let isScrapingCompleted = false; // Flag pour contrôler l'exécution
        page.on("framenavigated", async (frame) => {
            if (!isScrapingCompleted && frame.url().includes("/annuaire")) {
                console.log("Navigated to annuaire page at: " + frame.url());
                // Mettre ici le code pour prendre en charge l'URL, comme le scraping ou autre
                isScrapingCompleted = true; // Mettre à jour le flag
                // Ne fermez pas le navigateur ici si vous avez d'autres actions à compléter
            }
        });

        // Attendre un certain signal ou timeout pour assurer que le scraping soit complété
        while (!isScrapingCompleted) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Attente active, ajustez selon le besoin
        }

        console.log("Operations completed, preparing to close the browser.");
    } catch (error) {
        console.error("Error during the scraping process:", error);
    } finally {
        if (browser) {
            console.log("Closing the browser.");
            await browser.close();
            console.log("Browser closed.");
        }
    }
}

startScraping().catch((error) =>
    console.error("Failed to start scraping process:", error)
);
