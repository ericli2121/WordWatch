// run with node process-jlpt.js

const fs = require('fs');

// Read your JSON file
const vocabArray = JSON.parse(fs.readFileSync('jlpt-vocab.json', 'utf8'));

function extractBeforeComma(sentence) {
  // Remove any brackets and their contents
  const cleanedSentence = sentence.replace(/\(.*?\)/g, '');
  // Split the sentence by comma and take the first part
  const result = cleanedSentence.split(/[,;]/)[0].trim()
  return result;
}


// Create level-specific sets
/* const jlptSets = {
  N5: new Set(),
  N4: new Set(),
  N3: new Set(),
  N2: new Set(),
  N1: new Set()
};
*/
const jlptSets = new Set();
vocabArray.forEach(item => {
  const tags = item.tags;
  
  // Create object with all fields except tags
  const wordEntry = {
    expression: item.expression,
    reading: item.reading,
    meaning: extractBeforeComma(item.meaning)
  };
  
  if (tags.includes('JLPT_N5') || tags.includes('JLPT_5')) jlptSets.add({...wordEntry, level:"N5"});
  if (tags.includes('JLPT_N4') || tags.includes('JLPT_4')) jlptSets.add({...wordEntry, level:"N4"});
  if (tags.includes('JLPT_N3') || tags.includes('JLPT_3')) jlptSets.add({...wordEntry, level:"N3"});
  if (tags.includes('JLPT_N2') || tags.includes('JLPT_2')) jlptSets.add({...wordEntry, level:"N2"});
  if (tags.includes('JLPT_N1') || tags.includes('JLPT_1')) jlptSets.add({...wordEntry, level:"N1"});
});

console.log('Processing complete. Statistics:');
console.log(`words: ${jlptSets.size}`);



// Convert Set to Array for JSON serialization
const jlptArray = Array.from(jlptSets);

// Save to JSON file
fs.writeFileSync('jlpt-sets.json', JSON.stringify(jlptArray, null, 2));

console.log('Saved to jlpt-sets.json');