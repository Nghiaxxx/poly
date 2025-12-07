const mongoose = require('mongoose');

const userEventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventType: { type: String, required: true }, 
  productId: { type: String },
  searchKeyword: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const UserEvent = mongoose.model('UserEvent', userEventSchema);

module.exports = UserEvent; 