const express = require('express');
const router = express.Router();

const { getAllCarts, removeAllCartByCustomer, addCart, updateCart, removeCartItem } = require("../controllers/cart.controller");
const { checkAuth } = require('../middlewares/check-auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { addCartValidator, updateCartValidator, removeCartItemValidator } = require('../validators/cart.validator');

router.get("/", checkAuth, getAllCarts)
router.post("/add-cart", checkAuth, addCartValidator, validate, addCart)
router.delete("/clear", checkAuth, removeAllCartByCustomer)
router.put("/update-cart/:costumeId", checkAuth, updateCartValidator, validate, updateCart)
router.delete("/remove", checkAuth, removeCartItemValidator, validate, removeCartItem)
module.exports = router