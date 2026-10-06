// Endpoints för /api/countries

const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

router.get('/', countryController.getAll);
router.get('/:id', countryController.getOne);
router.post('/', countryController.create);
router.put('/:id', countryController.update);

module.exports = router;