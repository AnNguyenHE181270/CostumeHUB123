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
    const costume = await costumeService.updateCostume(req.params.id, req.body, req.userData.id);
    res.status(200).json({ costume });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Updating costume failed.', 500));
  }
};

const getInventoryCostumes = async (req, res, next) => {
  try {
    const data = await costumeService.getInventoryCostumes(req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy dữ liệu kho thất bại.', 500));
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

const getMaintenanceCostumes = async (req, res, next) => {
  try {
    if (!['staff', 'owner'].includes(req.userData.role)) {
      throw new HttpError('Bạn không có quyền thực hiện hành động này.', 403);
    }
    const costumes = await costumeService.getMaintenanceCostumes();
    res.status(200).json({ success: true, costumes });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Lấy danh sách sản phẩm bảo trì thất bại.', 500));
  }
};

const completeMaintenance = async (req, res, next) => {
  try {
    if (!['staff', 'owner'].includes(req.userData.role)) {
      throw new HttpError('Bạn không có quyền thực hiện hành động này.', 403);
    }
    const size = req.body?.size || req.query?.size;
    const unitCode = req.body?.unitCode || req.query?.unitCode;
    const costume = await costumeService.completeMaintenance(req.params.id, size, unitCode);
    res.status(200).json({ success: true, message: 'Đã cập nhật sản phẩm về trạng thái sẵn sàng cho thuê.', costume });
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(err.message || 'Cập nhật trạng thái bảo trì thất bại.', 500));
  }
};

module.exports = {
  getAllCostumes,
  getInventoryCostumes,
  getCostumeById,
  createCostume,
  updateCostume,
  deleteCostume,
  getMaintenanceCostumes,
  completeMaintenance,
};
