const express = require('express');
const router = express.Router();
const { getAllCarts, removeAllCartByCustomer, addCart } = require("../controllers/cart.controller");
const { checkAuth } = require('../middlewares/check-auth.middleware');

router.get("/", checkAuth, getAllCarts)
router.post("/add-cart", checkAuth, addCart)
router.delete("/clear", checkAuth, removeAllCartByCustomer)

module.exports = router