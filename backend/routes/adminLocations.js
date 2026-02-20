
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  getStates,
  createState,
  updateState,
  deleteState,
  getCities,
  createCity,
  updateCity,
  deleteCity,
  getAreas,
  createArea,
  updateArea,
  deleteArea
} = require('../controllers/locationsController');
// Area routes
router.route('/areas')
  .get(getAreas)
  .post(createArea);

// City routes
router.route('/cities')
  .get(getCities)
  .post(createCity);

// State routes
router.route('/states')
  .get(getStates)
  .post(createState);


  // Country routes
router.route('/countries')
  .get(getCountries)
  .post(createCountry);


// All routes require admin authentication
router.use(protect);
router.use(admin);

router.route('/countries/:id')
  .put(updateCountry)
  .delete(deleteCountry);

router.route('/states/:id')
  .put(updateState)
  .delete(deleteState);

router.route('/cities/:id')
  .put(updateCity)
  .delete(deleteCity);

router.route('/areas/:id')
  .put(updateArea)
  .delete(deleteArea);

module.exports = router;
