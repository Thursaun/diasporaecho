const Figure = require('../models/figure');

async function checkDupes(figure) {
  try {
    // Try exact name match
    let existingFigure = await Figure.findOne({ 
      name: { $regex: new RegExp(`^${figure.name}$`, 'i') }
    });
    
    if (existingFigure) {
      return true;
    }
    
    // Try name-and-years match
    if (figure.years && figure.years !== 'Unknown') {
      existingFigure = await Figure.findOne({
        name: { $regex: new RegExp(`^${figure.name}$`, 'i') },
        years: figure.years
      });
      
      if (existingFigure) {
        return true;
      }
    }
    
    // Try more flexible partial name matching
    const nameParts = figure.name.split(' ');
    if (nameParts.length > 1) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      existingFigure = await Figure.findOne({
        $and: [
          { name: { $regex: firstName, $options: 'i' } },
          { name: { $regex: lastName, $options: 'i' } }
        ]
      });
      
      if (existingFigure) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for duplicate:', error);
    return false; // In case of error, assume not duplicate
  }
}

module.exports = checkDupes;