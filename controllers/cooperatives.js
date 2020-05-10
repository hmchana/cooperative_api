const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Cooperative = require('../models/Cooperative');

// @desc    Get all cooperatives
// @route   GET /api/v1/cooperatives
// @access  Public
exports.getCooperatives = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single cooperative
// @route   GET /api/v1/cooperatives/:id
// @access  Public
exports.getCooperative = asyncHandler(async (req, res, next) => {
  const cooperative = await Cooperative.findById(req.params.id);

  if (!cooperative) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with the id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: cooperative });
});

// @desc    Create new cooperative
// @route   POST /api/v1/cooperatives
// @access  Private
exports.createCooperative = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check for published cooperative
  const publishedCooperative = await Cooperative.findOne({ user: req.user.id });

  // If the user is not an admin, they can only add one cooperative
  if (publishedCooperative && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a cooperative`,
        400
      )
    );
  }

  const cooperative = await Cooperative.create(req.body);

  res.status(201).json({
    success: true,
    data: cooperative,
  });
});

// @desc    Update cooperative
// @route   PUT /api/v1/cooperatives/:id
// @access  Private
exports.updateCooperative = asyncHandler(async (req, res, next) => {
  let cooperative = await Cooperative.findById(req.params.id);
  if (!cooperative) {
    return next(
      new ErrorResponse(
        `Cooperative not found with the id of ${req.params.id}`,
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
        `User ${req.params.id} is not authorized to update this cooperative`,
        401
      )
    );
  }

  cooperative = await Cooperative.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: cooperative });
});

// @desc    Delete cooperative
// @route   DELETE /api/v1/cooperatives/:id
// @access  Private
exports.deleteCooperative = asyncHandler(async (req, res, next) => {
  const cooperative = await Cooperative.findById(req.params.id);
  if (!cooperative) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with the id of ${req.params.id}`,
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
        `User ${req.params.id} is not authorized to delete this cooperative`,
        401
      )
    );
  }

  cooperative.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get cooperatives within a radius
// @route   GET /api/v1/cooperatives/radius/:zipcode/:distance
// @access  Private
exports.getCooperativesInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const cooperatives = await Cooperative.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: cooperatives.length,
    data: cooperatives,
  });
});

// @desc    Upload photo for  cooperative
// @route   PUT /api/v1/cooperatives/:id/photo
// @access  Private
exports.cooperativePhotoUpload = asyncHandler(async (req, res, next) => {
  const cooperative = await Cooperative.findById(req.params.id);

  if (!cooperative) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with the id of ${req.params.id}`,
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
        `User ${req.params.id} is not authorized to delete this cooperative`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image photo is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOADS) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${cooperative._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Cooperative.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
