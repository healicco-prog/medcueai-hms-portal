import { runCDSAnalysis } from './src/services/geminiService';

async function test() {
  try {
    const result = await runCDSAnalysis("Suresh complains of severe stomach pain");
    console.log("Success:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error occurred:");
    console.error(err);
  }
}

test();
