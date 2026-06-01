const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const getAllCostumes = async (req, res, next) => {
  try {
    const costumes = await Costume.find()
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ costumes });
  } catch (err) {
    return next(new HttpError(err.message || "Fetching costumes failed.", 500));
  }
};

const getCostumeById = async (req, res, next) => {
  try {
    const costume = await Costume.findById(req.params.id).populate("category", "name");
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
    const { name, description, category, images, rentalPricePerDay, depositPrice, status } = req.body;

    const newCostume = new Costume({
      name,
      description,
      category,
      images: images || [],
      rentalPricePerDay,
      depositPrice: depositPrice || 0,
      status: status || "available",
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
    const { name, description, category, images, rentalPricePerDay, depositPrice, status } = req.body;

    const costume = await Costume.findById(id);
    if (!costume) {
      return next(new HttpError("Costume not found.", 404));
    }

    costume.name = name;
    costume.description = description;
    costume.category = category;
    costume.images = images || costume.images;
    costume.rentalPricePerDay = rentalPricePerDay;
    costume.depositPrice = depositPrice || costume.depositPrice;
    costume.status = status || costume.status;

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
