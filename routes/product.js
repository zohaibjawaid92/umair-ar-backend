const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Product = require("../models/products");
const Cart = require("../models/cart");
const stripe = require("stripe")("sk_test_51QahiRQuN9fYUGrIPeUTj3TnVtfMhzbkoX6jj2AgK9e6c8kWPAQMhZ8LQMClYinu4aPVNLsYlUfF8gY6b1H3yUi900jX1YPB10");
cloudinary.config({
  cloud_name: "dekh8kxwc",
  api_key: "367788419598357",
  api_secret: "R82rYraZnFdLukonpRBuGWlGOCQ",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  folder: "uploads/products",  // Store the images in a "products" folder
  allowedFormats: ["jpg", "jpeg", "png", "gif", "mp4", "mov"],
});

const upload = multer({ storage: storage });

// POST: Create a new product with multiple images
router.post("/product", upload.fields([
    { name: "mainProductImage", maxCount: 1 },
    { name: "GlbImage", maxCount: 1 },
  ]), async (req, res) => {
    try {
        const { name, description, price, category , discountPrice , sku, rating } = req.body;

        // Validate the required fields
        if (!name || !description || !price || !category) {
            return res.status(400).json({ success: false, msg: "Name, description, price, and category are required fields." });
        }

        // Create the product
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            discountPrice: discountPrice || 0,
            sku : sku,
            rating : rating,
            mainProductImage: req.files?.mainProductImage
            ? req.files.mainProductImage[0].path
            : null,
            GlbImage: req.files?.GlbImage ? req.files.GlbImage[0].path : null,
            productImages: [],
        });

        // Save to the database
        await newProduct.save();

        res.status(201).json({ success: true, msg: "Product created successfully.", data: newProduct });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

router.post("/products/by-category", async (req, res) => {
  try {
      const { categoryId } = req.body;

      let products;

      if (categoryId) {
          // Fetch products for the specified categoryId
          products = await Product.find({ category: categoryId })
              .populate("category", "name") // Optionally populate category details
              .sort({ createdAt: -1 }); // Sort by newest first
      } else {
          // Fetch all products from all categories
          products = await Product.find({})
              .populate("category", "name") // Optionally populate category details
              .sort({ createdAt: -1 }); // Sort by newest first
      }

      if (!products || products.length === 0) {
          return res.status(404).json({ success: false, msg: "No products found." });
      }

      res.json({ success: true, data: products });
  } catch (error) {
      console.error("Error retrieving products:", error);
      res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});


router.post(
    "/product/:productId/images",
    upload.array("productImages", 5),
    async (req, res) => {
      try {
        const { productId } = req.params;
  
        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
          return res
            .status(404)
            .json({ success: false, msg: "Product not found." });
        }
  
        // Get uploaded file paths
        const newImages = req.files.map((file) => file.path);
  
        // Append new images to the existing productImages array
        product.productImages.push(...newImages);
  
        // Save the updated product
        await product.save();
  
        res.status(200).json({
          success: true,
          msg: "Product images uploaded successfully.",
          data: product,
        });
      } catch (error) {
        console.error("Error uploading product images:", error.message);
        res.status(500).json({
          success: false,
          msg: "Internal Server Error",
          error: error.message,
        });
      }
    }
  );


router.get("/products/category/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Fetch products by categoryId
        const products = await Product.find({ category: categoryId })
            .populate("category", "name") // Optionally populate category details if necessary
            .sort({ createdAt: -1 }); // Sort by newest first (optional)

        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, msg: "No products found for this category." });
        }

        res.json({ success: true, data: products });
    } catch (error) {
        console.error("Error retrieving products by category:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});


router.get("/product/:productId", async (req, res) => {
    try {
        const { productId } = req.params;

        // Fetch the product by productId
        const product = await Product.findById(productId)
            .populate("category", "name") // Optionally populate category details if needed
            .exec();

        if (!product) {
            return res.status(404).json({ success: false, msg: "Product not found." });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error("Error retrieving product by ID:", error);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
});

router.post("/add-to-cart", async (req, res) => {
  const { productId, quantity } = req.body;

  // Validate the request
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, msg: "ProductId and quantity are required and quantity must be greater than 0." });
  }

  try {
    // Check if the product exists in the database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found." });
    }

    // Find the user's cart (for now, assuming a single cart)
    let cart = await Cart.findOne();

    if (!cart) {
      // Create a new cart if one does not exist
      cart = new Cart({
        items: [
          { productId, quantity }
        ]
      });
    } else {
      // Check if the product already exists in the cart
      const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (existingItemIndex !== -1) {
        // If product already exists, update the quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // If product does not exist, add a new item
        cart.items.push({ productId, quantity });
      }
    }

    // Save the cart to the database
    await cart.save();

    res.status(200).json({ success: true, msg: "Product added to cart successfully.", data: cart });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

router.get("/cart", async (req, res) => {
  try {
    // Find the user's cart (for now, assuming a single cart)
    const cart = await Cart.findOne().populate('items.productId', 'name description price category mainProductImage'); // Optionally populate product details

    if (!cart) {
      return res.status(404).json({ success: false, msg: "Cart not found." });
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error("Error fetching cart details:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

router.delete("/remove-from-cart", async (req, res) => {
  const { productId } = req.body;

  // Validate the request
  if (!productId) {
    return res.status(400).json({ success: false, msg: "ProductId is required." });
  }

  try {
    // Find the user's cart (assuming a single cart for now)
    const cart = await Cart.findOne();

    if (!cart) {
      return res.status(404).json({ success: false, msg: "Cart not found." });
    }

    // Find the index of the product in the cart
    const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (productIndex === -1) {
      return res.status(404).json({ success: false, msg: "Product not found in the cart." });
    }

    // Remove the product from the cart
    cart.items.splice(productIndex, 1);

    // Save the updated cart
    await cart.save();

    res.status(200).json({ success: true, msg: "Product removed from cart successfully.", data: cart });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

router.post("/create-checkout-session", async (req, res) => {
  try {
      const { items } = req.body;

      // Map cart items to Stripe line items
      const lineItems = items.map((item) => ({
          price_data: {
              currency: "usd",
              product_data: {
                  name: item.productId.name,
              },
              unit_amount: item.productId.price * 100, // Amount in cents
          },
          quantity: item.quantity,
      }));

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: lineItems,
          success_url: "http://localhost:9000/success", // Replace with your success page URL
          cancel_url: "http://localhost:9000/cancel",   // Replace with your cancel page URL
      });

      res.json({ id: session.id });
  } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
  }
});

module.exports = router;
