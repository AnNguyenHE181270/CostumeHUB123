const costumeService = require('../services/costume.service');
const HttpError = require('../models/http-error.model');

const getAllCostumes = async (req, res, next) => {
  try {
    const data = await costumeService.getAllCostumes(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching costumes failed.', 500));
  }
};

const getCostumeById = async (req, res, next) => {
  try {
    const costume = await costumeService.getCostumeById(req.params.id);
    res.status(200).json({ costume });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Fetching costume failed.', 500));
  }
};

const createCostume = async (req, res, next) => {
  try {
    const costume = await costumeService.createCostume(req.body, req.userData.id);
    res.status(201).json({ costume });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Creating costume failed.', 500));
  }
};

const updateCostume = async (req, res, next) => {
  try {
    const costume = await costumeService.updateCostume(req.params.id, req.body);
    res.status(200).json({ costume });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Updating costume failed.', 500));
  }
};

const deleteCostume = async (req, res, next) => {
  try {
    await costumeService.deleteCostume(req.params.id);
    res.status(200).json({ message: 'Costume soft deleted.' });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Deleting costume failed.', 500));
  }
};

module.exports = { getAllCostumes, getCostumeById, createCostume, updateCostume, deleteCostume };
