import axios from 'axios';
import imageToPDF, {sizes} from "image-to-pdf";
import {pipeline} from 'stream/promises';
import {createWriteStream} from "node:fs";

const getPDFIdentifierFromURL = (url: string): string => {
    let urlNoPrefix = url.startsWith('https://') ? url.substring(8) : url;

    if (urlNoPrefix.startsWith('online.anyflip.com/') || urlNoPrefix.startsWith('anyflip.com/')) {
        return `${urlNoPrefix.split('/')[1]}/${urlNoPrefix.split('/')[2]}`;
    }

    throw new Error(`Invalid URL format: ${url}`);
}

const generateURLsFromIdentifier = (identifier: string, pdfLength: number): string[] => {
    const urls = [];
    for (let i = 1; i <= pdfLength; i++) {
        urls.push(`https://online.anyflip.com/${identifier}/files/mobile/${i}.jpg`);
    }
    return urls;
}

const getImageBufferFromURL = async (imageURL: string): Promise<Buffer> => {
    console.log(`Downloading image from url : ${imageURL}`)

    const response = await axios.get(imageURL, {
        responseType: 'arraybuffer'
    });

    if (response.status !== 200) {
        throw new Error(`Failed to fetch stream from URL: ${imageURL}`);
    }

    const res = Buffer.from(response.data);

    console.log(`Successfully download image from url : ${imageURL}`)

    return res;
}

const generatePDFFromImageURLs = async (imageURLs: string[], outputName: string): Promise<void> => {
    const imagePromises = [];
    for (const url of imageURLs) {
        const imagePromise = getImageBufferFromURL(url);
        imagePromises.push(imagePromise);
    }

    const images = await Promise.all(imagePromises);

    const output = createWriteStream(`output/${outputName}.pdf`)

    await pipeline(
        imageToPDF(images, sizes.A4),
        output,
    )

}

const main = async (pdfURL: string, pdfLength: number, outputName: string): Promise<void> => {
    try {
        const identifier = getPDFIdentifierFromURL(pdfURL);
        const urls = generateURLsFromIdentifier(identifier, pdfLength);
        await generatePDFFromImageURLs(urls, outputName);
        process.exit(0);
    } catch (error) {
        console.error(`Error generating PDF: ${error.message}`);
        process.exit(1);
    }
}



main('https://online.anyflip.com/npkza/pwft/mobile/index.html', 228, 'candlekeep')