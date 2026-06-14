const ghnService = require('../services/ghn.service');
const HttpError = require('../models/http-error.model');

const getProvinces = async (req, res, next) => {
    try {
        const provinces = await ghnService.getProvinces();
        res.status(200).json(provinces);
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

const getDistricts = async (req, res, next) => {
    try {
        const { provinceId } = req.query;
        if (!provinceId) return next(new HttpError("Thiếu provinceId", 400));
        const districts = await ghnService.getDistricts(parseInt(provinceId));
        res.status(200).json(districts);
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

const getWards = async (req, res, next) => {
    try {
        const { districtId } = req.query;
        if (!districtId) return next(new HttpError("Thiếu districtId", 400));
        const wards = await ghnService.getWards(parseInt(districtId));
        res.status(200).json(wards);
    } catch (error) {
        next(new HttpError(error.message, 500));
    }
};

module.exports = {
    getProvinces,
    getDistricts,
    getWards
};
