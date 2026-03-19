import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrape() {
  const url = 'https://en.wikipedia.org/wiki/List_of_medical_colleges_in_India';
  const html = await (await fetch(url)).text();
  const $ = cheerio.load(html);
  
  const allInstitutions: any[] = [];

  let currentState = 'Unknown';
  
  $('*').each((i, el) => {
    if (el.tagName === 'h2' || el.tagName === 'h3') {
      const headingText = $(el).text().replace(/\[edit\]/g, '').trim();
      if (headingText && !headingText.includes('References') && !headingText.includes('See also')) {
        currentState = $(el).find('.mw-headline').text().trim() || headingText;
      }
    } else if (el.tagName === 'table' && $(el).hasClass('wikitable')) {
      const ths = $(el).find('tr').first().find('th').map((_, th) => $(th).text().replace(/\[\d+\]/g, '').trim()).get();
      
      if (ths.some(h => h.toLowerCase().includes('name')) && ths.some(h => h.toLowerCase().includes('location'))) {
        $(el).find('tr').each((j, tr) => {
          if (j === 0) return; // skip header
          
          const tds = $(tr).find('td');
          if (tds.length < 5) return; // skip incomplete rows
          
          const name = $(tds[0]).text().replace(/\[\d+\]/g, '').trim();
          const location = $(tds[1]).text().replace(/\[\d+\]/g, '').trim();
          const established = $(tds[2]).text().replace(/\[\d+\]/g, '').trim();
          const university = $(tds[3]).text().replace(/\[\d+\]/g, '').trim();
          const ownership = $(tds[4]).text().replace(/\[\d+\]/g, '').trim();
          
          if (name && name !== 'Name') {
            allInstitutions.push({
              name,
              location,
              established,
              university,
              ownership,
              state: currentState,
              type: 'Medical College'
            });
          }
        });
      }
    }
  });

  console.log(`Found ${allInstitutions.length} medical colleges across various states.`);
  
  // Now let's insert into Supabase in batches
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < allInstitutions.length; i += batchSize) {
    const batch = allInstitutions.slice(i, i + batchSize);
    const { error } = await supabase.from('institutions').insert(batch);
    if (error) {
      console.error("Error inserting batch:", error);
    } else {
      inserted += batch.length;
      console.log(`Inserted batch of ${batch.length}`);
    }
  }
  console.log(`Successfully updated ${inserted} records.`);
}
scrape().catch(console.error);
