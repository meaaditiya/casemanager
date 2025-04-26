const mongoose = require('mongoose');
const stateDistrictSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    unique: true
  },
  districts: [{
    type: String,
    required: true
  }]
});
module.exports= mongoose.model('StateDistrict', stateDistrictSchema);