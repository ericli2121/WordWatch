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


// Create dictionary structure: expression -> wordEntry
const jlptWordDatabase = {};

vocabArray.forEach(item => {
  const tags = item.tags;
  const expression = item.expression;
  
  // Create word entry with all fields
  const wordEntry = {
    expression: item.expression,
    reading: item.reading,
    meaning: extractBeforeComma(item.meaning),
    level: null
  };
  
  // Determine JLPT level and add to dictionary
  if (tags.includes('JLPT_N5') || tags.includes('JLPT_5')) {
    wordEntry.level = 'n5';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N4') || tags.includes('JLPT_4')) {
    wordEntry.level = 'n4';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N3') || tags.includes('JLPT_3')) {
    wordEntry.level = 'n3';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N2') || tags.includes('JLPT_2')) {
    wordEntry.level = 'n2';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N1') || tags.includes('JLPT_1')) {
    wordEntry.level = 'n1';
    jlptWordDatabase[expression] = wordEntry;
  }
});

console.log('Processing complete. Statistics:');
console.log(`Total words: ${Object.keys(jlptWordDatabase).length}`);

// Count by level
const levelCounts = { n5: 0, n4: 0, n3: 0, n2: 0, n1: 0 };
Object.values(jlptWordDatabase).forEach(wordEntry => {
  levelCounts[wordEntry.level]++;
});
console.log('Level distribution:', levelCounts);

// Save to JSON file
fs.writeFileSync('jlpt-word-database.json', JSON.stringify(jlptWordDatabase, null, 2));

console.log('Saved to jlpt-word-database.json');