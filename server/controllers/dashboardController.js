const Note = require("../models/notes");
const mongoose = require("mongoose");

/**
 * GET /
 * Dashboard
 */
exports.dashboard = async (req, res) => {
  let perPage = 12;
  let page = req.query.page || 1;

  const locals = {
    title: "Dashboard",
    description: "Free NodeJS Notes App.",
  };

  try {
    const userId =new mongoose.Types.ObjectId(req.user.id);

    const notes = await Note.aggregate([
      { $match: { user: userId } },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          title: { $substr: ["$title", 0, 30] },
          body: { $substr: ["$body", 0, 100] },
        },
      }
    ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(); 

    const count = await Note.countDocuments({ user: userId });

    res.render('dashboard/index', {
      userName: req.user.firstName,
      locals,
      notes,
      layout: "../views/layouts/dashboard",
      current: page,
      pages: Math.ceil(count / perPage)
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * GET /
 * View Specific Note
 */
exports.dashboardViewNote = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const note = await Note.findOne({ _id: req.params.id, user: userId }).lean();

    if (note) {
      res.render("dashboard/view-note", {
        noteID: req.params.id,
        note,
        layout: "../views/layouts/dashboard",
      });
    } else {
      res.status(404).send("Note not found.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * PUT /
 * Update Specific Note
 */
exports.dashboardUpdateNote = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const updatedNote = {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    };

    await Note.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      updatedNote,
      { new: true }
    );

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * DELETE /
 * Delete Note
 */
exports.dashboardDeleteNote = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    await Note.deleteOne({ _id: req.params.id, user: userId });

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * GET /
 * Add Notes
 */
exports.dashboardAddNote = async (req, res) => {
  res.render("dashboard/add", {
    layout: "../views/layouts/dashboard",
  });
};

/**
 * POST /
 * Add Notes
 */
exports.dashboardAddNoteSubmit = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    req.body.user = userId;

    await Note.create(req.body);

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * GET /
 * Search
 */
exports.dashboardSearch = async (req, res) => {
  res.render("dashboard/search", {
    searchResults: "",
    layout: "../views/layouts/dashboard",
  });
};

/**
 * POST /
 * Search For Notes
 */
exports.dashboardSearchSubmit = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const searchResults = await Note.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
        { body: { $regex: new RegExp(searchNoSpecialChars, "i") } },
      ],
      user: userId
    });

    res.render("dashboard/search", {
      searchResults,
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
