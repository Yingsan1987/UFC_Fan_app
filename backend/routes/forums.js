const express = require('express');
const Forum = require('../models/Forum');
const ForumComment = require('../models/ForumComment');

const router = express.Router();

// Create forum
router.post('/', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const forum = await Forum.create({ title, content, author });
    res.status(201).json(forum);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List forums (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Forum.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Forum.countDocuments(),
    ]);

    res.json({
      forums: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page * limit < total,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Like a forum
router.post('/:id/like', async (req, res) => {
  try {
    const updated = await Forum.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Forum not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get comments for a forum
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await ForumComment.find({ forumId: req.params.id })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a comment to a forum
router.post('/:id/comments', async (req, res) => {
  try {
    const { content, author } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ error: 'Forum not found' });

    const comment = await ForumComment.create({ forumId: forum._id, content, author });
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Like a comment
router.post('/:id/comments/:commentId/like', async (req, res) => {
  try {
    const updated = await ForumComment.findByIdAndUpdate(
      req.params.commentId,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Comment not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;




