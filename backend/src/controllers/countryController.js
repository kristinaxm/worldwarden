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

async function create(req, res) {
    const { code, name, capital, continent } = req.body;
    if (!code || !name) {
        return res.status(400).json({ error: 'Landskod och namn är obligatoriska fält!' });
    }
    const country = await countryService.create({ code, name, capital, continent });
    res.status(201).json(country);
}

async function update(req, res) {
    const { code, name, capital, continent } = req.body;
    if (!code || !name) {
        return res.status(400).json({ error: 'Landskod och namn är obligatoriska fält!' });
    }
    const country = await countryService.update(req.params.id, { code, name, capital, continent });
    if (!country) {
        return res.status(404).json({ error: 'Landet hittades inte!' });
    }
    res.json(country);
}
module.exports = {
    getAll,
    getOne,
    create,
    update
};