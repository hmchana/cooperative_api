const express = require('express');
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/products');

const Product = require('../models/Product');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(
    advancedResults(Product, {
      path: 'cooperative',
      select: 'name description',
    }),
    getProducts
  )
  .post(protect, authorize('owner', 'admin'), addProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('owner', 'admin'), updateProduct)
  .delete(protect, authorize('owner', 'admin'), deleteProduct);

module.exports = router;
