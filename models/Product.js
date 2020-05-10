const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a product title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  cooperative: {
    // Link to other tables !!!!!!!!!
    type: mongoose.Schema.ObjectId,
    ref: 'Cooperative',
    required: true,
  },
  user: {
    // Link to other tables !!!!!!!!!
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Static method to get avg of product price
ProductSchema.statics.getAverageCost = async function (cooperativeId) {
  const obj = await this.aggregate([
    {
      $match: { cooperative: cooperativeId },
    },
    {
      $group: {
        _id: '$cooperative',
        averageCost: { $avg: '$price' },
      },
    },
  ]);

  try {
    await this.model('Cooperative').findByIdAndUpdate(cooperativeId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageCost after save
ProductSchema.post('save', async function () {
  await this.constructor.getAverageCost(this.cooperative);
});

// Call getAverageCost before remove
ProductSchema.pre('remove', async function () {
  await this.constructor.getAverageCost(this.cooperative);
});

module.exports = mongoose.model('Product', ProductSchema);
