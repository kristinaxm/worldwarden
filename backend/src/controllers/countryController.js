// Hanterar HTTP för countries

const countryService = require('../services/countryService');

async function getAll(req, res) {
    const countries = await countryService.getAll();
    res.json(countries);
}

async function getOne(req, res) {
    const country = await countryService.getById(req.params.id);
    if (!country) {
        return res.status(404).json({ error: 'Landet hittades inte!' });
    }
    res.json(country);
}

module.exports = {
    getAll,
    getOne
};