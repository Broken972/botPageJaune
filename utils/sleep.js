function littleSleep() {
    return new Promise((resolve) => {
        const rand = Math.floor(Math.random() * 3000) + 2000;
        setTimeout(() => {
            console.log(`Waiting for ${rand / 1000} seconds.`);
            resolve();
        }, rand);
    });
}

function bigSleep() {
    return new Promise((resolve) => {
        const rand = Math.floor(Math.random() * 5000) + 10000;
        setTimeout(() => {
            console.log(`Waiting for ${rand / 1000} seconds.`);
            resolve();
        }, rand);
    });
}

module.exports = {
    littleSleep,
    bigSleep,
};
