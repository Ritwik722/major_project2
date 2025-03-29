const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const forge = require('node-forge');

const studentSchema = new mongoose.Schema({
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
  },
  department: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
  },
  signature: {
    type: String,
  },
  publicKey: {
    type: String,
    required: false
  },

  privateKey: {
    type: String,
    required: false,
    select: false  // This ensures the private key isn't returned in queries
  },
  digitalSignature: {
    type: String,
    required: false
  },
  isSignatureVerified: {
    type: Boolean,
    default: false
  }
});


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

studentSchema.methods.generateKeyPair = function() {
  const rsa = forge.pki.rsa;
  const keypair = rsa.generateKeyPair({ bits: 2048, workers: 2 });
  
  this.publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  this.privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
  
  return {
    publicKey: this.publicKey,
    privateKey: this.privateKey
  };
};

// Add method to sign data
studentSchema.methods.createDigitalSignature = function(data) {
  const privateKey = forge.pki.privateKeyFromPem(this.privateKey);
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
};

// Add method to verify signature
studentSchema.methods.verifySignature = function(data, signature) {
  const publicKey = forge.pki.publicKeyFromPem(this.publicKey);
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  try {
    return publicKey.verify(
      md.digest().bytes(),
      forge.util.decode64(signature)
    );
  } catch (error) {
    return false;
  }
};

module.exports = mongoose.model('Student', studentSchema);
