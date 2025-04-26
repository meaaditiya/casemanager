const mongoose = require('mongoose');
const EnrollmentSchema = new mongoose.Schema({
    ENROLLMENT_NO: String,
    NAME_OF_ADVOCATE: String,
    FATHERS_NAME_OF_ADVOCATE: String,
    ADDRESS_OF_ADVOCATE: String,
    DISTRICT: String,
    DATE_OF_REGISTRATION: String,
    DATE_OF_BIRTH: String
});

module.exports= mongoose.model('EnrollmentRecord', EnrollmentSchema);