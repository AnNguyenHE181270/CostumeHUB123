const express = require('express');
const router = express.Router();
const { getAllCarts, removeAllCartByCustomer, addCart, updateCart, removeCartItem } = require("../controllers/cart.controller");
const { checkAuth } = require('../middlewares/check-auth.middleware');

router.get("/", checkAuth, getAllCarts)
router.post("/add-cart", checkAuth, addCart)
router.delete("/clear", checkAuth, removeAllCartByCustomer)
router.put("/update-cart/:costumeId", checkAuth, updateCart)
router.delete("/remove", checkAuth, removeCartItem)
module.exports = router