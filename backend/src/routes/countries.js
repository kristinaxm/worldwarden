// Endpoints för /api/countries

const express = require('express');
const router = express.Router();
const countryService = require('../controllers/countryController');

router.get('/', countryService.getAll);
router.get('/:id', countryService.getOne);
router.post('/', countryService.create);
router.put('/:id', countryService.update);

module.exports = router;