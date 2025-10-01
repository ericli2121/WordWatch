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
    wordEntry.level = 'N5';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N4') || tags.includes('JLPT_4')) {
    wordEntry.level = 'N4';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N3') || tags.includes('JLPT_3')) {
    wordEntry.level = 'N3';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N2') || tags.includes('JLPT_2')) {
    wordEntry.level = 'N2';
    jlptWordDatabase[expression] = wordEntry;
  } else if (tags.includes('JLPT_N1') || tags.includes('JLPT_1')) {
    wordEntry.level = 'N1';
    jlptWordDatabase[expression] = wordEntry;
  }
});

console.log('Processing complete. Statistics:');
console.log(`Total words: ${Object.keys(jlptWordDatabase).length}`);


// Save to JSON file
//fs.writeFileSync('jlpt-word-database.json', JSON.stringify(jlptWordDatabase, null, 2));

// Create JavaScript file for Chrome extension
const jsContent = `// JLPT Word Database - Generated from jlpt-word-database.json
const jlptWordDatabase = ${JSON.stringify(jlptWordDatabase, null, 2)};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = jlptWordDatabase;
} else {
  window.jlptWordDatabase = jlptWordDatabase;
}`;

fs.writeFileSync('jlpt-word-database.js', jsContent);

//console.log('Saved to jlpt-word-database.json');
console.log('Generated jlpt-word-database.js');