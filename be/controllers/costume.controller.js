const Costume = require("../models/costume.model");
const HttpError = require("../models/http-error.model");

const getAllCostumes = async (req, res, next) => {
  try {
    const { categoryId, subCategoryIds, minPrice, maxPrice, status, sort, page = 1, limit = 9, search } = req.query;
    const filter = { status: { $ne: "hidden" } };

    const Category = require("../models/category.model");
    let allTargetCategoryIds = [];

    // Filter by single categoryId (from route /category/:categoryId)
    if (categoryId) {
      allTargetCategoryIds.push(categoryId);
    }

    // Filter by multiple subCategoryIds (from checkboxes)
    if (subCategoryIds) {
      const ids = subCategoryIds.split(",").filter(Boolean);
      allTargetCategoryIds.push(...ids);
    }

    if (allTargetCategoryIds.length > 0) {
      // Handle dirty raw JSON imports where ObjectId is an object {$oid: "..."}
      const childCategories = await Category.find({
        $or: [
          { parentId: { $in: allTargetCategoryIds } },
          { "parentId.$oid": { $in: allTargetCategoryIds } },
          { "parentId": { $in: allTargetCategoryIds.map(id => {
              try { return new require('mongoose').Types.ObjectId(id); } 
              catch(e) { return id; }
          })}}
        ]
      });
      const childIds = childCategories.map(c => c._id.toString());
      
      const finalCategoryIds = [...new Set([...allTargetCategoryIds, ...childIds])];
      
      // Update filter to support raw $oid format in costumes collection too
      filter.$or = [
        { categoryId: { $in: finalCategoryIds } },
        { "categoryId.$oid": { $in: finalCategoryIds } },
        { categoryId: { $in: finalCategoryIds.map(id => {
            try { return new require('mongoose').Types.ObjectId(id); } 
            catch(e) { return id; }
        })}}
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter["rentalRates.pricePerDay"] = {};
      if (minPrice) filter["rentalRates.pricePerDay"].$gte = Number(minPrice);
      if (maxPrice) filter["rentalRates.pricePerDay"].$lte = Number(maxPrice);
    }

    // Filter by status (comma-separated)
    if (status) {
      if (status === "all") {
        delete filter.status;
      } else {
        const statuses = status.split(",").filter(Boolean);
        if (statuses.length > 0) {
          filter.status = { $in: statuses };
        }
      }
    }

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case "price_asc":
        sortOption = { "rentalRates.pricePerDay": 1 };
        break;
      case "price_desc":
        sortOption = { "rentalRates.pricePerDay": -1 };
        break;
      case "popular":
        sortOption = { totalRentals: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [costumes, totalItems] = await Promise.all([
      Costume.find(filter)
        .populate("categoryId", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Costume.countDocuments(filter),
    ]);

    res.status(200).json({
      costumes,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
        limit: limitNum,
      },
    });
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
