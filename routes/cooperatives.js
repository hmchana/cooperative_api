const express = require('express');
const {
  getCooperative,
  getCooperatives,
  createCooperative,
  updateCooperative,
  deleteCooperative,
  getCooperativesInRadius,
  cooperativePhotoUpload,
} = require('../controllers/cooperatives');

const Cooperative = require('../models/Cooperative');

// Include other ressources routers
const productRouter = require('./products');
const reviewRouter = require('./reviews');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Re-route into other ressource routers
router.use('/:cooperativeId/products', productRouter);
router.use('/:cooperativeId/reviews', reviewRouter);

router.route('/radius/:zipcode/:distance').get(getCooperativesInRadius);

router
  .route('/:id/photo')
  .put(protect, authorize('owner', 'admin'), cooperativePhotoUpload);

router
  .route('/')
  .get(advancedResults(Cooperative, 'products'), getCooperatives)
  .post(protect, authorize('owner', 'admin'), createCooperative);

router
  .route('/:id')
  .get(getCooperative)
  .put(protect, authorize('owner', 'admin'), updateCooperative)
  .delete(protect, authorize('owner', 'admin'), deleteCooperative);

module.exports = router;
