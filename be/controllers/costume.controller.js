const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const getAllCostumes = async (req, res, next) => {
  try {
    const costumes = await Costume.find()
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ costumes });
  } catch (err) {
    return next(new HttpError(err.message || "Fetching costumes failed.", 500));
  }
};

const getCostumeById = async (req, res, next) => {
  try {
    const costume = await Costume.findById(req.params.id).populate("categoryId", "name");
    if (!costume) {
      return next(new HttpError("Costume not found.", 404));
    }
    res.status(200).json({ costume });
  } catch (err) {
    return next(new HttpError(err.message || "Fetching costume failed.", 500));
  }
};

const createCostume = async (req, res, next) => {
  try {
    const { 
      name, slug, sku, categoryId, description, images, size, color, condition,
      rentalRates, deposit, minRentalDays, lateFeePerDay, status, specifications
    } = req.body;

    const newCostume = new Costume({
      name, slug, sku, categoryId, description, 
      images: images || [], 
      size, color, condition,
      rentalRates: rentalRates || { pricePerDay: 0 }, 
      deposit: deposit || 0, 
      minRentalDays: minRentalDays || 1, 
      lateFeePerDay: lateFeePerDay || 0, 
      status: status || "available", 
      specifications: specifications || {},
      createdBy: req.userData.id,
    });

    await newCostume.save();
    res.status(201).json({ costume: newCostume });
  } catch (err) {
    return next(new HttpError(err.message || "Creating costume failed.", 500));
  }
};

const updateCostume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, slug, sku, categoryId, description, images, size, color, condition,
      rentalRates, deposit, minRentalDays, lateFeePerDay, status, specifications
    } = req.body;

    const costume = await Costume.findById(id);
    if (!costume) {
      return next(new HttpError("Costume not found.", 404));
    }

    if (name !== undefined) costume.name = name;
    if (slug !== undefined) costume.slug = slug;
    if (sku !== undefined) costume.sku = sku;
    if (categoryId !== undefined) costume.categoryId = categoryId;
    if (description !== undefined) costume.description = description;
    if (images !== undefined) costume.images = images;
    if (size !== undefined) costume.size = size;
    if (color !== undefined) costume.color = color;
    if (condition !== undefined) costume.condition = condition;
    if (rentalRates !== undefined) costume.rentalRates = rentalRates;
    if (deposit !== undefined) costume.deposit = deposit;
    if (minRentalDays !== undefined) costume.minRentalDays = minRentalDays;
    if (lateFeePerDay !== undefined) costume.lateFeePerDay = lateFeePerDay;
    if (status !== undefined) costume.status = status;
    if (specifications !== undefined) costume.specifications = specifications;

    await costume.save();
    res.status(200).json({ costume });
  } catch (err) {
    return next(new HttpError(err.message || "Updating costume failed.", 500));
  }
};

const deleteCostume = async (req, res, next) => {
  try {
    const { id } = req.params;
    const costume = await Costume.findById(id);

    if (!costume) {
      return next(new HttpError("Costume not found.", 404));
    }

    costume.status = "hidden";
    await costume.save();

    res.status(200).json({ message: "Costume soft deleted." });
  } catch (err) {
    return next(new HttpError(err.message || "Deleting costume failed.", 500));
  }
};

module.exports = {
  getAllCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
};
