const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  enrollmentNumber: {
    type: String,
    required: false,
    unique: true,
  },
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    required: false,
    enum: ['male', 'female', 'other'],
  },
  department: {
    type: String,
    required: false,
  },
  course: {
    type: String,
    required: false,
  },
  year: {
    type: String,
    required: false,
  },
  section: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
    required: false
  },
  signature: {
    type: String,
    required: false
  },
  student_id: {
    type: String,
    required: false,
    unique: true
  },
  public_key: {
    type: String,
    required: false
  },
  private_key: {
    type: String,
    required: false
  },
  signature_path: String,
  digital_signature: Buffer
}, { timestamps: true });


studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('Student', studentSchema);
