const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Product = require('../models/Product');
const Cooperative = require('../models/Cooperative');

// @desc      Get products
// @route     GET /api/v1/products
// @route     GET /api/v1/cooperatives/:cooperativeId/products
// @access    Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  if (req.params.cooperativeId) {
    const products = await Product.find({
      cooperative: req.params.cooperativeId,
    });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: products,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single product
// @route     GET /api/v1/products/:id
// @access    Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: 'cooperative',
    select: 'name description',
  });
  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.params.id}`),
      404
    );
  }
  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc      Add product
// @route     POST /api/v1/cooperatives/:cooperativeId/products
// @access    Private
exports.addProduct = asyncHandler(async (req, res, next) => {
  req.body.cooperative = req.params.cooperativeId;
  req.body.user = req.user.id;

  const cooperative = await Cooperative.findById(req.params.cooperativeId);

  if (!cooperative) {
    return next(
      new ErrorResponse(
        `No cooperative with the id of ${req.params.cooperativeId}`,
        404
      )
    );
  }

  // Make sur user is cooperative owner
  if (
    cooperative.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a product to  cooperative ${cooperative._id}`,
        401
      )
    );
  }

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc      Update product
// @route     PUT /api/v1/products/:id
// @access    Private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.params.id}`, 404)
    );
  }

  // Make sur user is product owner
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update product ${product._id}`,
        401
      )
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc      Delete product
// @route     DELETE /api/v1/products/:id
// @access    Private
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.params.id}`, 404)
    );
  }

  // Make sur user is product owner
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete product ${product._id}`,
        401
      )
    );
  }

  await product.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
