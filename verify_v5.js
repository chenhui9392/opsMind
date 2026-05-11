const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

async function main() {
  const pres = new pptxgen();
  pres.loadExisting = function() {};
  
  const fileBuf = fs.readFileSync(path.join(__dirname, "海豚-技术分享-v5.pptx"));
  
  const pptx = require("pptxgenjs");
  const p = new pptx();
  
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(fileBuf);
  
  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)[1]);
      const nb = parseInt(b.match(/slide(\d+)/)[1]);
      return na - nb;
    });
  
  console.log(`Total slides: ${slideFiles.length}`);
  
  for (const sf of slideFiles) {
    const content = await zip.file(sf).async("string");
    const texts = [];
    const regex = /<a:t>([^<]+)<\/a:t>/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      texts.push(match[1]);
    }
    const slideNum = sf.match(/slide(\d+)/)[1];
    console.log(`\nSlide ${slideNum}: ${texts.join(" | ")}`);
  }
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
