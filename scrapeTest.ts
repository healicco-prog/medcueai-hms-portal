import * as cheerio from 'cheerio';

async function scrape() {
  const url = 'https://en.wikipedia.org/wiki/List_of_medical_colleges_in_India';
  const html = await (await fetch(url)).text();
  const $ = cheerio.load(html);
  
  $('table.wikitable').each((i, el) => {
    const ths = $(el).find('tr').first().find('th').map((i, th) => $(th).text().trim()).get();
    if (ths.some(h => h.toLowerCase().includes('name'))) {
      console.log(`Table ${i} Headers:`, ths);
      const row = $(el).find('tr').eq(1).find('td').map((j, td) => $(td).text().trim()).get();
      console.log(`Table ${i} First Row:`, row);
    }
  });
}
scrape();
