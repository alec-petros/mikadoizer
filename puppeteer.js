const puppeteer = require('puppeteer');
const adblocker = require('@cliqz/adblocker-puppeteer');
const { PuppeteerBlocker } = adblocker;
const fetch = require('cross-fetch'); // required 'fetch'
const path = require('path');
const getColors = require('get-image-colors');

// const videoId = process.env.VIDEO;

const venomArray = [];

function hexColorDelta(hex1, hex2) {
    // get red/green/blue int values of hex1
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    // get red/green/blue int values of hex2
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    // calculate differences between reds, greens and blues
    let r = 255 - Math.abs(r1 - r2);
    let g = 255 - Math.abs(g1 - g2);
    let b = 255 - Math.abs(b1 - b2);
    // limit differences between 0 and 1
    r /= 255;
    g /= 255;
    b /= 255;
    // 0 means opposit colors, 1 means same colors
    // console.log(hex1, hex2);
    return (r + g + b) / 3;
}

function parseColorsForMatch(colorArray) {
    let hit = false;
    colorArray.forEach(color => {
        const colorHex = color.hex().substring(1, 7);
        venomHexArray.forEach(venCol => {
            const delta = hexColorDelta(colorHex, venCol)
            // console.log(`comparing ${colorHex} to ${venCol}, ${delta}`)

            // Tweak delta comparison to increase specificity
            if (delta > 0.96) {
                hit = [colorHex, venCol];
            }
        });
    });
    
    return hit;
}

async function skipAndGrab(page, validator) {
    const element = await page.$("#current-time");
    await page.click('#skip');
    await page.waitForFunction('document.getElementById("active").getAttribute("value") == "true"');
    const videoIdElement = await page.$('#video');
    const videoId = await page.evaluate(element => element.textContent, videoIdElement);
    const time = await page.evaluate(element => element.textContent, element);
    await page.screenshot({ path: `./.image-a.jpg`, type: 'jpeg', clip: { x: 45, y: 61, width: 3, height: 1 } });
    await page.screenshot({ path: `./.image-b.jpg`, type: 'jpeg', clip: { x: 573, y: 61, width: 3, height: 1 } });
    await validator(`.image-a.jpg`, time, page, videoId);
    await validator(`.image-b.jpg`, time, page, videoId);
}

async function isVenom(imgPath, time, page, videoId) {
    await getColors(path.join(__dirname, imgPath)).then(async colors => {
        const match = parseColorsForMatch(colors);
        if (!!match.length) {
            console.log(`https://youtu.be/${videoId}?t=${Math.round(time)} `);
            await page.screenshot({ path: `./hit-${time}.jpg`, type: 'jpeg'});
            venomArray.push(time);
        }
    })
}

async function captureAll(imgPath, time, page, videoId) {
    await getColors(path.join(__dirname, imgPath)).then(async colors => {
        await page.screenshot({ path: `./hit-${time}.jpg`, type: 'jpeg'});
        console.log(colors.map(color => color.hex()));
    })
}

async function isPlaying(page) {
    const element = await page.$("#state");
    const state = await page.evaluate(element => element.textContent, element);
    return state == 'active';
}

async function run() {
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();
    PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInPage(page);
    });
    
    await page.setViewport({ width: 1080, height: 720 });
    console.log(`file://${__dirname}/index.html`)
    if (process.env.VIDEO) {
        await page.goto(`file://${__dirname}/index.html?video=${process.env.VIDEO}`);
    } else {
        await page.goto(`file://${__dirname}/index.html`);
    }
    await page.click('#play');
    // await page.click('#skip');
    // await page.waitForFunction('document.getElementById("active").getAttribute("value") == "true"');
    // await page.screenshot({ path: './image.jpg', type: 'jpeg'});
    if (process.env.MODE === 'captureAll') {
        while (isPlaying(page)) {
            await skipAndGrab(page, captureAll);
            console.log('~~~');
        }
    } else {
        while (isPlaying(page)) {
            await skipAndGrab(page, isVenom);
        }
    }

    // await getColors(path.join(__dirname, '.image-a.jpg')).then(colors => {
    //     console.log(colors[0].hex());
    // })
    console.log(venomArray);
    // await browser.close();
}

run();

const venomHexArray = [
    // '282044',
    // '24283c',
    '10183c',
    '101c40',
    '141c40',
    '242844',
    // '100c08',
    // '101840',
];

const baikenHexArray = [
    '#543424',
];

const solHexArray = [
    '#0c0c0c',
    '#100404',
]