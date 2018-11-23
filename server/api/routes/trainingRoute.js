const express = require("express");
const router = express.Router();

const NoteController = require('../controllers/noteController');

router.get("/", NoteController.train_luis_for_entities);

module.exports = router;