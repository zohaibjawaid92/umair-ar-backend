const mongoose = require("mongoose");

// Cart Item Schema to hold individual product items
const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to the Product model
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  }
});

// Cart Schema to hold an array of Cart Items and the creation date
const CartSchema = new mongoose.Schema({
  items: [CartItemSchema], // Array of CartItem
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a Cart model based on CartSchema
const Cart = mongoose.model("Cart", CartSchema);

module.exports = Cart;