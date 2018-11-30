const express = require("express");
const router = express.Router();

const NoteController = require('../controllers/noteController');

router.get("/", NoteController.publish_changes_for_luis);

module.exports = router;