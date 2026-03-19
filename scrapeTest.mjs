import cheerio from 'cheerio';
import fetch from 'node-fetch';

async function scrape() {
  const url = 'https://en.wikipedia.org/wiki/List_of_medical_colleges_in_India';
  const html = await fetch(url).then(res => res.text());
  const $ = cheerio.load(html);
  
  // Let's find tables with class 'wikitable'
  $('table.wikitable').each((i, el) => {
    // get headers
    const headers = [];
    $(el).find('tr').first().find('th').each((j, th) => {
      headers.push($(th).text().trim());
    });
    console.log(`Table ${i} Headers:`, headers.join(' | '));
  });
}
scrape();
