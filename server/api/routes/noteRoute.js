const express = require("express");
const router = express.Router();

const NoteController = require('../controllers/noteController');

router.get("/", NoteController.notes_get_all);

router.post("/", NoteController.notes_create_note);

router.delete("/:notesId", checkAuth, NoteController.notes_deletes_note);

router.put("/:notesId", checkAuth, NoteController.notes_updates_note);

router.get("/:notesId", NoteController.notes_get_note);

module.exports = router;