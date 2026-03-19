import fs from 'fs';
import PDFParser from 'pdf2json';

const pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    const text = pdfParser.getRawTextContent();
    const lines = text.split('\n');
    let output = '';
    for(let i=0; i<300; i++) {
        output += lines[i] + '\n';
    }
    fs.writeFileSync('nlem-sample.txt', output);
    console.log("Wrote 300 lines to nlem-sample.txt");
    fs.writeFileSync('nlem-full.txt', text);
});

pdfParser.loadPDF("nlem2022.pdf");
